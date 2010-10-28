/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 0.14.5+ Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint plusplus: false */
/*global */
"use strict";

var require, define;
(function () {
    //Change this version number for each release.
    var version = "0.14.5+",
        ostring = Object.prototype.toString,
        defContextName = "_",
        empty = {},
        contexts = {},
        req, cfg;

    function isFunction(it) {
        return ostring.call(it) === "[object Function]";
    }

    function isArray(it) {
        return ostring.call(it) === "[object Array]";
    }
    
    /**
     * Used to set up package paths from a packagePaths or packages config object.
     * @param {Object} packages the object to store the new package config
     * @param {Array} currentPackages an array of packages to configure
     * @param {String} [dir] a prefix dir to use.
     */
    function configurePackageDir(packages, currentPackages, dir) {
        var i, location, pkgObj;
        for (i = 0; (pkgObj = currentPackages[i]); i++) {
            pkgObj = typeof pkgObj === "string" ? { name: pkgObj } : pkgObj;
            location = pkgObj.location;

            //Add dir to the path, but avoid paths that start with a slash
            //or have a colon (indicates a protocol)
            if (dir && (!location || (location.indexOf("/") !== 0 && location.indexOf(":") === -1))) {
                pkgObj.location = dir + "/" + (pkgObj.location || pkgObj.name);
            }

            //Normalize package paths.
            pkgObj.location = pkgObj.location || pkgObj.name;
            pkgObj.lib = pkgObj.lib || "lib";
            pkgObj.main = pkgObj.main || "main";

            packages[pkgObj.name] = pkgObj;
        }
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

    /**
     * Creates a new context for use in require and define calls.
     * Handle most of the heavy lifting. Do not want to use an object
     * with prototype here to avoid using "this" in require, in case it
     * needs to be used in more super secure envs that do not want this.
     * Also there should not be that many contexts in the page. Usually just
     * one for the default context, but could be extra for multiversion cases
     * or if a package needs a special context for a dependency that conflicts
     * with the standard context.
     */
    function newContext(contextName) {
        var config = {}, context, defQueue = [], paused = [];

        /**
         * Given a relative module name, like ./something, normalize it to
         * a real name that can be mapped to a path.
         * @param {String} name the relative name
         * @param {String} baseName a real name that the name arg is relative
         * to.
         * @returns {String} normalized name
         */
        function normalizeName(name, baseName) {
            //Adjust any relative paths.
            var part, i;
            if (name.charAt(0) === ".") {
                //If have a base name, try to normalize against it,
                //otherwise, assume it is a top-level require that will
                //be relative to baseUrl in the end.
                if (baseName) {
                    if (context.config.packages[baseName]) {
                        //If the baseName is a package name, then just treat it as one
                        //name to concat the name with.
                        baseName = [baseName];
                    } else {
                        //Convert baseName to array, and lop off the last part,
                        //so that . matches that "directory" and not name of the baseName's
                        //module. For instance, baseName of "one/two/three", maps to
                        //"one/two/three.js", but we want the directory, "one/two" for
                        //this normalization.
                        baseName = baseName.split("/");
                        baseName = baseName.slice(0, baseName.length - 1);
                    }
    
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
            }
            return name;
        }

        /**
         * Determine if priority loading is done. If so clear the priorityWait
         */
        function isPriorityDone() {
            var priorityDone = true,
                priorityWait = config.priorityWait,
                priorityName, i;
            if (priorityWait) {
                for (i = 0; (priorityName = priorityWait[i]); i++) {
                    if (!context.loaded[priorityName]) {
                        priorityDone = false;
                        break;
                    }
                }
                if (priorityDone) {
                    delete config.priorityWait;
                }
            }
            return priorityDone;
        }

        /**
         * Convenience method to call main for a require.def call that was put on
         * hold in the defQueue.
         */
        function callDefMain(args) {
            main.apply(null, args);
            //Mark the module loaded. Must do it here in addition
            //to doing it in require.def in case a script does
            //not call require.def
            context.loaded[args[0]] = true;
        }

        /**
         * Trace down the dependencies to see if they are loaded. If not, trigger
         * the load.
         * @param {String} pluginPrefix the plugin prefix, if any associated with the name.
         * @param {String} name: the name of the module that has the dependencies.
         * @param {Array} deps array of dependencies.
         */
        function checkDeps(pluginPrefix, name, deps) {
            //Figure out if all the modules are loaded. If the module is not
            //being loaded or already loaded, add it to the "to load" list,
            //and request it to be loaded.
            var i, dep;

            if (pluginPrefix) {
                //>>excludeStart("requireExcludePlugin", pragmas.requireExcludePlugin);
                callPlugin(pluginPrefix, {
                    name: "checkDeps",
                    args: [name, deps]
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
                            callPlugin(dep.prefix, {
                                name: "load",
                                args: [dep.name]
                            });
                            //>>excludeEnd("requireExcludePlugin");
                        } else {
                            load(dep.name);
                        }
                    }
                }
            }
        }

        /**
         * Resumes tracing of dependencies and then checks if everything is loaded.
         */
        function resume() {
            var args, i;
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
                        callDefMain(args);
                    }
                }

                //Skip the resume if current context is in priority wait.
                if (config.priorityWait && !isPriorityDone()) {
                    return;
                }

                if (paused.length) {
                    for (i = 0; (args = paused[i]); i++) {
                        checkDeps.apply(null, args);
                    }
                }

                checkLoaded();
            }
        }

        //Define the context object.
        context = {
            contextName: contextName,
            config: config,
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
            //>>excludeStart("requireExcludePlugin", pragmas.requireExcludePlugin);
            plugins: {
                defined: {},
                callbacks: {},
                waiting: {}
            },
            //>>excludeEnd("requireExcludePlugin");
            modifiers: {},
            /**
             * Set a configuration for the context.
             * @param {Object} cfg config object to integrate.
             */
            configure: function (cfg) {
                var paths, packages, prop, packagePaths;

                //Make sure the baseUrl ends in a slash.
                if (cfg.baseUrl) {
                    if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== "/") {
                        cfg.baseUrl += "/";
                    }
                }
    
                //Save off the paths and packages since they require special processing,
                //they are additive.
                paths = config.paths;
                packages = config.packages;
    
                //Mix in the config values, favoring the new values over
                //existing ones in context.config.
                req.mixin(config, cfg, true);
    
                //Adjust paths if necessary.
                if (cfg.paths) {
                    for (prop in cfg.paths) {
                        if (!(prop in empty)) {
                            paths[prop] = cfg.paths[prop];
                        }
                    }
                    config.paths = paths;
                }
    
                packagePaths = cfg.packagePaths;
                if (packagePaths || cfg.packages) {
                    //Convert packagePaths into a packages config.
                    if (packagePaths) {
                        for (prop in packagePaths) {
                            if (!(prop in empty)) {
                                configurePackageDir(packages, packagePaths[prop], prop);
                            }
                        }
                    }
    
                    //Adjust packages if necessary.
                    if (cfg.packages) {
                        configurePackageDir(packages, cfg.packages);
                    }
    
                    //Done with modifications, assing packages back to context config
                    config.packages = packages;
                }
    
                //If priority loading is in effect, trigger the loads now
                if (cfg.priority) {
                    //Create a separate config property that can be
                    //easily tested for config priority completion.
                    //Do this instead of wiping out the config.priority
                    //in case it needs to be inspected for debug purposes later.
                    context.require(cfg.priority);
                    config.priorityWait = cfg.priority;
                }
    
                //If a deps array or a config callback is specified, then call
                //require with those args. This is useful when require is defined as a
                //config object before require.js is loaded.
                if (cfg.deps || cfg.callback) {
                    context.require(cfg.deps || [], cfg.callback);
                }

                //Set up ready callback, if asked. Useful when require is defined as a
                //config object before require.js is loaded.
                if (cfg.ready) {
                    req.ready(cfg.ready);
                }
            },

            require: function (deps, callback, relModuleName) {
                var moduleName, ret;
                if (typeof deps === "string") {
                    //Just return the module wanted. In this scenario, the
                    //second arg (if passed) is just the relModuleName.
                    relModuleName = callback;
                    if (moduleName === "require" ||
                        moduleName === "exports" || moduleName === "module") {
                        req.onError(new Error("Explicit require of " +
                                              moduleName + " is not allowed."));
                    }
           
                    //Normalize module name, if it contains . or ..
                    moduleName = normalizeName(moduleName, relModuleName);

                    ret = context.defined[moduleName];
                    if (ret === undefined) {
                        req.onError(new Error("require: module name '" +
                                    moduleName +
                                    "' has not been loaded yet for context: " +
                                    contextName));
                    }
                    return ret;
                }

        
                main(null, deps, callback, relModuleName);
        
                //If the require call does not trigger anything new to load,
                //then resume the dependency processing.
                if (!context.scriptCount) {
                    resume();
                }

//TODO: Need to allow queuing calls if current global context is not right.

            },
            define: function (name, deps, callback) {
                
            }
        };

        return context;
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
    req = require = function (deps, callback) {

        //Find the right context, use default
        var contextName = defContextName,
            context, config;

        // Determine if have config object in the call.
        if (!isArray(deps)) {
            // deps is a config object
            config = deps;
            if (isArray(callback)) {
                // Adjust args if there are dependencies
                deps = callback;
                callback = arguments[2];
            } else {
                deps = [];
            }
        }

        if (config && config.context) {
            contextName = config.context;
        }

        context = contexts[contextName] ||
                  (contexts[contextName] = newContext(contextName));

        if (config) {
            context.configure(config);
        }

        context.require(deps, callback);

//TODO: Need to allow queuing calls if context is not right.
    };

    req.version = version;
    req.isArray = isArray;
    req.isFunction = isFunction;
    
}());
