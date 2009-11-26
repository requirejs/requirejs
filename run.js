/*
    Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
    Available via the new BSD license.
    see: http://code.google.com/p/runjs/ for details
*/
/*jslint regexp: false, nomen: false, plusplus: false */
/*global run: true, window: false, document: false, navigator: false,
setTimeout: false, setInterval: false, clearInterval: false */

"use strict";

(function () {
    //Change this version number for each release.
    var version = [0, 0, 4, ""],
            run = typeof run === "undefined" ? null : run,
            oldState = null, empty = {},
            i, defContextName = "_runDefault", contextLoads = [],
            //regexp for matching nls (i18n) module names.
            nlsRegExp = /(^.*(^|\.)nls(\.|$))([^\.]*)\.?([^\.]*)/,
            scripts, script, rePkg, src, m,
            readyRegExp = /complete|loaded/,
            pageLoadRegExp = /loaded|complete/,
            head = (document.getElementsByTagName("head")[0] || document.getElementsByTagName("html")[0]),
            ostring = Object.prototype.toString, aps = Array.prototype.slice;

    //Check for an existing version of run.
    //Only overwrite if there is a version of run and it is less
    //than this version.
    if (run) {
        if (!run.version) {
            return;
        } else {
            for (i = 0; i < 2; i++) {
                if (run.version[i] >= version[i]) {
                    return;
                }
            }
        }
        //Save off old state and reset state on old item to avoid bad callbacks.
        oldState = {
            _contexts: run._contexts,
            _pageCallbacks: run._pageCallbacks,
            _currContextName: run._currContextName,
            _paused: run._paused,
            isBrowser: run.isBrowser,
            isPageLoaded: run.isPageLoaded
        };
        run._pageCallbacks = [];
    }

    function makeContextFunc(name, contextName) {
        return function () {
            //A version of a run function that uses the current context.
            //If last arg is a string, then it is a context.
            //If last arg is not a string, then add context to it.
            var args = [].concat(Array.prototype.slice.call(arguments, 0));
            if (typeof arguments[arguments.length - 1] !== "string") {
                args.push(contextName);
            }
            return (name ? run[name] : run).apply(run.global, args);
        };
    }

    /**
     * The function that loads modules or executes code that has dependencies
     * on other modules.
     */
    run = function (name, deps, callback, contextName, altContextName) {
        var config = null, context, loaded, canSetContext, prop, dep, baseUrl,
                newLength, match, master, nlsw, bundle, i, j, parts, toLoad,
                newContext, contextRun, isFunction = false, mods;

        //Normalize the arguments.
        if (typeof name === "string") {
            //Defining a module.
            
            //Check if the defined module will be a function.
            if (deps === Function) {
                isFunction = true;
                deps = callback;
                callback = contextName;
                contextName = altContextName;
            }

            //Check if there are no dependencies, and adjust args.
            if (!run.isArray(deps)) {
                contextName = callback;
                callback = deps;
                deps = [];
            }

            contextName = contextName || run._currContextName;

            //If module already defined for context, leave.
            context = run._contexts[contextName];
            if (context && context.specified && context.specified[name]) {
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

        contextName = contextName || run._currContextName;

        if (contextName !== run._currContextName) {
            //If nothing is waiting on being loaded in the current context,
            //then switch run._currContextName to current contextName.
            loaded = (run._contexts[run._currContextName] && run._contexts[run._currContextName].loaded);
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
                run._currContextName = contextName;
            }
        }

        //Grab the context, or create a new one for the given context name.
        context = run._contexts[contextName];
        if (!context) {
            newContext = {
                waiting: [],
                nlsWaiting: {},
                baseUrl: run.baseUrl || "./",
                locale: typeof navigator === "undefined" ? "root" :
                        (navigator.language || navigator.userLanguage || "root").toLowerCase(),
                paths: {},
                waitSeconds: 7,
                specified: {
                    "run": true
                },
                loaded: {
                    "run": true
                },
                defined: {},
                isFuncs: {},
                modifiers: {},
                nls: {}
            };

            //Define run() for this context.
            contextRun = makeContextFunc(null, contextName);
            contextRun.modify = makeContextFunc("modify", contextName);
            contextRun.ready = run.ready;
            contextRun.myContextName = contextName;
            contextRun.context = newContext;
            contextRun.def = newContext.defined;
            newContext.defined.run = contextRun;

            context = run._contexts[contextName] = newContext;
        }

        //If have a config object, update the context object with
        //the config values.
        if (config) {
            if ("waitSeconds" in config) {
                context.waitSeconds = config.waitSeconds;
            }

            if (config.baseUrl) {
                baseUrl = config.baseUrl;
                //Make sure the baseUrl ends in a slash.
                if (baseUrl.charAt(baseUrl.length - 1) !== "/") {
                    baseUrl += "/";
                }
                context.baseUrl = baseUrl;
            }

            if (config.paths) {
                for (prop in config.paths) {
                    if (!(prop in empty)) {
                        context.paths[prop] = config.paths[prop];
                    }
                }
            }
            
            if (config.locale) {
                context.locale = config.locale.toLowerCase();
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
            //so no need to fetch it again.
            context.specified[name] = true;

            //If the module will be a function, remember it.
            if (isFunction) {
                context.isFuncs[name] = true;
            }
            
            //Load any modifiers for the module.
            mods = context.modifiers[name];
            if (mods) {
                run(mods, contextName);
            }
        }

        //If the callback is not an actual function, it means it already
        //has the definition of the module as a literal value.
        if (callback && !run.isFunction(callback)) {
            context.defined[name] = callback;
        }


        //See if the modules is an nls module and handle it special.
        match = nlsRegExp.exec(name);
        if (match) {
            //Reconstruct the master bundle name from parts of the regexp match
            //nlsRegExp.exec("foo.bar.baz.nls.en-ca.foo") gives:
            //["foo.bar.baz.nls.en-ca.foo", "foo.bar.baz.nls.", ".", ".", "en-ca", "foo"]
            //nlsRegExp.exec("foo.bar.baz.nls.foo") gives:
            //["foo.bar.baz.nls.foo", "foo.bar.baz.nls.", ".", ".", "foo", ""]
            //so, if match[5] is blank, it means this is the top bundle definition,
            //so it does not have to be handled. Only deal with ones that have a locale
            //(a match[4] value but no match[5])
            if (match[5]) {
                master = match[1] + match[5];

                //Track what locale bundle need to be generated once all the modules load.
                nlsw = (context.nlsWaiting[master] || (context.nlsWaiting[master] = {}));
                nlsw[match[4]] = true;

                bundle = context.nls[master];
                if (!bundle) {
                    //No master bundle yet, ask for it.
                    context.defined.run([master]);
                    bundle = context.nls[master] = {};
                }
                //For nls modules, the callback is just a regular object,
                //so save it off in the bundle now.
                bundle[match[4]] = callback;
            }
        }


        //See if all is loaded. If paused, then do not check the dependencies
        //of the module yet.
        if (run._paused) {
            run._paused.push([name, contextName, context, deps]);
        } else {
            run._checkDeps(name, contextName, context, deps);
            run.checkLoaded(contextName);
        }

        return run;
    };

    /**
     * Pauses the tracing of dependencies. Useful in a build scenario when
     * multiple modules are bundled into one file, and they all need to be
     * run before figuring out what is left still to load.
     */
    run.pause = function () {
        if (!run._paused) {
            run._paused = [];
        }
    };

    /**
     * Resumes the tracing of dependencies. Useful in a build scenario when
     * multiple modules are bundled into one file. This method is related
     * to run.pause() and should only be called if run.pause() was called first.
     */
    run.resume = function () {
        var i, args, paused;
        if (run._paused) {
            paused = run._paused;
            delete run._paused;
            for (i = 0; (args = paused[i]); i++) {
                run._checkDeps.apply(run, args);
            }
        }
        run.checkLoaded(run._currContextName);
    };

    /**
     * Run down the dependencies to see if they are loaded. If not, trigger
     * the load.
     * @param {String} name: the name of the module that has the dependencies.
     *
     * @param {String} contextName: the name of the loading context.
     *
     * @param {Object} context: the loading context.
     *
     * @param {Array} deps array of dependencies.
     */
    run._checkDeps = function (name, contextName, context, deps) {
        //Figure out if all the modules are loaded. If the module is not
        //being loaded or already loaded, add it to the "to load" list,
        //and request it to be loaded.
        var i, j, dep, bundle, parts, toLoad, nlsw, loc, val;
        for (i = 0; (dep = deps[i]); i++) {
            //If it is a string, then a plain dependency
            if (typeof dep === "string") {
                if (!(dep in context.specified)) {
                    context.loaded[dep] = false;
                    run.load(dep, contextName);
                }
            } else {
                //dep is an object, so it is an i18n nls thing.
                //Track it in the nls section of the context.
                //It may have already been created via a specific locale
                //request, so just mixin values in that case, to preserve
                //the specific locale bundle object.
                bundle = context.nls[name];
                if (bundle) {
                    run.mixin(bundle, dep);
                } else {
                    context.nls[name] = dep;
                }

                //Break apart the locale to get the parts.
                parts = context.locale.split("-");
                
                //Now see what bundles exist for each country/locale.
                //Want to walk up the chain, so if locale is en-us-foo,
                //look for en-us-foo, en-us, en, then root.
                toLoad = [];

                nlsw = context.nlsWaiting[name] || (context.nlsWaiting[name] = {});
                for (j = parts.length; j > -1; j--) {
                    loc = j ? parts.slice(0, j).join("-") : "root";
                    val = dep[loc];
                    if (val) {
                        //Store which bundle to use for the default bundle definition.
                        nlsw.__match = nlsw.__match || loc;

                        //Track that the locale needs to be resolved with its parts.
                        nlsw[loc] = true;

                        //If locale value is a string, it means it is a resource that
                        //needs to be loaded. Track it to load if it has not already
                        //been asked for.
                        if (typeof val === "string" &&
                                !context.specified[val] &&
                                !(val in context.loaded)) {
                            toLoad.push(val);
                        }
                    }
                }

                //Load any bundles that are still needed.
                if (toLoad.length) {
                    context.defined.run(toLoad);
                }
            }
        }
    };

    /**
     * Register a module that modifies another module. The modifier will
     * only be called once the target module has been loaded.
     *
     * First syntax:
     *
     * run.modify({
     *     "some.target1": "my.modifier1",
     *     "some.target2": "my.modifier2",
     * });
     *
     * With this syntax, the my.modifier1 will only be loaded when
     * "some.target1" is loaded.
     *
     * Second syntax, defining a modifier.
     *
     * run.modify("some.target1", "my.modifier",
     *                        ["some.target1", "some.other"],
     *                        function (target, other) {
     *                            //Modify properties of target here.
     *                            Only properties of target can be modified, but
     *                            target cannot be replaced.
     *                        }
     * );
     */
    run.modify = function (target, name, deps, callback, contextName) {
        var prop, modifier, list,
                cName = (typeof target === "string" ? contextName : name) || run._currContextName,
                context = run._contexts[cName],
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

    //Export to global namespace.
    run.global = this;
    run.global.run = run;

    run.version = version;
    run.isBrowser = oldState ? oldState.isBrowser : typeof window !== "undefined" && navigator && document;
    run.isPageLoaded = oldState ? oldState.isPageLoaded : !run.isBrowser;

    run.isArray = function (it) {
        return ostring.call(it) === "[object Array]";
    };

    run.isFunction = function (it) {
        return ostring.call(it) === "[object Function]";
    };

    //Set up storage for modules that is partitioned by context. Create a
    //default context too.
    run._currContextName = oldState ? oldState._currContextName : defContextName;
    run._contexts = oldState ? oldState._contexts : {};
    if (oldState) {
        run._paused = oldState._paused;
    }

    //Set up page load detection for the browser case.
    if (run.isBrowser) {
        //Figure out baseUrl. Get it from the script tag with run.js in it.
        scripts = document.getElementsByTagName("script");
        rePkg = /run\.js(\W|$)/i;
        for (i = scripts.length - 1; (script = scripts[i]); i--) {
            src = script.getAttribute("src");
            if (src) {
                m = src.match(rePkg);
                if (m) {
                    run.baseUrl = src.substring(0, m.index);
                }
                break;
            }
        }
    }

    /**
     * Makes the request to load a module. May be an async load depending on
     * the environment and the circumstance of the load call.
     */
    run.load = function (moduleName, contextName) {
        if (contextName !== run._currContextName) {
            //Not in the right context now, hold on to it until
            //the current context finishes all its loading.
            contextLoads.push(arguments);

        } else {
            //First derive the path name for the module.
            var url = run.convertNameToPath(moduleName, contextName);
            run.attach(url, contextName, moduleName);
            run._contexts[contextName].startTime = (new Date()).getTime();
        }
    };

    run.jsExtRegExp = /\.js$/;

    /**
     * Converts a module name to a file path.
     */
    run.convertNameToPath = function (moduleName, contextName) {
        var paths, syms, i, parentModule, url;

        if (run.jsExtRegExp.test(moduleName)) {
            //Just a plain path, not module name lookup, so just return it.
            return moduleName;
        } else {
            //A module that needs to be converted to a path.
            paths = run._contexts[contextName].paths;
            syms = moduleName.split(".");
            //For each module name segment, see if there is a path
            //registered for it. Start with most specific name
            //and work up from it.
            for (i = syms.length; i > 0; i--) {
                parentModule = syms.slice(0, i).join(".");
                if (paths[parentModule]) {
                    syms.splice(0, i, paths[parentModule]);
                    break;
                }
            }

            //Join the path parts together, then figure out if baseUrl is needed.
            url = syms.join("/") + ".js";
            return ((url.charAt(0) === '/' || url.match(/^\w+:/)) ? "" : run._contexts[contextName].baseUrl) + url;
        }
    };

    //Helper that create a function stand-in for a module that has yet to
    //be defined.
    function makeDepFunc(context, depName) {
        return function () {
            return context.isFuncs[depName].apply(this, arguments);
        };
    }

    /**
     * Checks if all modules for a context are loaded, and if so, evaluates the
     * new ones in right dependency order.
     */
    run.checkLoaded = function (contextName) {
        var context = run._contexts[contextName || run._currContextName],
                waitInterval = context.waitSeconds * 1000,
                //It is possible to disable the wait interval by using waitSeconds of 0.
                expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                loaded = context.loaded,
                noLoads = "",
                hasLoadedProp = false, stillLoading = false,
                prop, waiting, nlsWaiting, master, msWaiting, bundle, defLoc, parts,
                modulePrefix, moduleSuffix, loc, mixed, i, j, locPart, orderedModules,
                module, moduleChain, name, deps, args, depModule, cb, ret, modDef,
                allDone, loads, loadArgs, dep;

        //If already doing a checkLoaded call,
        //then do not bother checking loaded state.
        if (context._isCheckLoaded) {
            return;
        }

        //Signal that checkLoaded is being run, so other calls that could be triggered
        //by calling a waiting callback that then calls run and then this function
        //should not proceed. At the end of this function, if there are still things
        //waiting, then checkLoaded will be called again.
        context._isCheckLoaded = true;

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
        if (!hasLoadedProp && !context.waiting.length && !context.nlsWaiting.length) {
            //If the loaded object had no items, then the rest of
            //the work below does not need to be done.
            context._isCheckLoaded = false;
            return;
        }
        if (expired) {
            //If wait time expired, throw error of unloaded modules.
            throw new Error("run.js load timeout for modules: " + noLoads);
        }
        if (stillLoading) {
            //Something is still waiting to load. Wait for it.
            context._isCheckLoaded = false;
            setTimeout(function () {
                run.checkLoaded(contextName);
            }, 50);
            return;
        }

        //Resolve dependencies. First clean up state because the evaluation
        //of modules might create new loading tasks, so need to reset.
        waiting = context.waiting;
        nlsWaiting = context.nlsWaiting;
        context.waiting = [];
        context.nlsWaiting = {};
        context.loaded = {};

        //First, properly mix in any nls bundles waiting to happen.
        //Use an empty object to detect other bad JS code that modifies
        //Object.prototype.
        for (prop in nlsWaiting) {
            if (!(prop in empty)) {
                //Each property is a master bundle name.
                master = prop;
                msWaiting = nlsWaiting[prop];
                bundle = context.nls[master];
                defLoc = null;

                //Create the module name parts from the master name. So, if master
                //is foo.nls.bar, then the parts should be prefix: "foo.nls",
                // suffix: "bar", and the final locale's module name will be foo.nls.locale.bar
                parts = master.split(".");
                modulePrefix = parts.slice(0, parts.length - 1).join(".");
                moduleSuffix = parts[parts.length - 1];
                //Cycle through the locale props on the waiting object and combine
                //the locales together.
                for (loc in msWaiting) {
                    if (!(loc in empty)) {
                        if (loc === "__match") {
                            //Found default locale to use for the top-level bundle name.
                            defLoc = msWaiting[loc];
                        } else {
                            //Mix in the properties of this locale together.
                            //Split the locale into pieces.
                            mixed = {};
                            parts = loc.split("-");
                            for (i = parts.length; i > 0; i--) {
                                locPart = parts.slice(0, i).join("-");
                                if (locPart !== "root" && bundle[locPart]) {
                                    run.mixin(mixed, bundle[locPart]);
                                }
                            }
                            if (bundle.root) {
                                run.mixin(mixed, bundle.root);
                            }

                            context.defined[modulePrefix + "." + loc + "." + moduleSuffix] = mixed;
                        }
                    }
                }

                //Finally define the default locale. Wait to the end of the property
                //loop above so that the default locale bundle has been properly mixed
                //together.
                context.defined[master] = context.defined[modulePrefix + "." + defLoc + "." + moduleSuffix];
            }
        }

        //Walk the dependencies, doing a depth first search.
        orderedModules = [];
        for (i = 0; (module = waiting[i]); i++) {
            moduleChain = [module];
            if (module.name) {
                moduleChain[module.name] = true;
            }

            run.traceDeps(moduleChain, orderedModules, waiting, context.defined, context.modifiers);
        }

        //Call the module callbacks in order.
        for (i = 0; (module = orderedModules[i]); i++) {
            //Get objects for the dependencies.
            name = module.name;
            deps = module.deps;
            args = [];
            for (j = 0; (dep = deps[j]); j++) {
                //Get dependent module. If it does not exist, because of a circular
                //dependency, create a placeholder object or function.
                depModule = context.defined[dep];
                if (!depModule) {
                    depModule = context.defined[dep] = context.isFuncs[dep] ?
                            makeDepFunc(context, dep)
                        :
                            {};
                }
                args.push(depModule);
            }

            //Call the callback to define the module, if necessary.
            cb = module.callback;
            if (cb && run.isFunction(cb)) {
                ret = cb.apply(window, args);
                if (name) {
                    modDef = context.defined[name];
                    if (modDef && ret) {
                        //Placeholder objet for the module exists. 
                        //Mix in the contents of the ret object. This is done for
                        //cases where we passed the placeholder module to a circular
                        //dependency.
                        run.mixin(modDef, ret);
                        if (context.isFuncs[name]) {
                            //Hold on to the real function for modules that got this module
                            //as a dependency, but then also replace the function in the
                            //defined set so newer modules that get this module as a
                            //dependency can get the real thing.
                            context.isFuncs[name] = ret;
                            context.defined[name] = ret;
                        }
                    } else {
                        context.defined[name] = ret;
                    }
                }
            }
        }

        //Indicate checkLoaded is now done.
        context._isCheckLoaded = false;

        if (context.waiting.length || context.nlsWaiting.length) {
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
                run._currContextName = contextLoads[0][1];
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
            run._currContextName = defContextName;
        }
    };

    /**
     * Figures out the right sequence to call module callbacks.
     */
    run.traceDeps = function (moduleChain, orderedModules, waiting, defined, modifiers) {
        var module, mods;
        while (moduleChain.length > 0) {
            module = moduleChain[moduleChain.length - 1];
            if (module && !module.isOrdered) {
                module.isOrdered = true;

                //Trace down any dependencies for this resource.
                run.addDeps(module.deps, moduleChain, orderedModules, waiting, defined, modifiers);

                //Add the current module to the ordered list.
                orderedModules.push(module);

                //Now add any modifier modules for current module.
                mods = modifiers[module.name];
                if (mods) {
                    run.addDeps(mods, moduleChain, orderedModules, waiting, defined, modifiers);
                    delete modifiers[module.name];
                }
            }

            //Done with that require. Remove it and go to the next one.
            moduleChain.pop();
        }
    };

    /**
     * Adds an array of deps to the module chain in the right order.
     * Called exclusively by run.traceDeps. Needs to be a different function
     * since it is called twice in run.traceDeps
     */
    run.addDeps = function (deps, moduleChain, orderedModules, waiting, defined, modifiers) {
        var nextDep, nextModule, i, mods;
        if (deps && deps.length > 0) {
            for (i = 0; (nextDep = deps[i]); i++) {
                nextModule = waiting[waiting[nextDep]];
                if (nextModule && !nextModule.isOrdered) {
                    if (defined[nextDep]) {
                        //Check for any modifiers on it.
                        //Need to check here since if defined, we do not want to add it to
                        //module change and have to reprocess the defined module.
                        mods = nextModule.name && modifiers[nextModule.name];
                        if (mods) {
                            run.addDeps(mods, moduleChain, orderedModules, waiting, defined, modifiers);
                            delete modifiers[nextModule.name];
                        }
                    } else {
                        //New dependency. Follow it down. Modifiers followed in traceDeps.
                        moduleChain.push(nextModule);
                        if (nextModule.name) {
                            moduleChain[nextModule.name] = true;
                        }
                        run.traceDeps(moduleChain, orderedModules, waiting, defined, modifiers);
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
     */
    run.onScriptLoad = function (evt) {
        var node = evt.target || evt.srcElement, contextName, moduleName;
        if (evt.type === "load" || readyRegExp.test(node.readyState)) {
            //Pull out the name of the module and the context.
            contextName = node.getAttribute("data-runcontext");
            moduleName = node.getAttribute("data-runmodule");

            //Mark the module loaded.
            run._contexts[contextName].loaded[moduleName] = true;

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

            return head.appendChild(node);
        }
        return null;
    };

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     */
    run.mixin = function (target, source) {
        //Use an empty object to avoid other bad JS code that modifies
        //Object.prototype.
        var prop;
        for (prop in source) {
            if (!(prop in target)) {
                target[prop] = source[prop];
            }
        }
        return run;
    };

    //****** START page load functionality ****************
    //Set up page on load callbacks. May separate this out.
     /**
     * Sets the page as loaded and triggers check for all modules loaded.
     */
    run.pageLoaded = function () {
        if (!run.isPageLoaded) {
            run.isPageLoaded = true;
            run._callReady();
        }
    };

    run._pageCallbacks = oldState ? oldState._pageCallbacks : [];

    run._callReady = function () {
        var callbacks = run._pageCallbacks, i, callback;
        run._pageCallbacks = [];
        for (i = 0; (callback = callbacks[i]); i++) {
            callback();
        }
    };

    /**
     * Registers functions to call when the page is loaded
     */
    run.ready = function (callback) {
        if (run.isPageLoaded) {
            callback();
        } else {
            run._pageCallbacks.push(callback);
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
        }
    }
    //****** END page load functionality ****************
}());
