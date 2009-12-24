/*
    Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
    Available via the new BSD license.
    see: http://code.google.com/p/runjs/ for details
*/
/*jslint plusplus: false */
/*global run: true, window: false, document: false, navigator: false,
setTimeout: false, traceDeps: true, clearInterval: false, self: false,
setInterval: false */

"use strict";

(function () {
    //Change this version number for each release.
    var version = "0.0.6",
            run = typeof run === "undefined" ? null : run,
            empty = {}, s,
            i, defContextName = "_", contextLoads = [],
            scripts, script, rePkg, src, m,
            readyRegExp = /complete|loaded/,
            isBrowser = typeof window !== "undefined" && navigator && document,
            ostring = Object.prototype.toString, scrollIntervalId;

    //Check for an existing version of run. If so, then exit out. Only allow
    //one version of run to be active in a page.
    if (run) {
        return;
    }

    function makeContextFunc(name, contextName, force) {
        return function () {
            //A version of a run function that uses the current context.
            //If last arg is a string, then it is a context.
            //If last arg is not a string, then add context to it.
            var args = [].concat(Array.prototype.slice.call(arguments, 0));
            if (force || typeof arguments[arguments.length - 1] !== "string") {
                args.push(contextName);
            }
            return (name ? run[name] : run).apply(run.global, args);
        };
    }

    /**
     * Calls a method on a plugin. The obj object should have two property,
     * name: the name of the method to call on the plugin
     * args: the arguments to pass to the plugin method.
     */
    function callPlugin(prefix, context, obj) {
        //Call the plugin, or load it.
        var plugin = s.plugins.defined[prefix], waiting;
        if (plugin) {
            plugin[obj.name].apply(run.global, obj.args);
        } else {
            //Load the module and add the call to waitin queue.
            context.defined.run(["run/" + prefix]);
            waiting = s.plugins.waiting[prefix] || (s.plugins.waiting[prefix] = []);
            waiting.push(obj);
        }
    }

    /**
     * The function that loads modules or executes code that has dependencies
     * on other modules.
     */
    run = function (name, deps, callback, contextName) {
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

            //If module already defined for context, leave.
            context = s.contexts[contextName];
            if (context && context.defined && context.defined[name]) {
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
            //does not have dependencies. Not sure if this is useful.
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

            //Define run() for this context.
            newContext.defined.run = contextRun = makeContextFunc(null, contextName);
            run.mixin(contextRun, {
                //>>excludeStart("runExcludeModify", pragmas.run.excludeModify);
                modify: makeContextFunc("modify", contextName),
                //>>excludeEnd("runExcludeModify");
                get: makeContextFunc("get", contextName, true),
                ready: run.ready,
                context: newContext,
                config: newContext.config,
                global: run.global,
                doc: s.doc,
                isBrowser: s.isBrowser
            });

            if (s.plugins.onNewContext) {
                s.plugins.onNewContext(newContext);
            }

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

        //Store the module for later evaluation.
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

            //>>excludeStart("runExcludeModify", pragmas.run.excludeModify);
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
        if (pluginPrefix) {
            callPlugin(pluginPrefix, context, {
                name: "run",
                args: [name, deps, callback, context]
            });
        }

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

    //Export to global namespace.
    run.global = this;
    run.global.run = run;
    run.version = version;

    //Set up page state.
    s = run.s = {
        ctxName: defContextName,
        contexts: {},
        plugins: {
            defined: {},
            callbacks: {},
            waiting: {}
        },
        isBrowser: isBrowser,
        isPageLoaded: !isBrowser,
        pageCallbacks: [],
        doc: isBrowser ? document : null
    };
    s.head = s.head || isBrowser ? 
             (s.doc.getElementsByTagName("head")[0] ||
              s.doc.getElementsByTagName("html")[0]) : null;
    run.isBrowser = s.isBrowser;
    run.doc = s.doc;

    //Set up page load detection for the browser case.
    if (run.isBrowser && !s.baseUrl) {
        //Figure out baseUrl. Get it from the script tag with run.js in it.
        scripts = run.doc.getElementsByTagName("script");
        rePkg = /run\.js(\W|$)/i;
        for (i = scripts.length - 1; (script = scripts[i]); i--) {
            src = script.getAttribute("src");
            if (src) {
                m = src.match(rePkg);
                if (m) {
                    s.baseUrl = src.substring(0, m.index);
                }
                break;
            }
        }
    }

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
                if (cb.apply(run.global, arguments) === true && returnOnTrue) {
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
                    obj[call.name].apply(run.global, call.args);
                }
            }
            delete s.plugins.waiting[prefix];
        }

        return run;
    };

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
            callPlugin(pluginPrefix, context, {
                name: "checkDeps",
                args: [name, deps, context]
            });
        } else {
            for (i = 0; (dep = deps[i]); i++) {
                //If it is a string, then a plain dependency
                if (typeof dep === "string") {
                    if (!context.specified[dep]) {
                        context.specified[dep] = true;

                        //If a plugin, call its load method.
                        index = dep.indexOf("!");
                        if (index !== -1) {
                            depPrefix = dep.substring(0, index);
                            dep = dep.substring(index + 1, dep.length);

                            callPlugin(depPrefix, context, {
                                name: "load",
                                args: [dep, context.contextName]
                            });
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

    //>>excludeStart("runExcludeModify", pragmas.run.excludeModify);
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
                list.push(modifier);
                list[modifier] = true;
            }

            //Trigger the normal module load logic.
            run(name, deps, callback, contextName);
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

    run.isFunction = function (it) {
        return ostring.call(it) === "[object Function]";
    };

    /**
     * Makes the request to load a module. May be an async load depending on
     * the environment and the circumstance of the load call.
     */
    run.load = function (moduleName, contextName) {
        var context = s.contexts[contextName], url;
        context.loaded[moduleName] = false;
        if (contextName !== s.ctxName) {
            //Not in the right context now, hold on to it until
            //the current context finishes all its loading.
            contextLoads.push(arguments);
        } else {
            //First derive the path name for the module.
            url = run.convertNameToPath(moduleName, contextName);
            run.attach(url, contextName, moduleName);
            context.startTime = (new Date()).getTime();
        }
    };

    run.jsExtRegExp = /\.js$/;

    /**
     * Converts a module name to a file path.
     */
    run.convertNameToPath = function (moduleName, contextName, ext) {
        var paths, syms, i, parentModule, url;

        if (run.jsExtRegExp.test(moduleName)) {
            //Just a plain path, not module name lookup, so just return it.
            return moduleName;
        } else {
            //A module that needs to be converted to a path.
            paths = s.contexts[contextName].config.paths;
            
            //Backwards compat issue with modules like Dojo or Google Closure.
            //Consider removing this in the future. While this compat shim
            //exists, supporting module names like "./some/path" will not work.
            //However, given the IE browser restriction of not firing script loads
            //in order with script evaluations, and to allow multiple modules
            //in a build file, relative paths do not make much sense.
            moduleName = moduleName.replace(/\./g, "/");

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
            return ((url.charAt(0) === '/' || url.match(/^\w+:/)) ? "" : s.contexts[contextName].config.baseUrl) + url;
        }
    };

    /**
     * Adds an array of deps to the module chain in the right order.
     * Called exclusively by traceDeps. Needs to be a different function
     * since it is called twice in traceDeps
     */
    function addDeps(deps, moduleChain, orderedModules, waiting, defined, modifiers) {
        var nextDep, nextModule, i, mods;
        if (deps && deps.length > 0) {
            for (i = 0; (nextDep = deps[i]); i++) {
                nextModule = waiting[waiting[nextDep]];
                if (nextModule && !nextModule.isOrdered) {
                    if (defined[nextDep]) {
                        //>>excludeStart("runExcludeModify", pragmas.run.excludeModify);
                        //Check for any modifiers on it.
                        //Need to check here since if defined, we do not want to add it to
                        //module change and have to reprocess the defined module.
                        mods = nextModule.name && modifiers[nextModule.name];
                        if (mods) {
                            addDeps(mods, moduleChain, orderedModules, waiting, defined, modifiers);
                            delete modifiers[nextModule.name];
                        }
                        //>>excludeEnd("runExcludeModify");
                    } else {
                        //New dependency. Follow it down. Modifiers followed in traceDeps.
                        moduleChain.push(nextModule);
                        if (nextModule.name) {
                            moduleChain[nextModule.name] = true;
                        }
                        traceDeps(moduleChain, orderedModules, waiting, defined, modifiers);
                    }
                }
            }
        }
    }

    /**
     * Figures out the right sequence to call module callbacks.
     */
    function traceDeps(moduleChain, orderedModules, waiting, defined, modifiers) {
        var module, mods;
        while (moduleChain.length > 0) {
            module = moduleChain[moduleChain.length - 1];
            if (module && !module.isOrdered) {
                module.isOrdered = true;

                //Trace down any dependencies for this resource.
                addDeps(module.deps, moduleChain, orderedModules, waiting, defined, modifiers);

                //Add the current module to the ordered list.
                orderedModules.push(module);

                //>>excludeStart("runExcludeModify", pragmas.run.excludeModify);
                //Now add any modifier modules for current module.
                mods = modifiers[module.name];
                if (mods) {
                    addDeps(mods, moduleChain, orderedModules, waiting, defined, modifiers);
                    delete modifiers[module.name];
                }
                //>>excludeEnd("runExcludeModify");
            }

            //Done with that require. Remove it and go to the next one.
            moduleChain.pop();
        }
    }

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
                loaded = context.loaded,
                noLoads = "",
                hasLoadedProp = false, stillLoading = false, prop, waiting,
                pIsWaiting = s.plugins.isWaiting, pOrderDeps = s.plugins.orderDeps,
                i, orderedModules, module, moduleChain, allDone, loads, loadArgs;

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
        if (!hasLoadedProp && !context.waiting.length && (!pIsWaiting || !pIsWaiting(context))) {
            //If the loaded object had no items, then the rest of
            //the work below does not need to be done.
            context.isCheckLoaded = false;
            return;
        }
        if (expired) {
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
        waiting = context.waiting;
        context.waiting = [];
        context.loaded = {};

        //Call plugins to order their dependencies, do their
        //module definitions.
        if (pOrderDeps) {
            pOrderDeps(context);
        }

        //Walk the dependencies, doing a depth first search.
        orderedModules = [];
        for (i = 0; (module = waiting[i]); i++) {
            moduleChain = [module];
            if (module.name) {
                moduleChain[module.name] = true;
            }

            traceDeps(moduleChain, orderedModules, waiting, context.defined, context.modifiers);
        }

        run.callModules(contextName, context, orderedModules);

        //Indicate checkLoaded is now done.
        context.isCheckLoaded = false;

        if (context.waiting.length || (pIsWaiting && pIsWaiting(context))) {
            //More things in this context are waiting to load. They were probably
            //added while doing the work above in checkLoaded, calling module
            //callbacks that triggered other run calls.
            run.checkLoaded(contextName);
        } else if (contextLoads.length) {
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
        } else {
            //Make sure we reset to default context.
            s.ctxName = defContextName;
        }
    };

    /**
     * After modules have been sorted into the right dependency order, bring
     * them into existence by calling the module callbacks.
     *
     * @private
     */
    run.callModules = function (contextName, context, orderedModules) {
        var module, name, dep, deps, args, i, j, depModule, cb, ret, modDef, prefix;
        //Call the module callbacks in order.
        for (i = 0; (module = orderedModules[i]); i++) {
            //Get objects for the dependencies.
            name = module.name;
            deps = module.deps;
            args = [];
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
                depModule = context.defined[dep];
                args.push(depModule);
            }

            //Call the callback to define the module, if necessary.
            cb = module.callback;
            if (cb && run.isFunction(cb)) {
                ret = cb.apply(run.global, args);
                if (name) {
                    modDef = context.defined[name];
                    if (modDef && ret) {
                        throw new Error(name + " has already been defined");
                    } else {
                        context.defined[name] = ret;
                    }
                }
            }
        }
    };

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
            var node = run.doc.createElement("script");
            node.src = url;
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

            return s.head.appendChild(node);
        }
        return null;
    };

    //****** START page load functionality ****************
    //Set up page on load callbacks. May separate this out.
     /**
     * Sets the page as loaded and triggers check for all modules loaded.
     */
    run.pageLoaded = function () {
        var callbacks = s.pageCallbacks, i, callback;
        if (!s.isPageLoaded) {
            s.isPageLoaded = true;
            if (scrollIntervalId) {
                clearInterval(scrollIntervalId);
            }
            s.pageCallbacks = [];
            for (i = 0; (callback = callbacks[i]); i++) {
                callback();
            }
        }
    };

    /**
     * Registers functions to call when the page is loaded
     */
    run.ready = function (callback) {
        if (s.isPageLoaded) {
            callback();
        } else {
            s.pageCallbacks.push(callback);
        }
        return run;
    };

    if (run.isBrowser) {
        if (run.doc.addEventListener) {
            //Standards. Hooray! Assumption here that if standards based,
            //it knows about DOMContentLoaded.
            run.doc.addEventListener("DOMContentLoaded", run.pageLoaded, false);
            window.addEventListener("load", run.pageLoaded, false);
        } else if (window.attachEvent) {
            window.attachEvent("onload", run.pageLoaded);

            //DOMContentLoaded approximation, as found by Diego Perini:
            //http://javascript.nwbox.com/IEContentLoaded/
            if (self === self.top) {
                scrollIntervalId = setInterval(function () {
                    try {
                        run.doc.documentElement.doScroll("left");
                        run.pageLoaded();
                    } catch (e) {}
                }, 30);
            }
        }

        //Check if document already complete, and if so, just trigger page load
        //listeners. NOTE: does not work with Firefox before 3.6. To support
        //those browsers, manually call run.pageLoaded().
        if (run.doc.readyState === "complete") {
            run.pageLoaded();
        }
    }
    //****** END page load functionality ****************
}());
