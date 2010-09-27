/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
//laxbreak is true to allow build pragmas to change some statements.
/*jslint plusplus: false, nomen: false, laxbreak: true, regexp: false */
/*global window: false, document: false, navigator: false,
setTimeout: false, traceDeps: true, clearInterval: false, self: false,
setInterval: false, importScripts: false */
"use strict";

var require;
(function () {
    //Change this version number for each release.
    var version = "0.14.0",
            empty = {}, s,
            i, defContextName = "_", contextLoads = [],
            scripts, script, rePkg, src, m, dataMain, cfg = {}, setReadyState,
            readyRegExp = /^(complete|loaded)$/,
            commentRegExp = /(\/\*([\s\S]*?)\*\/|\/\/(.*)$)/mg,
            cjsRequireRegExp = /require\(["']([\w-_\.\/]+)["']\)/g,
            main,
            isBrowser = !!(typeof window !== "undefined" && navigator && document),
            isWebWorker = !isBrowser && typeof importScripts !== "undefined",
            ostring = Object.prototype.toString,
            ap = Array.prototype,
            aps = ap.slice, scrollIntervalId, req, baseElement,
            defQueue = [], useInteractive = false, currentlyAddingScript;

    function isFunction(it) {
        return ostring.call(it) === "[object Function]";
    }

    //Check for an existing version of require. If so, then exit out. Only allow
    //one version of require to be active in a page. However, allow for a require
    //config object, just exit quickly if require is an actual function.
    if (typeof require !== "undefined") {
        if (isFunction(require)) {
            return;
        } else {
            //assume it is a config object.
            cfg = require;
        }
    }
    
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

    /**
     * Convenience method to call main for a require.def call that was put on
     * hold in the defQueue.
     */
    function callDefMain(args, context) {
        main.apply(req, args);
        //Mark the module loaded. Must do it here in addition
        //to doing it in require.def in case a script does
        //not call require.def
        context.loaded[args[0]] = true;
    }

    /**
     * Resumes tracing of dependencies and then checks if everything is loaded.
     */
    function resume(context) {
        var args, i, paused = s.paused;
        if (context.scriptCount <= 0) {
            //Synchronous envs will push the number below zero with the
            //decrement above, be sure to set it back to zero for good measure.
            //require() calls that also do not end up loading scripts could
            //push the number negative too.
            context.scriptCount = 0;

            //Make sure any remaining defQueue items get properly processed.
            while (defQueue.length) {
                args = defQueue.shift();
                if (args[0] === null) {
                    req.onError(new Error('Mismatched anonymous require.def modules'));
                } else {
                    callDefMain(args, context);
                }
            }

            //Skip the resume if current context is in priority wait.
            if (s.contexts[s.ctxName].config.priorityWait) {
                return;
            }

            if (paused.length) {
                for (i = 0; (args = paused[i]); i++) {
                    req.checkDeps.apply(req, args);
                }
            }

            req.checkLoaded(s.ctxName);
        }
    }

    /**
     * Main entry point.
     *
     * If the only argument to require is a string, then the module that
     * is represented by that string is fetched for the appropriate context.
     *
     * If the first argument is an array, then it will be treated as an array
     * of dependency string names to fetch. An optional function callback can
     * be specified to execute when all of those dependencies are available.
     */
    require = function (deps, callback, contextName, relModuleName) {
        var context, config;
        if (typeof deps === "string" && !isFunction(callback)) {
            //Just return the module wanted. In this scenario, the
            //second arg (if passed) is just the contextName.
            return require.get(deps, callback, contextName, relModuleName);
        }
        // Dependencies first
        if (!require.isArray(deps)) {
            // deps is a config object
            config = deps;
            if (require.isArray(callback)) {
                // Adjust args if there are dependencies
                deps = callback;
                callback = contextName;
                contextName = arguments[3];
            } else {
                deps = [];
            }
        }
        main(null, deps, callback, config, contextName);

        //If the require call does not trigger anything new to load,
        //then resume the dependency processing. Context will be undefined
        //on first run of require.
        context = s.contexts[(contextName || (config && config.context) || s.ctxName)];
        if (context && context.scriptCount === 0) {
            resume(context);
        }
        //Returning undefined for Spidermonky strict checking in Komodo
        return undefined;
    };

    //Alias for caja compliance internally -
    //specifically: "Dynamically computed names should use require.async()"
    //even though this spec isn't really decided on.
    //Since it is here, use this alias to make typing shorter.
    req = require;

    /**
     * Any errors that require explicitly generates will be passed to this
     * function. Intercept/override it if you want custom error handling.
     * If you do override it, this method should *always* throw an error
     * to stop the execution flow correctly. Otherwise, other weird errors
     * will occur.
     * @param {Error} err the error object.
     */
    req.onError = function (err) {
        throw err;
    };

    /**
     * The function that handles definitions of modules. Differs from
     * require() in that a string for the module should be the first argument,
     * and the function to execute after dependencies are loaded should
     * return a value to define the module corresponding to the first argument's
     * name.
     */
    req.def = function (name, deps, callback, contextName) {
        var i, scripts, script, node = currentlyAddingScript;

        //Allow for anonymous functions
        if (typeof name !== 'string') {
            //Adjust args appropriately
            contextName = callback;
            callback = deps;
            deps = name;
            name = null;
        }

        //This module may not have dependencies
        if (!req.isArray(deps)) {
            contextName = callback;
            callback = deps;
            deps = [];
        }

        //If no name, and callback is a function, then figure out if it a
        //CommonJS thing with dependencies.
        if (!name && !deps.length && req.isFunction(callback)) {
            //Remove comments from the callback string,
            //look for require calls, and pull them into the dependencies.
            callback
                .toString()
                .replace(commentRegExp, "")
                .replace(cjsRequireRegExp, function (match, dep) {
                    deps.push(dep);
                });

            //May be a CommonJS thing even without require calls, but still
            //could use exports, and such, so always add those as dependencies.
            //This is a bit wasteful for RequireJS modules that do not need
            //an exports or module object, but erring on side of safety.
            //REQUIRES the function to expect the CommonJS variables in the
            //order listed below.
            if (deps.length) {
                deps = ["require", "exports", "module"].concat(deps);
            }
        }

        //If in IE 6-8 and hit an anonymous require.def call, do the interactive/
        //currentlyAddingScript scripts stuff.
        if (!name && useInteractive) {
            scripts = document.getElementsByTagName('script');
            for (i = scripts.length - 1; i > -1 && (script = scripts[i]); i--) {
                if (script.readyState === 'interactive') {
                    node = script;
                    break;
                }
            }
            if (!node) {
                req.onError(new Error("ERROR: No matching script interactive for " + callback));
            }

            name = node.getAttribute("data-requiremodule");
        }

        //Always save off evaluating the def call until the script onload handler.
        //This allows multiple modules to be in a file without prematurely
        //tracing dependencies, and allows for anonymous module support,
        //where the module name is not known until the script onload event
        //occurs.
        defQueue.push([name, deps, callback, null, contextName]);
    };

    main = function (name, deps, callback, config, contextName) {
        //Grab the context, or create a new one for the given context name.
        var context, newContext, loaded, pluginPrefix,
            canSetContext, prop, newLength, outDeps, mods, paths, index, i,
            deferMods, deferModArgs, lastModArg, waitingName, packages,
            packagePaths, pkgPath, pkgNames, pkgName, pkgObj;

        contextName = contextName ? contextName : (config && config.context ? config.context : s.ctxName);
        context = s.contexts[contextName];

        if (name) {
            //>>excludeStart("requireExcludePlugin", pragmas.requireExcludePlugin);
            // Pull off any plugin prefix.
            index = name.indexOf("!");
            if (index !== -1) {
                pluginPrefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
            } else {
                //Could be that the plugin name should be auto-applied.
                //Used by i18n plugin to enable anonymous i18n modules, but
                //still associating the auto-generated name with the i18n plugin.
                pluginPrefix = context.defPlugin[name];
            }

            //>>excludeEnd("requireExcludePlugin");

            //If module already defined for context, or already waiting to be
            //evaluated, leave.
            waitingName = context.waiting[name];
            if (context && (context.defined[name] || (waitingName && waitingName !== ap[name]))) {
                return;
            }
        }

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

        if (!context) {
            newContext = {
                contextName: contextName,
                config: {
                    waitSeconds: 7,
                    baseUrl: s.baseUrl || "./",
                    paths: {},
                    packages: {}
                },
                waiting: [],
                specified: {
                    "require": true,
                    "exports": true,
                    "module": true
                },
                loaded: {},
                scriptCount: 0,
                urlFetched: {},
                defPlugin: {},
                defined: {},
                modifiers: {}
            };

            //>>excludeStart("requireExcludePlugin", pragmas.requireExcludePlugin);
            if (s.plugins.newContext) {
                s.plugins.newContext(newContext);
            }
            //>>excludeEnd("requireExcludePlugin");

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

            //Save off the paths and packages since they require special processing,
            //they are additive.
            paths = context.config.paths;
            packages = context.config.packages;

            //Mix in the config values, favoring the new values over
            //existing ones in context.config.
            req.mixin(context.config, config, true);

            //Adjust paths if necessary.
            if (config.paths) {
                for (prop in config.paths) {
                    if (!(prop in empty)) {
                        paths[prop] = config.paths[prop];
                    }
                }
                context.config.paths = paths;
            }

            packagePaths = config.packagePaths;
            if (packagePaths || config.packages) {
                //Convert packagePaths into a packages config.
                if (packagePaths) {
                    for (prop in packagePaths) {
                        if (!(prop in empty)) {
                            pkgPath = prop;
                            pkgNames = packagePaths[pkgPath];
                            for (i = 0; (pkgName = pkgNames[i]); i++) {
                                if (typeof pkgName === "string") {
                                    //Standard package mapping.
                                    pkgObj = packages[pkgName] = {
                                        name: pkgName,
                                        location: pkgPath + "/" + pkgName
                                    };
                                } else {
                                    //A custom setup.
                                    pkgObj = context.config.packages[pkgName.name] = pkgName;
                                    pkgObj.location = pkgPath + "/" + (pkgObj.location || pkgObj.name);
                                }
                            }
                        }
                    }
                }

                //Adjust packages if necessary.
                if (config.packages) {
                    for (prop in config.packages) {
                        if (!(prop in empty)) {
                            pkgObj = packages[prop] = config.packages[prop];
                            pkgObj.name = pkgObj.name || prop;
                        }
                    }
                }

                //Normalize package paths.
                for (prop in packages) {
                    if (!(prop in empty)) {
                        pkgObj = packages[prop];
                        pkgObj.location = pkgObj.location || pkgObj.name;
                        pkgObj.lib = pkgObj.lib || "lib";
                        pkgObj.main = pkgObj.main || "main";
                    }
                }

                //Done with modifications, assing packages back to context config
                context.config.packages = packages;
            }

            //If priority loading is in effect, trigger the loads now
            if (config.priority) {
                //Create a separate config property that can be
                //easily tested for config priority completion.
                //Do this instead of wiping out the config.priority
                //in case it needs to be inspected for debug purposes later.
                req(config.priority);
                context.config.priorityWait = config.priority;
            }

            //If a deps array or a config callback is specified, then call
            //require with those args. This is useful when require is defined as a
            //config object before require.js is loaded.
            if (config.deps || config.callback) {
                req(config.deps || [], config.callback);
            }

            //>>excludeStart("requireExcludePageLoad", pragmas.requireExcludePageLoad);
            //Set up ready callback, if asked. Useful when require is defined as a
            //config object before require.js is loaded.
            if (config.ready) {
                req.ready(config.ready);
            }
            //>>excludeEnd("requireExcludePageLoad");

            //If it is just a config block, nothing else,
            //then return.
            if (!deps) {
                return;
            }
        }

        //Normalize dependency strings: need to determine if they have
        //prefixes and to also normalize any relative paths. Replace the deps
        //array of strings with an array of objects.
        if (deps) {
            outDeps = deps;
            deps = [];
            for (i = 0; i < outDeps.length; i++) {
                deps[i] = req.splitPrefix(outDeps[i], name);
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

            //Mark the module as specified so no need to fetch it again.
            //Important to set specified here for the
            //pause/resume case where there are multiple modules in a file.
            context.specified[name] = true;

            //>>excludeStart("requireExcludeModify", pragmas.requireExcludeModify);
            //Load any modifiers for the module.
            mods = context.modifiers[name];
            if (mods) {
                req(mods, contextName);
                deferMods = mods.__deferMods;
                if (deferMods) {
                    for (i = 0; i < deferMods.length; i++) {
                        deferModArgs = deferMods[i];

                        //Add the context name to the def call.
                        lastModArg = deferModArgs[deferModArgs.length - 1];
                        if (lastModArg === undefined) {
                            deferModArgs[deferModArgs.length - 1] = contextName;
                        } else if (typeof lastModArg === "string") {
                            deferMods.push(contextName);
                        }

                        require.def.apply(require, deferModArgs);
                    }
                }
            }
            //>>excludeEnd("requireExcludeModify");
        }

        //If the callback is not an actual function, it means it already
        //has the definition of the module as a literal value.
        if (name && callback && !req.isFunction(callback)) {
            context.defined[name] = callback;
        }

        //If a pluginPrefix is available, call the plugin, or load it.
        //>>excludeStart("requireExcludePlugin", pragmas.requireExcludePlugin);
        if (pluginPrefix) {
            callPlugin(pluginPrefix, context, {
                name: "require",
                args: [name, deps, callback, context]
            });
        }
        //>>excludeEnd("requireExcludePlugin");

        //Hold on to the module until a script load or other adapter has finished
        //evaluating the whole file. This helps when a file has more than one
        //module in it -- dependencies are not traced and fetched until the whole
        //file is processed.
        s.paused.push([pluginPrefix, name, deps, context]);

        //Set loaded here for modules that are also loaded
        //as part of a layer, where onScriptLoad is not fired
        //for those cases. Do this after the inline define and
        //dependency tracing is done.
        if (name) {
            context.loaded[name] = true;
        }
    };

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     */
    req.mixin = function (target, source, force) {
        for (var prop in source) {
            if (!(prop in empty) && (!(prop in target) || force)) {
                target[prop] = source[prop];
            }
        }
        return req;
    };

    req.version = version;

    //Set up page state.
    s = req.s = {
        ctxName: defContextName,
        contexts: {},
        paused: [],
        //>>excludeStart("requireExcludePlugin", pragmas.requireExcludePlugin);
        plugins: {
            defined: {},
            callbacks: {},
            waiting: {}
        },
        //>>excludeEnd("requireExcludePlugin");
        //Stores a list of URLs that should not get async script tag treatment.
        skipAsync: {},
        isBrowser: isBrowser,
        isPageLoaded: !isBrowser,
        readyCalls: [],
        doc: isBrowser ? document : null
    };

    req.isBrowser = s.isBrowser;
    if (isBrowser) {
        s.head = document.getElementsByTagName("head")[0];
        //If BASE tag is in play, using appendChild is a problem for IE6.
        //When that browser dies, this can be removed. Details in this jQuery bug:
        //http://dev.jquery.com/ticket/2709
        baseElement = document.getElementsByTagName("base")[0];
        if (baseElement) {
            s.head = baseElement.parentNode;
        }
    }

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

    /**
     * Internal method used by environment adapters to complete a load event.
     * A load event could be a script load or just a load pass from a synchronous
     * load call.
     * @param {String} moduleName the name of the module to potentially complete.
     * @param {Object} context the context object
     */
    req.completeLoad = function (moduleName, context) {
        //If there is a waiting require.def call
        var args;
        while (defQueue.length) {
            args = defQueue.shift();
            if (args[0] === null) {
                args[0] = moduleName;
                break;
            } else if (args[0] === moduleName) {
                //Found matching require.def call for this script!
                break;
            } else {
                //Some other named require.def call, most likely the result
                //of a build layer that included many require.def calls.
                callDefMain(args, context);
            }
        }
        if (args) {
            callDefMain(args, context);
        }

        //Mark the script as loaded. Note that this can be different from a
        //moduleName that maps to a require.def call. This line is important
        //for traditional browser scripts.
        context.loaded[moduleName] = true;
        
        context.scriptCount -= 1;
        resume(context);
    };

    /**
     * Legacy function, remove at some point
     */
    req.pause = req.resume = function () {};

    /**
     * Trace down the dependencies to see if they are loaded. If not, trigger
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
    req.checkDeps = function (pluginPrefix, name, deps, context) {
        //Figure out if all the modules are loaded. If the module is not
        //being loaded or already loaded, add it to the "to load" list,
        //and request it to be loaded.
        var i, dep;

        if (pluginPrefix) {
            //>>excludeStart("requireExcludePlugin", pragmas.requireExcludePlugin);
            callPlugin(pluginPrefix, context, {
                name: "checkDeps",
                args: [name, deps, context]
            });
            //>>excludeEnd("requireExcludePlugin");
        } else {
            for (i = 0; (dep = deps[i]); i++) {
                if (!context.specified[dep.fullName]) {
                    context.specified[dep.fullName] = true;

                    //Reset the start time to use for timeouts
                    context.startTime = (new Date()).getTime();

                    //If a plugin, call its load method.
                    if (dep.prefix) {
                        //>>excludeStart("requireExcludePlugin", pragmas.requireExcludePlugin);
                        callPlugin(dep.prefix, context, {
                            name: "load",
                            args: [dep.name, context.contextName]
                        });
                        //>>excludeEnd("requireExcludePlugin");
                    } else {
                        req.load(dep.name, context.contextName);
                    }
                }
            }
        }
    };

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

    req.isArray = function (it) {
        return ostring.call(it) === "[object Array]";
    };

    req.isFunction = isFunction;

    /**
     * Gets one module's exported value. This method is used by require().
     * It is broken out as a separate function to allow a host environment
     * shim to overwrite this function with something appropriate for that
     * environment.
     *
     * @param {String} moduleName the name of the module.
     * @param {String} [contextName] the name of the context to use. Uses
     * default context if no contextName is provided. You should never
     * pass the contextName explicitly -- it is handled by the require() code.
     * @param {String} [relModuleName] a module name to use for relative
     * module name lookups. You should never pass this argument explicitly --
     * it is handled by the require() code.
     *
     * @returns {Object} the exported module value.
     */
    req.get = function (moduleName, contextName, relModuleName) {
        if (moduleName === "require" || moduleName === "exports" || moduleName === "module") {
            req.onError(new Error("Explicit require of " + moduleName + " is not allowed."));
        }
        contextName = contextName || s.ctxName;

        //Normalize module name, if it contains . or ..
        moduleName = req.normalizeName(moduleName, relModuleName);

        var ret = s.contexts[contextName].defined[moduleName];
        if (ret === undefined) {
            req.onError(new Error("require: module name '" +
                        moduleName +
                        "' has not been loaded yet for context: " +
                        contextName));
        }
        return ret;
    };

    /**
     * Makes the request to load a module. May be an async load depending on
     * the environment and the circumstance of the load call. Override this
     * method in a host environment shim to do something specific for that
     * environment.
     *
     * @param {String} moduleName the name of the module.
     * @param {String} contextName the name of the context to use.
     */
    req.load = function (moduleName, contextName) {
        var context = s.contexts[contextName],
            urlFetched = context.urlFetched,
            loaded = context.loaded, url;
        s.isDone = false;

        //Only set loaded to false for tracking if it has not already been set.
        if (!loaded[moduleName]) {
            loaded[moduleName] = false;
        }

        if (contextName !== s.ctxName) {
            //Not in the right context now, hold on to it until
            //the current context finishes all its loading.
            contextLoads.push(arguments);
        } else {
            //First derive the path name for the module.
            url = req.nameToUrl(moduleName, null, contextName);
            if (!urlFetched[url]) {
                context.scriptCount += 1;
                req.attach(url, contextName, moduleName);
                urlFetched[url] = true;
            }
        }
    };

    req.jsExtRegExp = /\.js$/;

    
    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    req.normalizeName = function (name, baseName) {
        //Adjust any relative paths.
        var part;
        if (name.charAt(0) === ".") {
            if (!baseName) {
                req.onError(new Error("Cannot normalize module name: " +
                            name +
                            ", no relative module name available."));
            }
            //Convert baseName to array, and lop off the last part,
            //so that . matches that "directory" and not name of the baseName's
            //module. For instance, baseName of "one/two/three", maps to
            //"one/two/three.js", but we want the directory, "one/two" for
            //this normalization.
            baseName = baseName.split("/");
            baseName = baseName.slice(0, baseName.length - 1);

            name = baseName.concat(name.split("/"));
            for (i = 0; (part = name[i]); i++) {
                if (part === ".") {
                    name.splice(i, 1);
                    i -= 1;
                } else if (part === "..") {
                    name.splice(i - 1, 2);
                    i -= 2;
                }
            }
            name = name.join("/");
        }
        return name;
    };

    /**
     * Splits a name into a possible plugin prefix and
     * the module name. If baseName is provided it will
     * also normalize the name via require.normalizeName()
     * 
     * @param {String} name the module name
     * @param {String} [baseName] base name that name is
     * relative to.
     *
     * @returns {Object} with properties, 'prefix' (which
     * may be null), 'name' and 'fullName', which is a combination
     * of the prefix (if it exists) and the name.
     */
    req.splitPrefix = function (name, baseName) {
        var index = name.indexOf("!"), prefix = null;
        if (index !== -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }

        //Account for relative paths if there is a base name.
        name = req.normalizeName(name, baseName);

        return {
            prefix: prefix,
            name: name,
            fullName: prefix ? prefix + "!" + name : name
        };
    };

    /**
     * Converts a module name to a file path.
     */
    req.nameToUrl = function (moduleName, ext, contextName, relModuleName) {
        var paths, packages, pkg, pkgPath, syms, i, parentModule, url,
            config = s.contexts[contextName].config;

        //Normalize module name if have a base relative module name to work from.
        moduleName = req.normalizeName(moduleName, relModuleName);

        //If a colon is in the URL, it indicates a protocol is used and it is just
        //an URL to a file, or if it starts with a slash or ends with .js, it is just a plain file.
        //The slash is important for protocol-less URLs as well as full paths.
        if (moduleName.indexOf(":") !== -1 || moduleName.charAt(0) === '/' || req.jsExtRegExp.test(moduleName)) {
            //Just a plain path, not module name lookup, so just return it.
            //Add extension if it is included. This is a bit wonky, only non-.js things pass
            //an extension, this method probably needs to be reworked.
            return moduleName + (ext ? ext : "");
        } else if (moduleName.charAt(0) === ".") {
            return req.onError(new Error("require.nameToUrl does not handle relative module names (ones that start with '.' or '..')"));
        } else {
            //A module that needs to be converted to a path.
            paths = config.paths;
            packages = config.packages;

            syms = moduleName.split("/");
            //For each module name segment, see if there is a path
            //registered for it. Start with most specific name
            //and work up from it.
            for (i = syms.length; i > 0; i--) {
                parentModule = syms.slice(0, i).join("/");
                if (paths[parentModule]) {
                    syms.splice(0, i, paths[parentModule]);
                    break;
                } else if ((pkg = packages[parentModule])) {
                    //pkg can have just a string value to the path
                    //or can be an object with props:
                    //main, lib, name, location.
                    pkgPath = pkg.location + '/' + pkg.lib;
                    //If module name is just the package name, then looking
                    //for the main module.
                    if (moduleName === pkg.name) {
                        pkgPath += '/' + pkg.main;
                    }
                    syms.splice(0, i, pkgPath);
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
    req.checkLoaded = function (contextName) {
        var context = s.contexts[contextName || s.ctxName],
                waitInterval = context.config.waitSeconds * 1000,
                //It is possible to disable the wait interval by using waitSeconds of 0.
                expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                loaded, defined = context.defined,
                modifiers = context.modifiers, waiting, noLoads = "",
                hasLoadedProp = false, stillLoading = false, prop, priorityDone,
                priorityName,

                //>>excludeStart("requireExcludePlugin", pragmas.requireExcludePlugin);
                pIsWaiting = s.plugins.isWaiting, pOrderDeps = s.plugins.orderDeps,
                //>>excludeEnd("requireExcludePlugin");

                i, module, allDone, loads, loadArgs, err,
                traced = {};

        //If already doing a checkLoaded call,
        //then do not bother checking loaded state.
        if (context.isCheckLoaded) {
            return;
        }

        //Determine if priority loading is done. If so clear the priority. If
        //not, then do not check
        if (context.config.priorityWait) {
            priorityDone = true;
            for (i = 0; (priorityName = context.config.priorityWait[i]); i++) {
                if (!context.loaded[priorityName]) {
                    priorityDone = false;
                    break;
                }
            }
            if (priorityDone) {
                //Clean up priority and call resume, since it could have
                //some waiting dependencies to trace.
                delete context.config.priorityWait;
                resume(context);
            } else {
                return;
            }
        }

        //Signal that checkLoaded is being require, so other calls that could be triggered
        //by calling a waiting callback that then calls require and then this function
        //should not proceed. At the end of this function, if there are still things
        //waiting, then checkLoaded will be called again.
        context.isCheckLoaded = true;

        //Grab waiting and loaded lists here, since it could have changed since
        //this function was first called.
        waiting = context.waiting;
        loaded = context.loaded;

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
            //>>excludeStart("requireExcludePlugin", pragmas.requireExcludePlugin);
            && (!pIsWaiting || !pIsWaiting(context))
            //>>excludeEnd("requireExcludePlugin");
           ) {
            //If the loaded object had no items, then the rest of
            //the work below does not need to be done.
            context.isCheckLoaded = false;
            return;
        }
        if (expired && noLoads) {
            //If wait time expired, throw error of unloaded modules.
            err = new Error("require.js load timeout for modules: " + noLoads);
            err.requireType = "timeout";
            err.requireModules = noLoads;
            req.onError(err);
        }
        if (stillLoading) {
            //Something is still waiting to load. Wait for it.
            context.isCheckLoaded = false;
            if (isBrowser || isWebWorker) {
                setTimeout(function () {
                    req.checkLoaded(contextName);
                }, 50);
            }
            return;
        }

        //Order the dependencies. Also clean up state because the evaluation
        //of modules might create new loading tasks, so need to reset.
        //Be sure to call plugins too.
        context.waiting = [];
        context.loaded = {};

        //>>excludeStart("requireExcludePlugin", pragmas.requireExcludePlugin);
        //Call plugins to order their dependencies, do their
        //module definitions.
        if (pOrderDeps) {
            pOrderDeps(context);
        }
        //>>excludeEnd("requireExcludePlugin");

        //>>excludeStart("requireExcludeModify", pragmas.requireExcludeModify);
        //Before defining the modules, give priority treatment to any modifiers
        //for modules that are already defined.
        for (prop in modifiers) {
            if (!(prop in empty)) {
                if (defined[prop]) {
                    req.execModifiers(prop, traced, waiting, context);
                }
            }
        }
        //>>excludeEnd("requireExcludeModify");

        //Define the modules, doing a depth first search.
        for (i = 0; (module = waiting[i]); i++) {
            req.exec(module, traced, waiting, context);
        }

        //Indicate checkLoaded is now done.
        context.isCheckLoaded = false;

        if (context.waiting.length
            //>>excludeStart("requireExcludePlugin", pragmas.requireExcludePlugin);
            || (pIsWaiting && pIsWaiting(context))
            //>>excludeEnd("requireExcludePlugin");
           ) {
            //More things in this context are waiting to load. They were probably
            //added while doing the work above in checkLoaded, calling module
            //callbacks that triggered other require calls.
            req.checkLoaded(contextName);
        } else if (contextLoads.length) {
            //Check for other contexts that need to load things.
            //First, make sure current context has no more things to
            //load. After defining the modules above, new require calls
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
                    req.load.apply(req, loadArgs);
                }
            }
        } else {
            //Make sure we reset to default context.
            s.ctxName = defContextName;
            s.isDone = true;
            if (req.callReady) {
                req.callReady();
            }
        }
    };

    /**
     * Helper function that creates a setExports function for a "module"
     * CommonJS dependency. Do this here to avoid creating a closure that
     * is part of a loop in require.exec.
     */
    function makeSetExports(moduleObj) {
        return function (exports) {
            moduleObj.exports = exports;
        };
    }

    function makeContextModuleFunc(name, contextName, moduleName) {
        return function () {
            //A version of a require function that forces a contextName value
            //and also passes a moduleName value for items that may need to
            //look up paths relative to the moduleName
            var args = [].concat(aps.call(arguments, 0));
            args.push(contextName, moduleName);
            return (name ? require[name] : require).apply(null, args);
        };
    }

    /**
     * Helper function that creates a require function object to give to
     * modules that ask for it as a dependency. It needs to be specific
     * per module because of the implication of path mappings that may
     * need to be relative to the module name.
     */
    function makeRequire(context, moduleName) {
        var contextName = context.contextName,
            modRequire = makeContextModuleFunc(null, contextName, moduleName);

        req.mixin(modRequire, {
            //>>excludeStart("requireExcludeModify", pragmas.requireExcludeModify);
            modify: makeContextModuleFunc("modify", contextName, moduleName),
            //>>excludeEnd("requireExcludeModify");
            def: makeContextModuleFunc("def", contextName, moduleName),
            get: makeContextModuleFunc("get", contextName, moduleName),
            nameToUrl: makeContextModuleFunc("nameToUrl", contextName, moduleName),
            ready: req.ready,
            context: context,
            config: context.config,
            isBrowser: s.isBrowser
        });
        return modRequire;
    }

    /**
     * Executes the modules in the correct order.
     * 
     * @private
     */
    req.exec = function (module, traced, waiting, context) {
        //Some modules are just plain script files, abddo not have a formal
        //module definition, 
        if (!module) {
            //Returning undefined for Spidermonky strict checking in Komodo
            return undefined;
        }

        var name = module.name, cb = module.callback, deps = module.deps, j, dep,
            defined = context.defined, ret, args = [], depModule, cjsModule,
            usingExports = false, depName;

        //If already traced or defined, do not bother a second time.
        if (name) {
            if (traced[name] || name in defined) {
                return defined[name];
            }
    
            //Mark this module as being traced, so that it is not retraced (as in a circular
            //dependency)
            traced[name] = true;
        }

        if (deps) {
            for (j = 0; (dep = deps[j]); j++) {
                depName = dep.name;
                if (depName === "require") {
                    depModule = makeRequire(context, name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    depModule = defined[name] = {};
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = depModule = {
                        id: name,
                        uri: name ? req.nameToUrl(name, null, context.contextName) : undefined
                    };
                    cjsModule.setExports = makeSetExports(cjsModule);
                } else {
                    //Get dependent module. It could not exist, for a circular
                    //dependency or if the loaded dependency does not actually call
                    //require. Favor not throwing an error here if undefined because
                    //we want to allow code that does not use require as a module
                    //definition framework to still work -- allow a web site to
                    //gradually update to contained modules. That is more
                    //important than forcing a throw for the circular dependency case.
                    depModule = depName in defined ? defined[depName] : (traced[depName] ? undefined : req.exec(waiting[waiting[depName]], traced, waiting, context));
                }

                args.push(depModule);
            }
        }

        //Call the callback to define the module, if necessary.
        cb = module.callback;
        if (cb && req.isFunction(cb)) {
            ret = req.execCb(name, cb, args);
            if (name) {
                //If using exports and the function did not return a value,
                //and the "module" object for this definition function did not
                //define an exported value, then use the exports object.
                if (usingExports && ret === undefined && (!cjsModule || !("exports" in cjsModule))) {
                    ret = defined[name];
                } else {
                    if (cjsModule && "exports" in cjsModule) {
                        ret = defined[name] = depModule.exports;
                    } else {
                        if (name in defined && !usingExports) {
                            req.onError(new Error(name + " has already been defined"));
                        }
                        defined[name] = ret;
                    }
                }
            }
        }

        //>>excludeStart("requireExcludeModify", pragmas.requireExcludeModify);
        //Execute modifiers, if they exist.
        req.execModifiers(name, traced, waiting, context);
        //>>excludeEnd("requireExcludeModify");

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
    req.execCb = function (name, cb, args) {
        return cb.apply(null, args);
    };

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

    /**
     * callback for script loads, used to check status of loading.
     *
     * @param {Event} evt the event from the browser for the script
     * that was loaded.
     *
     * @private
     */
    req.onScriptLoad = function (evt) {
        //Using currentTarget instead of target for Firefox 2.0's sake. Not
        //all old browsers will be supported, but this one was easy enough
        //to support and still makes sense.
        var node = evt.currentTarget || evt.srcElement, contextName, moduleName,
            context;
        if (evt.type === "load" || readyRegExp.test(node.readyState)) {
            //Pull out the name of the module and the context.
            contextName = node.getAttribute("data-requirecontext");
            moduleName = node.getAttribute("data-requiremodule");
            context = s.contexts[contextName];

            req.completeLoad(moduleName, context);

            //Clean up script binding.
            if (node.removeEventListener) {
                node.removeEventListener("load", req.onScriptLoad, false);
            } else {
                //Probably IE. If not it will throw an error, which will be
                //useful to know.
                node.detachEvent("onreadystatechange", req.onScriptLoad);
            }
        }
    };

    /**
     * Attaches the script represented by the URL to the current
     * environment. Right now only supports browser loading,
     * but can be redefined in other environments to do the right thing.
     * @param {String} url the url of the script to attach.
     * @param {String} contextName the name of the context that wants the script.
     * @param {moduleName} the name of the module that is associated with the script.
     * @param {Function} [callback] optional callback, defaults to require.onScriptLoad
     * @param {String} [type] optional type, defaults to text/javascript
     */
    req.attach = function (url, contextName, moduleName, callback, type) {
        var node, loaded, context;
        if (isBrowser) {
            //In the browser so use a script tag
            callback = callback || req.onScriptLoad;
            node = document.createElement("script");
            node.type = type || "text/javascript";
            node.charset = "utf-8";
            //Use async so Gecko does not block on executing the script if something
            //like a long-polling comet tag is being run first. Gecko likes
            //to evaluate scripts in DOM order, even for dynamic scripts.
            //It will fetch them async, but only evaluate the contents in DOM
            //order, so a long-polling script tag can delay execution of scripts
            //after it. But telling Gecko we expect async gets us the behavior
            //we want -- execute it whenever it is finished downloading. Only
            //Helps Firefox 3.6+
            //Allow some URLs to not be fetched async. Mostly helps the order!
            //plugin
            if (!s.skipAsync[url]) {
                node.async = true;
            }
            node.setAttribute("data-requirecontext", contextName);
            node.setAttribute("data-requiremodule", moduleName);

            //Set up load listener.
            if (node.addEventListener) {
                node.addEventListener("load", callback, false);
            } else {
                //Probably IE. If not it will throw an error, which will be
                //useful to know. IE (at least 6-8) do not fire
                //script onload right after executing the script, so
                //we cannot tie the anonymous require.def call to a name.
                //However, IE reports the script as being in "interactive"
                //readyState at the time of the require.def call.
                useInteractive = true;
                node.attachEvent("onreadystatechange", callback);
            }
            node.src = url;

            //For some cache cases in IE 6-8, the script executes before the end
            //of the appendChild execution, so to tie an anonymous require.def
            //call to the module name (which is stored on the node), hold on
            //to a reference to this node, but clear after the DOM insertion.
            currentlyAddingScript = node;
            if (baseElement) {
                s.head.insertBefore(node, baseElement);
            } else {
                s.head.appendChild(node);
            }
            currentlyAddingScript = null;
            return node;
        } else if (isWebWorker) {
            //In a web worker, use importScripts. This is not a very
            //efficient use of importScripts, importScripts will block until
            //its script is downloaded and evaluated. However, if web workers
            //are in play, the expectation that a build has been done so that
            //only one script needs to be loaded anyway. This may need to be
            //reevaluated if other use cases become common.
            context = s.contexts[contextName];
            loaded = context.loaded;
            loaded[moduleName] = false;
            importScripts(url);

            //Account for anonymous modules
            req.completeLoad(moduleName, context);
        }
        return null;
    };

    //Determine what baseUrl should be if not already defined via a require config object
    s.baseUrl = cfg.baseUrl;
    if (isBrowser && (!s.baseUrl || !s.head)) {
        //Figure out baseUrl. Get it from the script tag with require.js in it.
        scripts = document.getElementsByTagName("script");
        if (cfg.baseUrlMatch) {
            rePkg = cfg.baseUrlMatch;
        } else {
            //>>includeStart("jquery", pragmas.jquery);
            rePkg = /(requireplugins-|require-)?jquery[\-\d\.]*(min)?\.js(\W|$)/i;
            //>>includeEnd("jquery");

            //>>includeStart("dojoConvert", pragmas.dojoConvert);
            rePkg = /dojo\.js(\W|$)/i;
            //>>includeEnd("dojoConvert");

            //>>excludeStart("dojoConvert", pragmas.dojoConvert);

            //>>excludeStart("jquery", pragmas.jquery);
            rePkg = /(allplugins-|transportD-)?require\.js(\W|$)/i;
            //>>excludeEnd("jquery");

            //>>excludeEnd("dojoConvert");
        }

        for (i = scripts.length - 1; i > -1 && (script = scripts[i]); i--) {
            //Set the "head" where we can append children by
            //using the script's parent.
            if (!s.head) {
                s.head = script.parentNode;
            }

            //Look for a data-main attribute to set main script for the page
            //to load.
            if (!cfg.deps) {
                dataMain = script.getAttribute('data-main');
                if (dataMain) {
                    cfg.deps = [dataMain];
                }
            }

            //Using .src instead of getAttribute to get an absolute URL.
            //While using a relative URL will be fine for script tags, other
            //URLs used for text! resources that use XHR calls might benefit
            //from an absolute URL.
            src = script.src;
            if (src && !s.baseUrl) {
                m = src.match(rePkg);
                if (m) {
                    s.baseUrl = src.substring(0, m.index);
                    break;
                }
            }
        }
    }

    //>>excludeStart("requireExcludePageLoad", pragmas.requireExcludePageLoad);
    //****** START page load functionality ****************
    /**
     * Sets the page as loaded and triggers check for all modules loaded.
     */
    req.pageLoaded = function () {
        if (!s.isPageLoaded) {
            s.isPageLoaded = true;
            if (scrollIntervalId) {
                clearInterval(scrollIntervalId);
            }

            //Part of a fix for FF < 3.6 where readyState was not set to
            //complete so libraries like jQuery that check for readyState
            //after page load where not getting initialized correctly.
            //Original approach suggested by Andrea Giammarchi:
            //http://webreflection.blogspot.com/2009/11/195-chars-to-help-lazy-loading.html
            //see other setReadyState reference for the rest of the fix.
            if (setReadyState) {
                document.readyState = "complete";
            }

            req.callReady();
        }
    };

    /**
     * Internal function that calls back any ready functions. If you are
     * integrating RequireJS with another library without require.ready support,
     * you can define this method to call your page ready code instead.
     */
    req.callReady = function () {
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
    req.ready = function (callback) {
        if (s.isPageLoaded && s.isDone) {
            callback();
        } else {
            s.readyCalls.push(callback);
        }
        return req;
    };

    if (isBrowser) {
        if (document.addEventListener) {
            //Standards. Hooray! Assumption here that if standards based,
            //it knows about DOMContentLoaded.
            document.addEventListener("DOMContentLoaded", req.pageLoaded, false);
            window.addEventListener("load", req.pageLoaded, false);
            //Part of FF < 3.6 readystate fix (see setReadyState refs for more info)
            if (!document.readyState) {
                setReadyState = true;
                document.readyState = "loading";
            }
        } else if (window.attachEvent) {
            window.attachEvent("onload", req.pageLoaded);

            //DOMContentLoaded approximation, as found by Diego Perini:
            //http://javascript.nwbox.com/IEContentLoaded/
            if (self === self.top) {
                scrollIntervalId = setInterval(function () {
                    try {
                        //From this ticket:
                        //http://bugs.dojotoolkit.org/ticket/11106,
                        //In IE HTML Application (HTA), such as in a selenium test,
                        //javascript in the iframe can't see anything outside
                        //of it, so self===self.top is true, but the iframe is
                        //not the top window and doScroll will be available
                        //before document.body is set. Test document.body
                        //before trying the doScroll trick.
                        if (document.body) {
                            document.documentElement.doScroll("left");
                            req.pageLoaded();
                        }
                    } catch (e) {}
                }, 30);
            }
        }

        //Check if document already complete, and if so, just trigger page load
        //listeners. NOTE: does not work with Firefox before 3.6. To support
        //those browsers, manually call require.pageLoaded().
        if (document.readyState === "complete") {
            req.pageLoaded();
        }
    }
    //****** END page load functionality ****************
    //>>excludeEnd("requireExcludePageLoad");

    //Set up default context. If require was a configuration object, use that as base config.
    req(cfg);

    //If modules are built into require.js, then need to make sure dependencies are
    //traced. Use a setTimeout in the browser world, to allow all the modules to register
    //themselves. In a non-browser env, assume that modules are not built into require.js,
    //which seems odd to do on the server.
    if (typeof setTimeout !== "undefined") {
        setTimeout(function () {
            resume(s.contexts[(cfg.context || defContextName)]);
        }, 0);
    }
}());
