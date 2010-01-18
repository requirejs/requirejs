/**
 * @license RunJS Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/runjs for details
 */
//laxbreak is true to allow build pragmas to change some statements.
/*jslint plusplus: false, laxbreak: true */
/*global window: false, document: false, navigator: false,
setTimeout: false, traceDeps: true, clearInterval: false, self: false,
setInterval: false */

//>>excludeStart("dojoConvert", pragmas.dojoConvert);
"use strict";
//>>excludeEnd("dojoConvert");

var run;
(function () {
    //Change this version number for each release.
    var version = "0.0.7",
            empty = {}, s,
            i, defContextName = "_", contextLoads = [],
            scripts, script, rePkg, src, m, cfg,
            readyRegExp = /^(complete|loaded)$/,
            isBrowser = !!(typeof window !== "undefined" && navigator && document),
            ostring = Object.prototype.toString, scrollIntervalId;

    function isFunction(it) {
        return ostring.call(it) === "[object Function]";
    }

    //Check for an existing version of run. If so, then exit out. Only allow
    //one version of run to be active in a page. However, allow for a run
    //config object, just exit quickly if run is an actual function.
    if (typeof run !== "undefined") {
        if (isFunction(run)) {
            return;
        } else {
            //assume it is a config object.
            cfg = run;
        }
    }

    //>>excludeStart("runExcludeContext", pragmas.runExcludeContext);
    function makeContextFunc(name, contextName, force) {
        return function () {
            //A version of a run function that uses the current context.
            //If last arg is a string, then it is a context.
            //If last arg is not a string, then add context to it.
            var args = [].concat(Array.prototype.slice.call(arguments, 0));
            if (force || typeof arguments[arguments.length - 1] !== "string") {
                args.push(contextName);
            }
            return (name ? run[name] : run).apply(null, args);
        };
    }
    //>>excludeEnd("runExcludeContext");
    
    //>>excludeStart("runExcludePlugin", pragmas.runExcludePlugin);
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
            //Load the module and add the call to waitin queue.
            context.defined.run(["run/" + prefix]);
            waiting = s.plugins.waiting[prefix] || (s.plugins.waiting[prefix] = []);
            waiting.push(obj);
        }
    }
    //>>excludeEnd("runExcludePlugin");

    /**
     * The function that loads modules or executes code that has dependencies
     * on other modules.
     */
    run = function (deps, callback, contextName) {
        if (typeof deps === "string") {
            throw new Error("Use run.def() to define modules");
        }
        return run.def.apply(run, arguments);
    }

    /**
     * The function that handles definitions of modules. Differs from
     * run() in that a string for the module should be the first argument,
     * and the function to execute after dependencies are loaded should
     * return a value to define the module corresponding to the first argument's
     * name.
     */
    run.def = function (name, deps, callback, contextName) {
        var config = null, context, newContext, contextRun, loaded,
            canSetContext, prop, newLength,
            mods, pluginPrefix, paths, index;

        //Normalize the arguments.
        if (typeof name === "string") {
            //Defining a module. First, pull off any plugin prefix.
            index = name.indexOf("!");
            if (index !== -1) {
                pluginPrefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
            }

            //Check if there are no dependencies, and adjust args.
            if (!run.isArray(deps)) {
                contextName = callback;
                callback = deps;
                deps = [];
            }

            contextName = contextName || s.ctxName;

            //If module already defined for context, or already waiting to be
            //evaluated, leave.
            context = s.contexts[contextName];
            if (context && (context.defined[name] || context.waiting[name])) {
                return run;
            }
        } else if (run.isArray(name)) {
            //Just some code that has dependencies. Adjust args accordingly.
            contextName = callback;
            callback = deps;
            deps = name;
            name = null;
        } else if (run.isFunction(name)) {
            //Just a function that does not define a module and
            //does not have dependencies. Useful if just want to wait
            //for whatever modules are in flight and execute some code after
            //those modules load.
            callback = name;
            contextName = deps;
            name = null;
            deps = [];
        } else {
            //name is a config object.
            config = name;
            name = null;
            //Adjust args if no dependencies.
            if (run.isFunction(deps)) {
                contextName = callback;
                callback = deps;
                deps = [];
            }

            contextName = contextName || config.context;
        }

        contextName = contextName || s.ctxName;

        //>>excludeStart("runExcludeContext", pragmas.runExcludeContext);
        if (contextName !== s.ctxName) {
            //If nothing is waiting on being loaded in the current context,
            //then switch s.ctxName to current contextName.
            loaded = (s.contexts[s.ctxName] && s.contexts[s.ctxName].loaded);
            canSetContext = true;
            if (loaded) {
                for (prop in loaded) {
                    if (!(prop in empty)) {
                        if (!loaded[prop]) {
                            canSetContext = false;
                            break;
                        }
                    }
                }
            }
            if (canSetContext) {
                s.ctxName = contextName;
            }
        }
        //>>excludeEnd("runExcludeContext");

        //Grab the context, or create a new one for the given context name.
        context = s.contexts[contextName];
        if (!context) {
            newContext = {
                contextName: contextName,
                config: {
                    waitSeconds: 7,
                    baseUrl: s.baseUrl || "./",
                    paths: {}
                },
                waiting: [],
                specified: {
                    "run": true
                },
                loaded: {
                    "run": true
                },
                defined: {},
                modifiers: {}
            };

            //Define run for this context.
            //>>includeStart("runExcludeContext", pragmas.runExcludeContext);
            //A placeholder for build pragmas.
            newContext.defined.run = run;
            //>>includeEnd("runExcludeContext");
            //>>excludeStart("runExcludeContext", pragmas.runExcludeContext);
            newContext.defined.run = contextRun = makeContextFunc(null, contextName);
            run.mixin(contextRun, {
                //>>excludeStart("runExcludeModify", pragmas.runExcludeModify);
                modify: makeContextFunc("modify", contextName),
                def: makeContextFunc("def", contextName),
                //>>excludeEnd("runExcludeModify");
                get: makeContextFunc("get", contextName, true),
                nameToUrl: makeContextFunc("nameToUrl", contextName, true),
                ready: run.ready,
                context: newContext,
                config: newContext.config,
                isBrowser: s.isBrowser
            });
            //>>excludeEnd("runExcludeContext");

            //>>excludeStart("runExcludePlugin", pragmas.runExcludePlugin);
            if (s.plugins.newContext) {
                s.plugins.newContext(newContext);
            }
            //>>excludeEnd("runExcludePlugin");

            context = s.contexts[contextName] = newContext;
        }

        //If have a config object, update the context's config object with
        //the config values.
        if (config) {
            //Make sure the baseUrl ends in a slash.
            if (config.baseUrl) {
                if (config.baseUrl.charAt(config.baseUrl.length - 1) !== "/") {
                    config.baseUrl += "/";
                }
            }

            //Save off the paths since they require special processing,
            //they are additive.
            paths = context.config.paths;

            //Mix in the config values, favoring the new values over
            //existing ones in context.config.
            run.mixin(context.config, config, true);

            //Adjust paths if necessary.
            if (config.paths) {
                for (prop in config.paths) {
                    if (!(prop in empty)) {
                        paths[prop] = config.paths[prop];
                    }
                }
                context.config.paths = paths;
            }

            //If it is just a config block, nothing else,
            //then return.
            if (!deps) {
                return run;
            }
        }

        //Store the module for later evaluation
        newLength = context.waiting.push({
            name: name,
            deps: deps,
            callback: callback
        });

        if (name) {
            //Store index of insertion for quick lookup
            context.waiting[name] = newLength - 1;

            //Mark the module as specified: not loaded yet, but in the process,
            //so no need to fetch it again. Important to do it here for the
            //pause/resume case where there are multiple modules in a file.
            context.specified[name] = true;

            //>>excludeStart("runExcludeModify", pragmas.runExcludeModify);
            //Load any modifiers for the module.
            mods = context.modifiers[name];
            if (mods) {
                run(mods, contextName);
            }
            //>>excludeEnd("runExcludeModify");
        }

        //If the callback is not an actual function, it means it already
        //has the definition of the module as a literal value.
        if (name && callback && !run.isFunction(callback)) {
            context.defined[name] = callback;
        }

        //If a pluginPrefix is available, call the plugin, or load it.
        //>>excludeStart("runExcludePlugin", pragmas.runExcludePlugin);
        if (pluginPrefix) {
            callPlugin(pluginPrefix, context, {
                name: "run",
                args: [name, deps, callback, context]
            });
        }
        //>>excludeEnd("runExcludePlugin");

        //See if all is loaded. If paused, then do not check the dependencies
        //of the module yet.
        if (s.paused) {
            s.paused.push([pluginPrefix, name, deps, context]);
        } else {
            run.checkDeps(pluginPrefix, name, deps, context);
            run.checkLoaded(contextName);
        }

        return run;
    };

    /**
     * Fetches the defined module given by name. Should only be used in
     * circular dependency cases. The module should already be loaded,
     * this function will throw an error if the module has not been loaded yet.
     *
     * @param {String} name The module name.
     * @param {String} [contextName] optional context name to use.
     */
    run.get = function (name, contextName) {
        contextName = contextName || s.ctxName;
        var ret = s.contexts[contextName].defined[name];
        if (ret === undefined) {
            throw new Error("run.get: module name '" +
                            name +
                            "' has not been loaded yet for context: " +
                            contextName);
        }
        return ret;
    };

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     */
    run.mixin = function (target, source, override) {
        for (var prop in source) {
            if (!(prop in empty) && (!(prop in target) || override)) {
                target[prop] = source[prop];
            }
        }
        return run;
    };

    run.version = version;

    //Set up page state.
    s = run.s = {
        ctxName: defContextName,
        contexts: {},
        //>>excludeStart("runExcludePlugin", pragmas.runExcludePlugin);
        plugins: {
            defined: {},
            callbacks: {},
            waiting: {}
        },
        //>>excludeEnd("runExcludePlugin");
        isBrowser: isBrowser,
        isPageLoaded: !isBrowser,
        readyCalls: [],
        doc: isBrowser ? document : null
    };

    run.isBrowser = s.isBrowser;
    s.head = isBrowser ? document.getElementsByTagName("head")[0] : null;

    //>>excludeStart("runExcludePlugin", pragmas.runExcludePlugin);
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
     * Registers a new plugin for run.
     */
    run.plugin = function (obj) {
        var i, prop, call, prefix = obj.prefix, cbs = s.plugins.callbacks,
            waiting = s.plugins.waiting[prefix], generics,
            defined = s.plugins.defined, contexts = s.contexts, context;

        //Do not allow redefinition of a plugin, there may be internal
        //state in the plugin that could be lost.
        if (defined[prefix]) {
            return run;
        }

        //Save the plugin.
        defined[prefix] = obj;

        //Set up plugin callbacks for methods that need to be generic to
        //run, for lifecycle cases where it does not care about a particular
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

        return run;
    };
    //>>excludeEnd("runExcludePlugin");

    /**
     * Pauses the tracing of dependencies. Useful in a build scenario when
     * multiple modules are bundled into one file, and they all need to be
     * run before figuring out what is left still to load.
     */
    run.pause = function () {
        if (!s.paused) {
            s.paused = [];
        }
    };

    /**
     * Resumes the tracing of dependencies. Useful in a build scenario when
     * multiple modules are bundled into one file. This method is related
     * to run.pause() and should only be called if run.pause() was called first.
     */
    run.resume = function () {
        var i, args, paused;
        if (s.paused) {
            paused = s.paused;
            delete s.paused;
            for (i = 0; (args = paused[i]); i++) {
                run.checkDeps.apply(run, args);
            }
        }
        run.checkLoaded(s.ctxName);
    };

    /**
     * Run down the dependencies to see if they are loaded. If not, trigger
     * the load.
     * @param {String} pluginPrefix the plugin prefix, if any associated with the name.
     *
     * @param {String} name: the name of the module that has the dependencies.
     *
     * @param {Array} deps array of dependencies.
     *
     * @param {Object} context: the loading context.
     *
     * @private
     */
    run.checkDeps = function (pluginPrefix, name, deps, context) {
        //Figure out if all the modules are loaded. If the module is not
        //being loaded or already loaded, add it to the "to load" list,
        //and request it to be loaded.
        var i, dep, index, depPrefix;

        if (pluginPrefix) {
            //>>excludeStart("runExcludePlugin", pragmas.runExcludePlugin);
            callPlugin(pluginPrefix, context, {
                name: "checkDeps",
                args: [name, deps, context]
            });
            //>>excludeEnd("runExcludePlugin");
        } else {
            for (i = 0; (dep = deps[i]); i++) {
                //If it is a string, then a plain dependency
                if (typeof dep === "string") {
                    if (!context.specified[dep]) {
                        context.specified[dep] = true;

                        //If a plugin, call its load method.
                        index = dep.indexOf("!");
                        if (index !== -1) {
                            //>>excludeStart("runExcludePlugin", pragmas.runExcludePlugin);
                            depPrefix = dep.substring(0, index);
                            dep = dep.substring(index + 1, dep.length);

                            callPlugin(depPrefix, context, {
                                name: "load",
                                args: [dep, context.contextName]
                            });
                            //>>excludeEnd("runExcludePlugin");
                        } else {
                            run.load(dep, context.contextName);
                        }
                    }
                } else {
                    throw new Error("Unsupported non-string dependency: " + dep);
                }
            }
        }
    };

    //>>excludeStart("runExcludeModify", pragmas.runExcludeModify);
    /**
     * Register a module that modifies another module. The modifier will
     * only be called once the target module has been loaded.
     *
     * First syntax:
     *
     * run.modify({
     *     "some/target1": "my/modifier1",
     *     "some/target2": "my/modifier2",
     * });
     *
     * With this syntax, the my/modifier1 will only be loaded when
     * "some/target1" is loaded.
     *
     * Second syntax, defining a modifier.
     *
     * run.modify("some/target1", "my/modifier",
     *                        ["some/target1", "some/other"],
     *                        function (target, other) {
     *                            //Modify properties of target here.
     *                            Only properties of target can be modified, but
     *                            target cannot be replaced.
     *                        }
     * );
     */
    run.modify = function (target, name, deps, callback, contextName) {
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

            //Trigger the normal module definition logic.
            run.def(name, deps, callback, contextName);
        } else {
            //A list of modifiers. Save them for future reference.
            for (prop in target) {
                if (!(prop in empty)) {
                    //Store the modifier for future use.
                    modifier = target[prop];
                    list = context.modifiers[prop] || (context.modifiers[prop] = []);
                    if (!list[modifier]) {
                        list.push(modifier);
                        list[modifier] = true;

                        if (context.specified[prop]) {
                            //Load the modifier right away.
                            run([modifier], cName);
                        }
                    }
                }
            }
        }
    };
    //>>excludeEnd("runExcludeModify");

    run.isArray = function (it) {
        return ostring.call(it) === "[object Array]";
    };

    run.isFunction = isFunction;

    /**
     * Makes the request to load a module. May be an async load depending on
     * the environment and the circumstance of the load call.
     */
    run.load = function (moduleName, contextName) {
        var context = s.contexts[contextName], url;
        s.isDone = false;
        context.loaded[moduleName] = false;
        //>>excludeStart("runExcludeContext", pragmas.runExcludeContext);
        if (contextName !== s.ctxName) {
            //Not in the right context now, hold on to it until
            //the current context finishes all its loading.
            contextLoads.push(arguments);
        } else {
        //>>excludeEnd("runExcludeContext");
            //First derive the path name for the module.
            url = run.nameToUrl(moduleName, null, contextName);
            run.attach(url, contextName, moduleName);
            context.startTime = (new Date()).getTime();
        //>>excludeStart("runExcludeContext", pragmas.runExcludeContext);
        }
        //>>excludeEnd("runExcludeContext");
    };

    run.jsExtRegExp = /\.js$/;

    /**
     * Converts a module name to a file path.
     */
    run.nameToUrl = function (moduleName, ext, contextName) {
        var paths, syms, i, parentModule, url,
            config = s.contexts[contextName].config;

        if (run.jsExtRegExp.test(moduleName)) {
            //Just a plain path, not module name lookup, so just return it.
            return moduleName;
        } else {
            //A module that needs to be converted to a path.
            paths = config.paths;

            syms = moduleName.split("/");
            //For each module name segment, see if there is a path
            //registered for it. Start with most specific name
            //and work up from it.
            for (i = syms.length; i > 0; i--) {
                parentModule = syms.slice(0, i).join("/");
                if (paths[parentModule]) {
                    syms.splice(0, i, paths[parentModule]);
                    break;
                }
            }

            //Join the path parts together, then figure out if baseUrl is needed.
            url = syms.join("/") + (ext || ".js");
            return ((url.charAt(0) === '/' || url.match(/^\w+:/)) ? "" : config.baseUrl) + url;
        }
    };

    /**
     * Checks if all modules for a context are loaded, and if so, evaluates the
     * new ones in right dependency order.
     *
     * @private
     */
    run.checkLoaded = function (contextName) {
        var context = s.contexts[contextName || s.ctxName],
                waitInterval = context.config.waitSeconds * 1000,
                //It is possible to disable the wait interval by using waitSeconds of 0.
                expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                loaded = context.loaded, defined = context.defined,
                modifiers = context.modifiers, waiting = context.waiting, noLoads = "",
                hasLoadedProp = false, stillLoading = false, prop,

                //>>excludeStart("runExcludePlugin", pragmas.runExcludePlugin);
                pIsWaiting = s.plugins.isWaiting, pOrderDeps = s.plugins.orderDeps,
                //>>excludeEnd("runExcludePlugin");

                i, module, allDone, loads, loadArgs,
                traced = {};

        //If already doing a checkLoaded call,
        //then do not bother checking loaded state.
        if (context.isCheckLoaded) {
            return;
        }

        //Signal that checkLoaded is being run, so other calls that could be triggered
        //by calling a waiting callback that then calls run and then this function
        //should not proceed. At the end of this function, if there are still things
        //waiting, then checkLoaded will be called again.
        context.isCheckLoaded = true;

        //See if anything is still in flight.
        for (prop in loaded) {
            if (!(prop in empty)) {
                hasLoadedProp = true;
                if (!loaded[prop]) {
                    if (expired) {
                        noLoads += prop + " ";
                    } else {
                        stillLoading = true;
                        break;
                    }
                }
            }
        }

        //Check for exit conditions.
        if (!hasLoadedProp && !waiting.length
            //>>excludeStart("runExcludePlugin", pragmas.runExcludePlugin);
            && (!pIsWaiting || !pIsWaiting(context))
            //>>excludeEnd("runExcludePlugin");
           ) {
            //If the loaded object had no items, then the rest of
            //the work below does not need to be done.
            context.isCheckLoaded = false;
            return;
        }
        if (expired && noLoads) {
            //If wait time expired, throw error of unloaded modules.
            throw new Error("run.js load timeout for modules: " + noLoads);
        }
        if (stillLoading) {
            //Something is still waiting to load. Wait for it.
            context.isCheckLoaded = false;
            if (run.isBrowser) {
                setTimeout(function () {
                    run.checkLoaded(contextName);
                }, 50);
            }
            return;
        }

        //Order the dependencies. Also clean up state because the evaluation
        //of modules might create new loading tasks, so need to reset.
        //Be sure to call plugins too.
        context.waiting = [];
        context.loaded = {};

        //>>excludeStart("runExcludePlugin", pragmas.runExcludePlugin);
        //Call plugins to order their dependencies, do their
        //module definitions.
        if (pOrderDeps) {
            pOrderDeps(context);
        }
        //>>excludeEnd("runExcludePlugin");

        //>>excludeStart("runExcludeModify", pragmas.runExcludeModify);
        //Before defining the modules, give priority treatment to any modifiers
        //for modules that are already defined.
        for (prop in modifiers) {
            if (!(prop in empty)) {
                if (defined[prop]) {
                    run.execModifiers(prop, traced, waiting, context);
                }
            }
        }
        //>>excludeEnd("runExcludeModify");

        //Define the modules, doing a depth first search.
        for (i = 0; (module = waiting[i]); i++) {
            run.exec(module, traced, waiting, context);
        }

        //Indicate checkLoaded is now done.
        context.isCheckLoaded = false;

        if (context.waiting.length
            //>>excludeStart("runExcludePlugin", pragmas.runExcludePlugin);
            || (pIsWaiting && pIsWaiting(context))
            //>>excludeEnd("runExcludePlugin");
           ) {
            //More things in this context are waiting to load. They were probably
            //added while doing the work above in checkLoaded, calling module
            //callbacks that triggered other run calls.
            run.checkLoaded(contextName);
        } else if (contextLoads.length) {
            //>>excludeStart("runExcludeContext", pragmas.runExcludeContext);
            //Check for other contexts that need to load things.
            //First, make sure current context has no more things to
            //load. After defining the modules above, new run calls
            //could have been made.
            loaded = context.loaded;
            allDone = true;
            for (prop in loaded) {
                if (!(prop in empty)) {
                    if (!loaded[prop]) {
                        allDone = false;
                        break;
                    }
                }
            }

            if (allDone) {
                s.ctxName = contextLoads[0][1];
                loads = contextLoads;
                //Reset contextLoads in case some of the waiting loads
                //are for yet another context.
                contextLoads = [];
                for (i = 0; (loadArgs = loads[i]); i++) {
                    run.load.apply(run, loadArgs);
                }
            }
            //>>excludeEnd("runExcludeContext");
        } else {
            //Make sure we reset to default context.
            s.ctxName = defContextName;
            s.isDone = true;
            //>>excludeStart("runExcludePageLoad", pragmas.runExcludePageLoad);
            run.callReady();
            //>>excludeEnd("runExcludePageLoad");
        }
    };

    /**
     * Executes the modules in the correct order.
     * 
     * @private
     */
    run.exec = function (module, traced, waiting, context) {
        //Some modules are just plain script files, abddo not have a formal
        //module definition, 
        if (!module) {
            return undefined;
        }

        var name = module.name, cb = module.callback, deps = module.deps, j, dep,
            defined = context.defined, ret, args = [], prefix, depModule;

        //If already traced or defined, do not bother a second time.
        if (name) {
            if (traced[name] || defined[name]) {
                return defined[name];
            }
    
            //Mark this module as being traced, so that it is not retraced (as in a circular
            //dependency)
            traced[name] = true;
        }

        if (deps) {
            for (j = 0; (dep = deps[j]); j++) {
                //Adjust dependency for plugins.
                prefix = dep.indexOf("!");
                if (prefix !== -1) {
                    dep = dep.substring(prefix + 1, dep.length);
                }
                //Get dependent module. It could not exist, for a circular
                //dependency or if the loaded dependency does not actually call
                //run. Favor not throwing an error here if undefined because
                //we want to allow code that does not use run as a module
                //definition framework to still work -- allow a web site to
                //gradually update to contained modules. That is seen as more
                //important than forcing a throw for the circular dependency case.
                depModule = dep in defined ? defined[dep] : (traced[dep] ? undefined : run.exec(waiting[waiting[dep]], traced, waiting, context));
                args.push(depModule);
            }
        }

        //Call the callback to define the module, if necessary.
        cb = module.callback;
        if (cb && run.isFunction(cb)) {
            ret = run.execCb(name, cb, args);
            if (name) {
                if (name in defined) {
                    throw new Error(name + " has already been defined");
                } else {
                    defined[name] = ret;
                }
            }
        }

        //>>excludeStart("runExcludeModify", pragmas.runExcludeModify);
        //Execute modifiers, if they exist.
        run.execModifiers(name, traced, waiting, context);
        //>>excludeEnd("runExcludeModify");

        return ret;
    };

    /**
     * Executes a module callack function. Broken out as a separate function
     * solely to allow the build system to sequence the files in the built
     * layer in the right sequence.
     * @param {String} name the module name.
     * @param {Function} cb the module callback/definition function.
     * @param {Array} args The arguments (dependent modules) to pass to callback.
     *
     * @private
     */
    run.execCb = function (name, cb, args) {
        return cb.apply(null, args);
    };

    //>>excludeStart("runExcludeModify", pragmas.runExcludeModify);
    /**
     * Executes modifiers for the given module name.
     * @param {String} target
     * @param {Object} traced
     * @param {Object} context
     *
     * @private
     */
    run.execModifiers = function (target, traced, waiting, context) {
        var modifiers = context.modifiers, mods = modifiers[target], mod, i;
        if (mods) {
            for (i = 0; i < mods.length; i++) {
                mod = mods[i];
                //Not all modifiers define a module, they might collect other modules.
                //If it is just a collection it will not be in waiting.
                if (mod in waiting) {
                    run.exec(waiting[waiting[mod]], traced, waiting, context);
                }
            }
            delete modifiers[target];
        }
    };
    //>>excludeEnd("runExcludeModify");

    /**
     * callback for script loads, used to check status of loading.
     *
     * @param {Event} evt the event from the browser for the script
     * that was loaded.
     *
     * @private
     */
    run.onScriptLoad = function (evt) {
        var node = evt.target || evt.srcElement, contextName, moduleName;
        if (evt.type === "load" || readyRegExp.test(node.readyState)) {
            //Pull out the name of the module and the context.
            contextName = node.getAttribute("data-runcontext");
            moduleName = node.getAttribute("data-runmodule");

            //Mark the module loaded.
            s.contexts[contextName].loaded[moduleName] = true;

            run.checkLoaded(contextName);

            //Clean up script binding.
            if (node.removeEventListener) {
                node.removeEventListener("load", run.onScriptLoad, false);
            } else {
                //Probably IE.
                node.detachEvent("onreadystatechange", run.onScriptLoad);
            }
        }
    };

    /**
     * Attaches the script represented by the URL to the current
     * environment. Right now only supports browser loading,
     * but can be redefined in other environments to do the right thing.
     */
    run.attach = function (url, contextName, moduleName) {
        if (run.isBrowser) {
            var node = document.createElement("script");
            node.type = "text/javascript";
            node.charset = "utf-8";
            node.setAttribute("data-runcontext", contextName);
            node.setAttribute("data-runmodule", moduleName);
    
            //Set up load listener.
            if (node.addEventListener) {
                node.addEventListener("load", run.onScriptLoad, false);
            } else {
                //Probably IE.
                node.attachEvent("onreadystatechange", run.onScriptLoad);
            }
            node.src = url;

            return s.head.appendChild(node);
        }
        return null;
    };

    //Determine what baseUrl should be if not already defined via a run config object
    s.baseUrl = cfg && cfg.baseUrl;
    if (run.isBrowser && (!s.baseUrl || !s.head)) {
        //Figure out baseUrl. Get it from the script tag with run.js in it.
        scripts = document.getElementsByTagName("script");
        //>>includeStart("jquery", pragmas.jquery);
        rePkg = /jquery[\-\d\.]*(min)?\.js(\W|$)/i;
        //>>includeEnd("jquery");

        //>>includeStart("dojoConvert", pragmas.dojoConvert);
        rePkg = /dojo\.js(\W|$)/i;
        //>>includeEnd("dojoConvert");

        //>>excludeStart("dojoConvert", pragmas.dojoConvert);

        //>>excludeStart("jquery", pragmas.jquery);
        rePkg = /run\.js(\W|$)/i;
        //>>excludeEnd("jquery");

        //>>excludeEnd("dojoConvert");

        for (i = scripts.length - 1; (script = scripts[i]); i--) {
            //Set the "head" where we can append children by
            //using the script's parent.
            if (!s.head) {
                s.head = script.parentNode;
            }
            //Using .src instead of getAttribute to get an absolute URL.
            //While using a relative URL will be fine for script tags, other
            //URLs used for text! resources that use XHR calls might benefit
            //from an absolute URL.
            src = script.src;
            if (src) {
                m = src.match(rePkg);
                if (m) {
                    s.baseUrl = src.substring(0, m.index);
                    break;
                }
            }
        }
    }

    //>>excludeStart("runExcludePageLoad", pragmas.runExcludePageLoad);
    //****** START page load functionality ****************
    /**
     * Sets the page as loaded and triggers check for all modules loaded.
     */
    run.pageLoaded = function () {
        if (!s.isPageLoaded) {
            s.isPageLoaded = true;
            if (scrollIntervalId) {
                clearInterval(scrollIntervalId);
            }
            run.callReady();
        }
    };

    run.callReady = function () {
        var callbacks = s.readyCalls, i, callback;

        if (s.isPageLoaded && s.isDone && callbacks.length) {
            s.readyCalls = [];
            for (i = 0; (callback = callbacks[i]); i++) {
                callback();
            }
        }
    };

    /**
     * Registers functions to call when the page is loaded
     */
    run.ready = function (callback) {
        if (s.isPageLoaded && s.isDone) {
            callback();
        } else {
            s.readyCalls.push(callback);
        }
        return run;
    };

    if (run.isBrowser) {
        if (document.addEventListener) {
            //Standards. Hooray! Assumption here that if standards based,
            //it knows about DOMContentLoaded.
            document.addEventListener("DOMContentLoaded", run.pageLoaded, false);
            window.addEventListener("load", run.pageLoaded, false);
        } else if (window.attachEvent) {
            window.attachEvent("onload", run.pageLoaded);

            //DOMContentLoaded approximation, as found by Diego Perini:
            //http://javascript.nwbox.com/IEContentLoaded/
            if (self === self.top) {
                scrollIntervalId = setInterval(function () {
                    try {
                        document.documentElement.doScroll("left");
                        run.pageLoaded();
                    } catch (e) {}
                }, 30);
            }
        }

        //Check if document already complete, and if so, just trigger page load
        //listeners. NOTE: does not work with Firefox before 3.6. To support
        //those browsers, manually call run.pageLoaded().
        if (document.readyState === "complete") {
            run.pageLoaded();
        }
    }
    //****** END page load functionality ****************
    //>>excludeEnd("runExcludePageLoad");

    //Set up default context. If run was a configuration object, use that as base config.
    run(cfg ? cfg : {});
}());
