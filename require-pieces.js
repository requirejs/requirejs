/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 0.14.5 Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
//laxbreak is true to allow build pragmas to change some statements.
/*jslint plusplus: false, nomen: false, laxbreak: true, regexp: false */
/*global window: false, document: false, navigator: false,
setTimeout: false, traceDeps: true, clearInterval: false, self: false,
setInterval: false, importScripts: false, jQuery: false */
"use strict";

var require, define;
(function () {
    //Change this version number for each release.
    var s,
            i, defContextName = "_", contextLoads = [], empty = {},
            scripts, script, rePkg, src, m, dataMain, cfg = {}, setReadyState,
            main,
            isBrowser = !!(typeof window !== "undefined" && navigator && document),
            isWebWorker = !isBrowser && typeof importScripts !== "undefined",
            
            scrollIntervalId, req, baseElement,
            defQueue = [], currentlyAddingScript;

    //>>excludeStart("requireExcludePlugin", pragmas.requireExcludePlugin);
    /**
     * Calls a method on a plugin. The obj object should have two property,
     * name: the name of the method to call on the plugin
     * args: the arguments to pass to the plugin method.
     */
    function callPlugin(prefix, context, obj) {
        //Call the plugin, or load it.
        var plugin = s.plugins.defined[prefix], waiting;
        if (plugin) {
            plugin[obj.name].apply(null, obj.args);
        } else {
            //Put the call in the waiting call BEFORE requiring the module,
            //since the require could be synchronous in some environments,
            //like builds
            waiting = s.plugins.waiting[prefix] || (s.plugins.waiting[prefix] = []);
            waiting.push(obj);

            //Load the module
            req(["require/" + prefix], context.contextName);
        }
    }
    //>>excludeEnd("requireExcludePlugin");

    //>>excludeStart("requireExcludePlugin", pragmas.requireExcludePlugin);
    /**
     * Sets up a plugin callback name. Want to make it easy to test if a plugin
     * needs to be called for a certain lifecycle event by testing for
     * if (s.plugins.onLifeCyleEvent) so only define the lifecycle event
     * if there is a real plugin that registers for it.
     */
    function makePluginCallback(name, returnOnTrue) {
        var cbs = s.plugins.callbacks[name] = [];
        s.plugins[name] = function () {
            for (var i = 0, cb; (cb = cbs[i]); i++) {
                if (cb.apply(null, arguments) === true && returnOnTrue) {
                    return true;
                }
            }
            return false;
        };
    }

    /**
     * Registers a new plugin for require.
     */
    req.plugin = function (obj) {
        var i, prop, call, prefix = obj.prefix, cbs = s.plugins.callbacks,
            waiting = s.plugins.waiting[prefix], generics,
            defined = s.plugins.defined, contexts = s.contexts, context;

        //Do not allow redefinition of a plugin, there may be internal
        //state in the plugin that could be lost.
        if (defined[prefix]) {
            return req;
        }

        //Save the plugin.
        defined[prefix] = obj;

        //Set up plugin callbacks for methods that need to be generic to
        //require, for lifecycle cases where it does not care about a particular
        //plugin, but just that some plugin work needs to be done.
        generics = ["newContext", "isWaiting", "orderDeps"];
        for (i = 0; (prop = generics[i]); i++) {
            if (!s.plugins[prop]) {
                makePluginCallback(prop, prop === "isWaiting");
            }
            cbs[prop].push(obj[prop]);
        }

        //Call newContext for any contexts that were already created.
        if (obj.newContext) {
            for (prop in contexts) {
                if (!(prop in empty)) {
                    context = contexts[prop];
                    obj.newContext(context);
                }
            }
        }

        //If there are waiting requests for a plugin, execute them now.
        if (waiting) {
            for (i = 0; (call = waiting[i]); i++) {
                if (obj[call.name]) {
                    obj[call.name].apply(null, call.args);
                }
            }
            delete s.plugins.waiting[prefix];
        }

        return req;
    };
    //>>excludeEnd("requireExcludePlugin");

    //>>excludeStart("requireExcludeModify", pragmas.requireExcludeModify);
    /**
     * Register a module that modifies another module. The modifier will
     * only be called once the target module has been loaded.
     *
     * First syntax:
     *
     * require.modify({
     *     "some/target1": "my/modifier1",
     *     "some/target2": "my/modifier2",
     * });
     *
     * With this syntax, the my/modifier1 will only be loaded when
     * "some/target1" is loaded.
     *
     * Second syntax, defining a modifier.
     *
     * require.modify("some/target1", "my/modifier",
     *                        ["some/target1", "some/other"],
     *                        function (target, other) {
     *                            //Modify properties of target here.
     *                            Only properties of target can be modified, but
     *                            target cannot be replaced.
     *                        }
     * );
     */
    req.modify = function (target, name, deps, callback, contextName) {
        var prop, modifier, list,
                cName = (typeof target === "string" ? contextName : name) || s.ctxName,
                context = s.contexts[cName],
                mods = context.modifiers;

        if (typeof target === "string") {
            //A modifier module.
            //First store that it is a modifier.
            list = mods[target] || (mods[target] = []);
            if (!list[name]) {
                list.push(name);
                list[name] = true;
            }

            //Trigger the normal module definition logic if the target
            //is already in the system.
            if (context.specified[target]) {
                req.def(name, deps, callback, contextName);
            } else {
                //Hold on to the execution/dependency checks for the modifier
                //until the target is fetched.
                (list.__deferMods || (list.__deferMods = [])).push([name, deps, callback, contextName]);
            }
        } else {
            //A list of modifiers. Save them for future reference.
            for (prop in target) {
                if (!(prop in empty)) {
                    //Store the modifier for future use.
                    modifier = target[prop];
                    list = mods[prop] || (context.modifiers[prop] = []);
                    if (!list[modifier]) {
                        list.push(modifier);
                        list[modifier] = true;

                        if (context.specified[prop]) {
                            //Load the modifier right away.
                            req([modifier], cName);
                        }
                    }
                }
            }
        }
    };
    //>>excludeEnd("requireExcludeModify");

    //>>excludeStart("requireExcludeModify", pragmas.requireExcludeModify);
    /**
     * Executes modifiers for the given module name.
     * @param {String} target
     * @param {Object} traced
     * @param {Object} context
     *
     * @private
     */
    req.execModifiers = function (target, traced, waiting, context) {
        var modifiers = context.modifiers, mods = modifiers[target], mod, i;
        if (mods) {
            for (i = 0; i < mods.length; i++) {
                mod = mods[i];
                //Not all modifiers define a module, they might collect other modules.
                //If it is just a collection it will not be in waiting.
                if (mod in waiting) {
                    req.exec(waiting[waiting[mod]], traced, waiting, context);
                }
            }
            delete modifiers[target];
        }
    };
    //>>excludeEnd("requireExcludeModify");

}());
