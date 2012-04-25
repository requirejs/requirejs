/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 2.0.0zdev Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint regexp: true, nomen: true */
/*global window, navigator, document, importScripts, jQuery, setTimeout, opera */

var requirejs, require, define;
(function () {
    'use strict';

    var version = "2.0.0zdev",
        commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
        cjsRequireRegExp = /require\(\s*["']([^'"\s]+)["']\s*\)/g,
        jsSuffixRegExp = /\.js$/,
        currDirRegExp = /^\.\//,
        ostring = Object.prototype.toString,
        ap = Array.prototype,
        aps = ap.slice,
        apsp = ap.splice,
        isBrowser = !!(typeof window !== "undefined" && navigator && document),
        isWebWorker = !isBrowser && typeof importScripts !== "undefined",
        //PS3 indicates loaded and complete, but need to wait for complete
        //specifically. Sequence is "loading", "loaded", execution,
        // then "complete". The UA check is unfortunate, but not sure how
        //to feature test w/o causing perf issues.
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
                      /^complete$/ : /^(complete|loaded)$/,
        defContextName = "_",
        //Oh the tragedy, detecting opera. See the usage of isOpera for reason.
        isOpera = typeof opera !== "undefined" && opera.toString() === "[object Opera]",
        contexts = {},
        cfg = {},
        globalDefQueue = [],
        useInteractive = false,
        req, s, head, baseElement, scripts, globalI, script, dataMain, src,
        interactiveScript, currentlyAddingScript, mainScript, subPath;

    function isFunction(it) {
        return ostring.call(it) === "[object Function]";
    }

    function isArray(it) {
        return ostring.call(it) === "[object Array]";
    }

    /**
     * Helper function for iterating over an array. If the func returns
     * a true value, it will break out of the loop.
     */
    function each(ary, func) {
        if (ary) {
            var i;
            for (i = 0; i < ary.length; i += 1) {
                if (func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    /**
     * Cycles over properties in an object and calls a function for each
     * property value. If the function returns a truthy value, then the
     * iteration is stopped.
     */
    function eachProp(obj, func) {
        var prop;
        for (prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                if (func(obj[prop], prop)) {
                    break;
                }
            }
        }
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     * This is not robust in IE for transferring methods that match
     * Object.prototype names, but the uses of mixin here seem unlikely to
     * trigger a problem related to that.
     */
    function mixin(target, source, force) {
        if (source) {
            eachProp(source, function (value, prop) {
                if (force || !target.hasOwnProperty(prop)) {
                    target[prop] = value;
                }
            });
        }
    }

    //Similar to Function.prototype.bind, but the "this" object is specified
    //first, since it is easier to read/figure out what "this" will be.
    function bind(obj, fn) {
        return function () {
            return fn.apply(obj, arguments);
        };
    }

    /**
     * Constructs an error with a pointer to an URL with more information.
     * @param {String} id the error ID that maps to an ID on a web page.
     * @param {String} message human readable error.
     * @param {Error} [err] the original error, if there is one.
     *
     * @returns {Error}
     */
    function makeError(id, msg, err) {
        var e = new Error(msg + '\nhttp://requirejs.org/docs/errors.html#' + id);
        if (err) {
            e.originalError = err;
        }
        return e;
    }

    if (typeof define !== "undefined") {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    if (typeof requirejs !== "undefined") {
        if (isFunction(requirejs)) {
            //Do not overwrite and existing requirejs instance.
            return;
        } else {
            cfg = requirejs;
            requirejs = undefined;
        }
    }

    //Allow for a require config object
    if (typeof require !== "undefined" && !isFunction(require)) {
        //assume it is a config object.
        cfg = require;
        require = undefined;
    }

    function newContext(contextName) {
        var config = {
                waitSeconds: 7,
                baseUrl: "./",
                paths: {},
                pkgs: {},
                catchError: {}
            },
            registry = {},
            undefEvents = {},
            defined = {},
            urlMap = {},
            urlFetched = {},
            needFullExec = {},
            fullExec = {},
            plugins = {},
            requireCounter = 1,
            unnormalizedCounter = 1,
            //Used to track the order in which modules
            //should be executed, by the order they
            //load. Important for consistent cycle resolution
            //behavior.
            waitAry = [],
            inCheckLoaded, inCycle, Module, context, handlers,
            checkLoadedTimeoutId;

        /**
         * Trims the . and .. from an array of path segments.
         * It will keep a leading path segment if a .. will become
         * the first path segment, to help with module name lookups,
         * which act like paths, but can be remapped. But the end result,
         * all paths that use this function should look normalized.
         * NOTE: this method MODIFIES the input array.
         * @param {Array} ary the array of path segments.
         */
        function trimDots(ary) {
            var i, part;
            for (i = 0; ary[i]; i+= 1) {
                part = ary[i];
                if (part === ".") {
                    ary.splice(i, 1);
                    i -= 1;
                } else if (part === "..") {
                    if (i === 1 && (ary[2] === '..' || ary[0] === '..')) {
                        //End of the line. Keep at least one non-dot
                        //path segment at the front so it can be mapped
                        //correctly to disk. Otherwise, there is likely
                        //no path mapping for a path starting with '..'.
                        //This can still fail, but catches the most reasonable
                        //uses of ..
                        break;
                    } else if (i > 0) {
                        ary.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
        }

        /**
         * Given a relative module name, like ./something, normalize it to
         * a real name that can be mapped to a path.
         * @param {String} name the relative name
         * @param {String} baseName a real name that the name arg is relative
         * to.
         * @returns {String} normalized name
         */
        function normalize(name, baseName) {
            var pkgName, pkgConfig;

            //Adjust any relative paths.
            if (name && name.charAt(0) === ".") {
                //If have a base name, try to normalize against it,
                //otherwise, assume it is a top-level require that will
                //be relative to baseUrl in the end.
                if (baseName) {
                    if (config.pkgs[baseName]) {
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
                    trimDots(name);

                    //Some use of packages may use a . path to reference the
                    //"main" module name, so normalize for that.
                    pkgConfig = config.pkgs[(pkgName = name[0])];
                    name = name.join("/");
                    if (pkgConfig && name === pkgName + '/' + pkgConfig.main) {
                        name = pkgName;
                    }
                } else if (name.indexOf("./") === 0) {
                    // No baseName, so this is ID is resolved relative
                    // to baseUrl, pull off the leading dot.
                    name = name.substring(2);
                }
            }
            return name;
        }

        /**
         * Creates a module mapping that includes plugin prefix, module
         * name, and path. If parentModuleMap is provided it will
         * also normalize the name via require.normalize()
         *
         * @param {String} name the module name
         * @param {String} [parentModuleMap] parent module map
         * for the module name, used to resolve relative names.
         * @param {Boolean} isNormalized: is the ID already normalized.
         * This is true if this call is done for a define() module ID.
         *
         * @returns {Object}
         */
        function makeModuleMap(name, parentModuleMap, isNormalized) {
            var index = name ? name.indexOf("!") : -1,
                prefix = null,
                parentName = parentModuleMap ? parentModuleMap.name : null,
                originalName = name,
                isDefine = true,
                normalizedName, url, pluginModule, suffix;

            //If no name, then it means it is a require call, generate an
            //internal name.
            if (!name) {
                isDefine = false;
                name = '_@r' + (requireCounter += 1);
            }

            if (index !== -1) {
                prefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
            }

            if (prefix) {
                prefix = normalize(prefix, parentName);
            }

            //Account for relative paths if there is a base name.
            if (name) {
                if (prefix) {
                    pluginModule = defined[prefix];
                    if (pluginModule && pluginModule.normalize) {
                        //Plugin is loaded, use its normalize method.
                        normalizedName = pluginModule.normalize(name, function (name) {
                            return normalize(name, parentName);
                        });
                    } else {
                        normalizedName = normalize(name, parentName);
                    }
                } else {
                    //A regular module.
                    normalizedName = normalize(name, parentName);

                    url = urlMap[normalizedName];
                    if (!url) {
                        //Calculate url for the module, if it has a name.
                        //Use name here since nameToUrl also calls normalize,
                        //and for relative names that are outside the baseUrl
                        //this causes havoc. Was thinking of just removing
                        //parentModuleMap to avoid extra normalization, but
                        //normalize() still does a dot removal because of
                        //issue #142, so just pass in name here and redo
                        //the normalization. Paths outside baseUrl are just
                        //messy to support.
                        url = context.nameToUrl(name, null, parentModuleMap);

                        //Store the URL mapping for later.
                        urlMap[normalizedName] = url;
                    }
                }
            }

            //If the id is a plugin id that cannot be determined if it needs
            //normalization, stamp it with a unique ID so two matching relative
            //ids that may conflict can be separate.
            suffix = prefix && !pluginModule && !isNormalized ?
                     '_unnormalized' + (unnormalizedCounter += 1) :
                     '';

            return {
                prefix: prefix,
                name: normalizedName,
                parentMap: parentModuleMap,
                unnormalized: !!suffix,
                url: url,
                originalName: originalName,
                isDefine: isDefine,
                id: (prefix ?
                    prefix + "!" + (normalizedName || '') :
                    normalizedName) + suffix
            };
        }

        function getModule(depMap) {
            var id = depMap.id,
                mod = registry[id];

            if (!mod) {
                mod = registry[id] = new Module(depMap);
            }

            return mod;
        }

        function enable(depMap, needFullExec) {
            var id = depMap.id,
                mod = registry[id];

            if (mod) {
                getModule(depMap).enable(needFullExec);
            } else if (needFullExec && !fullExec[id]) {
                //The full exec was not done on a defined module,
                //undefine and try again.
                context.undef(id, context);
                getModule(depMap).enable(needFullExec);
            }
        }

        function on(depMap, name, fn) {
            var id = depMap.id,
                mod = registry[id];

            if (defined.hasOwnProperty(id) &&
                (!mod || mod.defineEmitComplete)) {
                if (name === 'defined') {
                    fn(defined[id]);
                }
            } else {
                getModule(depMap).on(name, fn);
            }
        }

        function makeContextModuleFunc(func, relMap, enableBuildCallback) {
            return function () {
                //A version of a require function that passes a moduleName
                //value for items that may need to
                //look up paths relative to the moduleName
                var args = aps.call(arguments, 0), lastArg;
                if (enableBuildCallback &&
                    isFunction((lastArg = args[args.length - 1]))) {
                    lastArg.__requireJsBuild = true;
                }
                args.push(relMap);
                return func.apply(null, args);
            };
        }

        /**
         * Helper function that creates a require function object to give to
         * modules that ask for it as a dependency. It needs to be specific
         * per module because of the implication of path mappings that may
         * need to be relative to the module name.
         */
        function makeRequire(mod, enableBuildCallback, altRequire) {
            var relMap = mod && mod.map,
                modRequire = makeContextModuleFunc(altRequire || context.require, relMap, enableBuildCallback);

            mixin(modRequire, {
                toUrl: makeContextModuleFunc(context.toUrl, relMap),
                nameToUrl: makeContextModuleFunc(context.nameToUrl, relMap),
                defined: makeContextModuleFunc(context.requireDefined, relMap),
                specified: makeContextModuleFunc(context.requireSpecified, relMap)
            });
            return modRequire;
        }

        handlers = {
            'require': function (mod) {
                return makeRequire(mod);
            },
            'exports': function (mod) {
                mod.usingExports = true;
                if (mod.map.isDefine) {
                    return (mod.exports = defined[mod.map.id] = {});
                }
            },
            'module': function (mod) {
                return (mod.module = {
                    id: mod.map.id,
                    uri: mod.map.url,
                    exports: defined[mod.map.id]
                });
            }
        };

        function removeScript(name) {
            var scripts = document.getElementsByTagName('script'),
                i, scriptNode;
            for (i = 0; i < scripts.length; i += 1) {
                scriptNode = scripts[i];
                if (scriptNode.getAttribute('data-requiremodule') === name &&
                    scriptNode.getAttribute('data-requirecontext') === context.contextName) {
                    scriptNode.parentNode.removeChild(scriptNode);
                    context.scriptCount -= 1;
                    break;
                }
            }
        }

        function findCycle(mod, traced) {
            var id = mod.map.id,
                depArray = mod.depMaps,
                fullLoaded = true,
                foundModule;

            //Do not bother with unitialized modules or not yet enabled
            //modules.
            if (!mod.inited) {
                return;
            }

            //Found the cycle.
            if (traced[id]) {
                return mod;
            }

            traced[id] = true;

            //Trace through the dependencies.
            each(depArray, function (depMap) {
                var depId = depMap.id,
                    depMod = registry[depId];

                if (!depMod) {
                    return;
                }

                if (!depMod.inited) {
                    //Dependency is not inited, so this cannot
                    //be used to determine a cycle.
                    foundModule = null;
                    delete traced[id];
                    return true;
                }

                return (foundModule = findCycle(depMod, traced));
            });

            return foundModule;
        }

        function forceExec(mod, traced, uninited) {
            var id = mod.map.id,
                depArray = mod.depMaps;

            if (!mod.inited || !mod.map.isDefine) {
                return;
            }

            if (traced[id]) {
                return defined[id];
            }

            traced[id] = mod;

            each(depArray, function(depMap) {
                var depId = depMap.id,
                    depMod = registry[depId],
                    value, pluginMod;

                if (handlers[depId]) {
                    return;
                }

                if (depMod) {
                    if (!depMod.inited) {
                        //Dependency is not inited,
                        //so this module cannot be
                        //given a forced value yet.
                        uninited[id] = true;
                        return;
                    }

                    //Get the value for the current dependency
                    value = forceExec(depMod, traced, uninited);

                    //Even with forcing it may not be done,
                    //in particular if the module is waiting
                    //on a plugin resource.
                    if (!uninited[depId]) {
                        mod.defineDepById(depId, value);
                    }
                }
            });

            mod.check(true);

            return defined[id];
        }

        function modCheck(mod) {
            mod.check();
        }

        function checkLoaded() {
            var waitInterval = config.waitSeconds * 1000,
                //It is possible to disable the wait interval by using waitSeconds of 0.
                expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                noLoads = [],
                stillLoading = false,
                needCycleCheck = true,
                map, modId, err;

            //Do not bother if this call was a result of a cycle break.
            if (inCycle || inCheckLoaded) {
                return;
            }

            inCheckLoaded = true;

            //Figure out the state of all the modules.
            eachProp(registry, function (mod) {
                map = mod.map;
                modId = map.id;

                //Skip things that are not enabled.
                if (!mod.enabled) {
                    return;
                }

                //If the module should be executed, and it has not
                //been inited and time is up, remember it.
                if (!mod.inited && expired) {
                    noLoads.push(modId);
                    if (isBrowser) {
                        removeScript(modId);
                    }
                } else if (!mod.inited && mod.fetched && map.isDefine) {
                    stillLoading = true;
                    if (!map.prefix) {
                        //No reason to keep looking for unfinished
                        //loading. If the only stillLoading is a
                        //plugin resource though, keep going,
                        //because it may be that a plugin resource
                        //is waiting on a non-plugin cycle.
                        return (needCycleCheck = false);
                    }
                }
            });

            if (expired && noLoads.length) {
                //If wait time expired, throw error of unloaded modules.
                err = makeError("timeout", "Load timeout for modules: " + noLoads);
                err.requireType = "timeout";
                err.requireModules = noLoads;
                err.contextName = context.contextName;
//TODO: trigger error handlers for modules.
                return req.onError(err);
            }

            //Not expired, check for a cycle.
            if (needCycleCheck) {

                each(waitAry, function (mod) {
                    if (mod.defined) {
                        return;
                    }

                    var cycleMod = findCycle(mod, {}),
                        traced = {};

                    if (cycleMod) {
                        forceExec(cycleMod, traced, {});

                        //traced modules may have been
                        //removed from the registry, but
                        //their listeners still need to
                        //be called.
                        eachProp(traced, modCheck);
                    }
                });

                //Now that dependencies have
                //been satisfied, trigger the
                //completion check that then
                //notifies listeners.
                eachProp(registry, modCheck);
            }

            //If still waiting on loads, and the waiting load is something
            //other than a plugin resource, or there are still outstanding
            //scripts, then just try back later.
            if (!expired && stillLoading) {
                //Something is still waiting to load. Wait for it, but only
                //if a timeout is not already in effect.
                if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
                    checkLoadedTimeoutId = setTimeout(function () {
                        checkLoadedTimeoutId = 0;
                        checkLoaded();
                    }, 50);
                }
            }

            inCheckLoaded = false;
        }

        Module = function (map) {
            this.events = undefEvents[map.id] || {};
            this.map = map;
            this.depExports = [];
            this.depMaps = [];
            this.depMatched = [];
            this.pluginMaps = {};
            this.depCount = 0;

            /* this.exports this.factory
               this.depMaps = [],
               this.enabled, this.fetched
            */
        };

        Module.prototype = {
            init: function(depMaps, factory, errback, options) {
                options = options || {};

                //Do not do more inits if already done. Can happen if there
                //are multiple define calls for the same module. That is not
                //a normal, common case, but it is also not unexpected.
                if (this.inited) {
                    return;
                }

                this.factory = factory;

                if (errback) {
                    //Register for errors on this module.
                    this.on('error', errback);
                } else if (this.events.error) {
                    //If no errback already, but there are error listeners
                    //on this module, set up an errback to pass to the deps.
                    errback = function (err) {
                        this.emit('error', err);
                    };
                }

                each(depMaps, bind(this, function (depMap, i) {
                    if (typeof depMap === 'string') {
                        depMap = makeModuleMap(depMap,
                                               (this.map.isDefine ? this.map : this.map.parentMap));
                        this.depMaps.push(depMap);
                    }

                    var handler = handlers[depMap.id];

                    if (handler) {
                        this.depExports[i] = handler(this);
                        return;
                    }

                    this.depCount += 1;

                    on(depMap, 'defined', bind(this, function (depExports) {
                        this.defineDep(i, depExports);
                        this.check();
                    }));

                    if (errback) {
                        on(depMap, 'error', function (err) {
                            errback(err);
                        });
                    }
                }));

                //Indicate this module has be initialized
                this.inited = true;

                this.ignore = options.ignore;

                //Could have option to init this module in enabled mode,
                //or could have been previously marked as enabled. However,
                //the dependencies are not known until init is called. So
                //if enabled previously, now trigger dependencies as enabled.
                if (options.enabled || this.enabled) {
                    //Enable this module and dependencies.
                    //Will call this.check()
                    this.enable();
                } else {
                    this.check();
                }
            },

            defineDepById: function (id, depExports) {
                var i;

                //Find the index for this dependency.
                each(this.depMaps, function (map, index) {
                    if (map.id === id) {
                        i = index;
                        return true;
                    }
                });

                return this.defineDep(i, depExports);
            },

            defineDep: function (i, depExports) {
                //Because of cycles, defined callback for a given
                //export can be called more than once.
                if (!this.depMatched[i]) {
                    this.depMatched[i] = true;
                    this.depCount -= 1;
                    this.depExports[i] = depExports;
                }
            },

            fetch: function () {
                if (this.fetched) {
                    return;
                }
                this.fetched = true;

                context.startTime = (new Date()).getTime();

                var map = this.map,
                    url = map.url,
                    id = map.id;

                //If the manager is for a plugin managed resource,
                //ask the plugin to load it now.
                if (map.prefix) {
                    this.callPlugin();
                } else {
                    //Regular dependency.
                    if (!urlFetched[url] && !this.inited) {
                        req.load(context, id, url);

                        //Mark the URL as fetched, but only if it is
                        //not an empty: URL, used by the optimizer.
                        //In that case we need to be sure to call
                        //load() for each module that is mapped to
                        //empty: so that dependencies are satisfied
                        //correctly.
                        if (url.indexOf('empty:') !== 0) {
                            urlFetched[url] = true;
                        }
                    }
                }
            },

            /**
             * Checks is the module is ready to define itself, and if so,
             * define it. If the silent argument is true, then it will just
             * define, but not notify listeners, and not ask for a context-wide
             * check of all loaded modules. That is useful for cycle breaking.
             */
            check: function (silent) {
                if (!this.enabled) {
                    return;
                }

                var id = this.map.id,
                    depExports = this.depExports,
                    exports = this.exports,
                    factory = this.factory,
                    err, cjsModule;

                if (!this.inited) {
                    this.fetch();
                } else {
                    if (this.depCount < 1 && !this.defined) {
                        if (factory !== undefined) {
                            if (isFunction(factory)) {
                                if (config.catchError.define) {
                                    try {
                                        exports = req.execCb(id, factory, depExports, exports);
                                    } catch (e) {
                                        err = e;
                                    }
                                } else {
                                    exports = req.execCb(id, factory, depExports, exports);
                                }

                                if (this.map.isDefine) {
                                    //If setting exports via "module" is in play,
                                    //favor that over return value and exports. After that,
                                    //favor a non-undefined return value over exports use.
                                    cjsModule = this.module;
                                    if (cjsModule &&
                                        cjsModule.exports !== undefined &&
                                        //Make sure it is not already the exports value
                                        cjsModule.exports !== this.exports) {
                                        exports = cjsModule.exports;
                                    } else if (exports === undefined && this.usingExports) {
                                        //exports already set the defined value.
                                        exports = this.exports;
                                    }
                                }
                            } else {
                                //Just a literal value
                                exports = factory;
                            }
                        }

                        this.exports = exports;

                        if (this.map.isDefine && !this.ignore) {
                            defined[id] = exports;
                            //If build needed a full execution, indicate it
                            //has been done now.
                            if (needFullExec[id]) {
                                fullExec[id] = true;
                            }

                            if (req.onResourceLoad) {
                                req.onResourceLoad(context, this.map, this.depMaps);
                            }
                        }

                        //Clean up
                        delete registry[id];

                        this.defined = true;
                        context.waitCount -= 1;
                        if (context.waitCount === 0) {
                            //Clear the wait array used for cycles.
                            waitAry = [];
                        }
                    }

                    if (!silent) {
                        if (this.defined && !this.defineEmitted) {
                            this.defineEmitted = true;
                            this.emit('defined', this.exports);
                            this.defineEmitComplete = true;
                        }
                        checkLoaded();
                    }
                }
            },

            callPlugin: function() {
                var map = this.map,
                    pluginMap = makeModuleMap(map.prefix);

                context.plugins[pluginMap.id] = true;

                on(pluginMap, 'defined', bind(this, function (plugin) {
                    var name = this.map.name,
                        parentName = this.map.parentMap ? this.map.parentMap.name : null,
                        normalizedName, load, normalizedMap;

                    //Normalize the ID if the plugin allows it.
                    if (plugin.normalize) {
                        normalizedName = plugin.normalize(name, function (name) {
                            return normalize(name, parentName);
                        });
                    }

                    //If the name was normalized to something else, then wait
                    //for that normalized name to load instead of continuing.
                    if ((normalizedName && normalizedName !== name) || this.map.unnormalized) {
                        normalizedMap = makeModuleMap(map.prefix + '!' + (normalizedName || name));
                        on(normalizedMap,
                           'defined', bind(this, function (value) {
                            this.init([], function () { return value; }, null, {
                                enabled: true,
                                ignore: true
                            });
                        }));
                        enable(normalizedMap);

                        return;
                    }

                    load = bind(this, function (value) {
                        this.init([], function () { return value; }, null, {
                            enabled: true
                        });
                    });

                    //Allow plugins to load other code without having to know the
                    //context or how to "complete" the load.
                    load.fromText = function (moduleName, text) {
                        /*jslint evil: true */
                        var hasInteractive = useInteractive;

                        //Turn off interactive script matching for IE for any define
                        //calls in the text, then turn it back on at the end.
                        if (hasInteractive) {
                            useInteractive = false;
                        }

                        req.exec(text);

                        if (hasInteractive) {
                            useInteractive = true;
                        }

                        //Support anonymous modules.
                        context.completeLoad(moduleName);
                    };

                    //Use parentName here since the plugin's name is not reliable,
                    //could be some weird string with no path that actually wants to
                    //reference the parentName's path.
                    plugin.load(map.name, makeRequire(map.parentMap, true, function (deps, cb) {
                        return context.require(deps, cb);
                    }), load, config);
                }));

                enable(pluginMap);
                this.pluginMaps[pluginMap.id] = pluginMap;
            },

            enable: function () {
                this.enabled = true;
                var needFullExec = this.needFullExec;

                if (!this.waitPushed) {
                    waitAry.push(this);
                    context.waitCount += 1;
                    this.waitPushed = true;
                }

                //Enable each dependency
                each(this.depMaps, function (map) {
                    var id = map.id,
                        mod = registry[id];
                    //Skip special modules like 'require', 'exports', 'module'
                    //Also, don't call enable if it is already enabled,
                    //important in circular dependency cases.
                    if (!handlers[id] && mod && !mod.enabled) {
                        enable(map, needFullExec);
                    }
                });

                //Enable each plugin that is used in
                //a dependency
                eachProp(this.pluginMaps, function (pluginMap) {
                    var mod = registry[pluginMap.id];
                    if (mod && !mod.enabled) {
                        enable(pluginMap, needFullExec);
                    }
                });

                this.check();
            },

            on: function(name, cb) {
                var cbs = this.events[name];
                if (!cbs) {
                    cbs = this.events[name] = [];
                }
                cbs.push(cb);
            },

            emit: function (name, evt) {
                each(this.events[name], function (cb) {
                    cb(evt);
                });
            }
        };

        function callGetModule(args) {
            getModule(makeModuleMap(args[0], null, true)).init(args[1], args[2]);
        }

        return (context = {
            config: config,
            contextName: contextName,
            registry: registry,
            defined: defined,
            urlMap: urlMap,
            urlFetched: urlFetched,
            //Used to indicate which modules in a build scenario
            //need to be full executed.
            needFullExec: needFullExec,
            fullExec: fullExec,
            plugins: plugins,
            waitCount: 0,
            defQueue: [],
            makeModuleMap: makeModuleMap,

            /**
             * Set a configuration for the context.
             * @param {Object} cfg config object to integrate.
             */
            configure: function (cfg) {
                var paths, packages, pkgs;

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
                pkgs = config.pkgs;

                //Mix in the config values, favoring the new values over
                //existing ones in context.config.
                mixin(config, cfg, true);

                //Merge paths.
                mixin(paths, cfg.paths, true);
                config.paths = paths;

                //Adjust packages if necessary.
                if (cfg.packages) {
                    each(cfg.packages, function (pkgObj) {
                        var location;

                        pkgObj = typeof pkgObj === "string" ? { name: pkgObj } : pkgObj;
                        location = pkgObj.location;

                        //Create a brand new object on pkgs, since currentPackages can
                        //be passed in again, and config.pkgs is the internal transformed
                        //state for all package configs.
                        pkgs[pkgObj.name] = {
                            name: pkgObj.name,
                            location: location || pkgObj.name,
                            //Remove leading dot in main, so main paths are normalized,
                            //and remove any trailing .js, since different package
                            //envs have different conventions: some use a module name,
                            //some use a file name.
                            main: (pkgObj.main || "main")
                                  .replace(currDirRegExp, '')
                                  .replace(jsSuffixRegExp, '')
                        };
                    });

                    //Done with modifications, assing packages back to context config
                    config.pkgs = pkgs;
                }

                //If a deps array or a config callback is specified, then call
                //require with those args. This is useful when require is defined as a
                //config object before require.js is loaded.
                if (cfg.deps || cfg.callback) {
                    context.require(cfg.deps || [], cfg.callback);
                }
            },

            require: function (deps, callback, errback, relMap) {
                var moduleName, id, map, requireMod, args;
                if (typeof deps === "string") {
                    if (isFunction(callback)) {
                        //Invalid call
                        return req.onError(makeError("requireargs", "Invalid require call"));
                    }

                    //Synchronous access to one module. If require.get is
                    //available (as in the Node adapter), prefer that.
                    //In this case deps is the moduleName and callback is
                    //the relMap
                    if (req.get) {
                        return req.get(context, deps, callback);
                    }

                    //Just return the module wanted. In this scenario, the
                    //second arg (if passed) is just the relMap.
                    moduleName = deps;
                    relMap = callback;

                    //Normalize module name, if it contains . or ..
                    map = makeModuleMap(moduleName, relMap);
                    id = map.id;

                    if (!defined.hasOwnProperty(id)) {
                        return req.onError(makeError("notloaded", "Module name '" +
                                    id +
                                    "' has not been loaded yet for context: " +
                                    contextName));
                    }
                    return defined[id];
                }

                //Callback require. Normalize args. if errback is not a function,
                //it means it is a relMap.
                if (errback && !isFunction(errback)) {
                    relMap = errback;
                    errback = undefined;
                }

                //Any defined modules in the global queue, intake them now.
                context.takeGlobalQueue();

                //Make sure any remaining defQueue items get properly processed.
                while (context.defQueue.length) {
                    args = context.defQueue.shift();
                    if (args[0] === null) {
                        return req.onError(makeError('mismatch', 'Mismatched anonymous define() module: ' + args[args.length - 1]));
                    } else {
                        //args are id, deps, factory. Should be normalized by the
                        //define() function.
                        callGetModule(args);
                    }
                }

                //Mark all the dependencies as needing to be loaded.
                requireMod = getModule(makeModuleMap(null, relMap));

                requireMod.init(deps, callback, errback, {
                    enabled: true
                });

                return context.require;
            },

            undef: function (id) {
                var map = makeModuleMap(id, null, true),
                    mod = registry[id];

                delete defined[id];
                delete urlMap[id];
                delete urlFetched[map.url];
                delete undefEvents[id];
                delete plugins[id];

                if (mod) {
                    delete registry[id];

                    //Hold on to listeners in case the
                    //module will be attempted to be reloaded
                    //using a different config.
                    if (mod.events.defined) {
                        undefEvents[id] = mod.events;
                    }
                }
            },

            /**
             * Internal method to transfer globalQueue items to this context's
             * defQueue.
             */
            takeGlobalQueue: function () {
                //Push all the globalDefQueue items into the context's defQueue
                if (globalDefQueue.length) {
                    //Array splice in the values since the context code has a
                    //local var ref to defQueue, so cannot just reassign the one
                    //on context.
                    apsp.apply(context.defQueue,
                               [context.defQueue.length - 1, 0].concat(globalDefQueue));
                    globalDefQueue = [];
                }
            },

            /**
             * Internal method used by environment adapters to complete a load event.
             * A load event could be a script load or just a load pass from a synchronous
             * load call.
             * @param {String} moduleName the name of the module to potentially complete.
             */
            completeLoad: function (moduleName) {
                var found, args;

                context.takeGlobalQueue();

                while (context.defQueue.length) {
                    args = context.defQueue.shift();
                    if (args[0] === null) {
                        args[0] = moduleName;
                        //If already found an anonymous module and bound it
                        //to this name, then this is some other anon module
                        //waiting for its completeLoad to fire.
                        if (found) {
                            break;
                        }
                        found = true;
                    } else if (args[0] === moduleName) {
                        //Found matching define call for this script!
                        found = true;
                    }

                    callGetModule(args);
                }

                if (!found && !defined[moduleName]) {
                    //A script that does not call define(), so just simulate
                    //the call for it.
                    callGetModule([moduleName, [], null]);
                }
            },

            /**
             * Converts a module name + .extension into an URL path.
             * *Requires* the use of a module name. It does not support using
             * plain URLs like nameToUrl.
             */
            toUrl: function (moduleNamePlusExt, relModuleMap) {
                var index = moduleNamePlusExt.lastIndexOf("."),
                    ext = null;

                if (index !== -1) {
                    ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
                    moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
                }

                return context.nameToUrl(moduleNamePlusExt, ext, relModuleMap);
            },

            /**
             * Converts a module name to a file path. Supports cases where
             * moduleName may actually be just an URL.
             */
            nameToUrl: function (moduleName, ext, relModuleMap) {
                var paths, pkgs, pkg, pkgPath, syms, i, parentModule, url;

                //Normalize module name if have a base relative module name to work from.
                moduleName = normalize(moduleName, relModuleMap && relModuleMap.id);

                //If a colon is in the URL, it indicates a protocol is used and it is just
                //an URL to a file, or if it starts with a slash, contains a query arg (i.e. ?)
                //or ends with .js, then assume the user meant to use an url and not a module id.
                //The slash is important for protocol-less URLs as well as full paths.
                if (req.jsExtRegExp.test(moduleName)) {
                    //Just a plain path, not module name lookup, so just return it.
                    //Add extension if it is included. This is a bit wonky, only non-.js things pass
                    //an extension, this method probably needs to be reworked.
                    url = moduleName + (ext || "");
                } else {
                    //A module that needs to be converted to a path.
                    paths = config.paths;
                    pkgs = config.pkgs;

                    syms = moduleName.split("/");
                    //For each module name segment, see if there is a path
                    //registered for it. Start with most specific name
                    //and work up from it.
                    for (i = syms.length; i > 0; i -= 1) {
                        parentModule = syms.slice(0, i).join("/");
                        pkg = pkgs[parentModule];
                        if (paths[parentModule]) {
                            syms.splice(0, i, paths[parentModule]);
                            break;
                        } else if (pkg) {
                            //If module name is just the package name, then looking
                            //for the main module.
                            if (moduleName === pkg.name) {
                                pkgPath = pkg.location + '/' + pkg.main;
                            } else {
                                pkgPath = pkg.location;
                            }
                            syms.splice(0, i, pkgPath);
                            break;
                        }
                    }

                    //Join the path parts together, then figure out if baseUrl is needed.
                    url = syms.join("/") + (ext || ".js");
                    url = (url.charAt(0) === '/' || url.match(/^[\w\+\.\-]+:/) ? "" : config.baseUrl) + url;
                }

                return config.urlArgs ? url +
                                        ((url.indexOf('?') === -1 ? '?' : '&') +
                                         config.urlArgs) : url;
            }
        });
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
     *
     * Make a local req variable to help Caja compliance (it assumes things
     * on a require that are not standardized), and to give a short
     * name for minification/local scope use.
     */
    req = requirejs = function (deps, callback, possibleCallback) {

        //Find the right context, use default
        var contextName = defContextName,
            context, config;

        // Determine if have config object in the call.
        if (!isArray(deps) && typeof deps !== "string") {
            // deps is a config object
            config = deps;
            if (isArray(callback)) {
                // Adjust args if there are dependencies
                deps = callback;
                callback = possibleCallback;
            } else {
                deps = [];
            }
        }

        if (config && config.context) {
            contextName = config.context;
        }

        context = contexts[contextName];
        if (!context) {
            context = contexts[contextName] = newContext(contextName);
        }

        if (config) {
            context.configure(config);
        }

        return context.require(deps, callback);
    };

    /**
     * Support require.config() to make it easier to cooperate with other
     * AMD loaders on globally agreed names.
     */
    req.config = function (config) {
        return req(config);
    };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    if (!require) {
        require = req;
    }

    /**
     * Global require.toUrl(), to match global require, mostly useful
     * for debugging/work in the global space.
     */
    req.toUrl = function (moduleNamePlusExt) {
        return contexts[defContextName].toUrl(moduleNamePlusExt);
    };

    /**
     * Global require.undef(), to allow undefining a module, and resetting
     * internal state to act like it was not loaded. It *does not* clean up
     * any script tag that may have been used to load the module, unless the
     * script timed out from loading via a waitSeconds expiration.
     */
    req.undef = function (name, contextName) {
        contexts[contextName || defContextName].undef(name);
    };

    req.version = version;

    //Used to filter out dependencies that are already paths.
    req.jsExtRegExp = /^\/|:|\?|\.js$/;
    req.isBrowser = isBrowser;
    s = req.s = {
        contexts: contexts,
        //Stores a list of URLs that should not get async script tag treatment.
        skipAsync: {}
    };

    req.isAsync = req.isBrowser = isBrowser;
    if (isBrowser) {
        head = s.head = document.getElementsByTagName("head")[0];
        //If BASE tag is in play, using appendChild is a problem for IE6.
        //When that browser dies, this can be removed. Details in this jQuery bug:
        //http://dev.jquery.com/ticket/2709
        baseElement = document.getElementsByTagName("base")[0];
        if (baseElement) {
            head = s.head = baseElement.parentNode;
        }
    }

    /**
     * Any errors that require explicitly generates will be passed to this
     * function. Intercept/override it if you want custom error handling.
     * @param {Error} err the error object.
     */
    req.onError = function (err) {
        throw err;
    };

    /**
     * Does the request to load a module for the browser case.
     * Make this a separate function to allow other environments
     * to override it.
     *
     * @param {Object} context the require context to find state.
     * @param {String} moduleName the name of the module.
     * @param {Object} url the URL to the module.
     */
    req.load = function (context, moduleName, url) {
        req.attach(url, context, moduleName);
    };

    function getInteractiveScript() {
        var scripts, i, script;
        if (interactiveScript && interactiveScript.readyState === 'interactive') {
            return interactiveScript;
        }

        scripts = document.getElementsByTagName('script');
        for (i = scripts.length - 1; i > -1; i -= 1) {
            script = scripts[i];
            if (script.readyState === 'interactive') {
                return (interactiveScript = script);
            }
        }
    }

    /**
     * Adds a node to the DOM. Public function since used by the order plugin.
     * This method should not normally be called by outside code.
     */
    req.addScriptToDom = function (node) {
        //For some cache cases in IE 6-8, the script executes before the end
        //of the appendChild execution, so to tie an anonymous define
        //call to the module name (which is stored on the node), hold on
        //to a reference to this node, but clear after the DOM insertion.
        currentlyAddingScript = node;
        if (baseElement) {
            head.insertBefore(node, baseElement);
        } else {
            head.appendChild(node);
        }
        currentlyAddingScript = null;
    };

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

        if (evt.type === "load" || (node && readyRegExp.test(node.readyState))) {
            //Reset interactive script so a script node is not held onto for
            //to long.
            interactiveScript = null;

            //Pull out the name of the module and the context.
            contextName = node.getAttribute("data-requirecontext");
            moduleName = node.getAttribute("data-requiremodule");
            context = contexts[contextName];

            contexts[contextName].completeLoad(moduleName);

            //Clean up script binding. Favor detachEvent because of IE9
            //issue, see attachEvent/addEventListener comment elsewhere
            //in this file.
            if (node.detachEvent && !isOpera) {
                //Probably IE. If not it will throw an error, which will be
                //useful to know.
                node.detachEvent("onreadystatechange", req.onScriptLoad);
            } else {
                node.removeEventListener("load", req.onScriptLoad, false);
            }
        }
    };

    /**
     * Attaches the script represented by the URL to the current
     * environment. Right now only supports browser loading,
     * but can be redefined in other environments to do the right thing.
     * @param {String} url the url of the script to attach.
     * @param {Object} context the context that wants the script.
     * @param {moduleName} the name of the module that is associated with the script.
     * @param {Function} [callback] optional callback, defaults to require.onScriptLoad
     * @param {String} [type] optional type, defaults to text/javascript
     * @param {Function} [fetchOnlyFunction] optional function to indicate the script node
     * should be set up to fetch the script but do not attach it to the DOM
     * so that it can later be attached to execute it. This is a way for the
     * order plugin to support ordered loading in IE. Once the script is fetched,
     * but not executed, the fetchOnlyFunction will be called.
     */
    req.attach = function (url, context, moduleName, callback, type, fetchOnlyFunction) {
        var node;
        if (isBrowser) {
            //In the browser so use a script tag
            callback = callback || req.onScriptLoad;
            node = context && context.config && context.config.xhtml ?
                    document.createElementNS("http://www.w3.org/1999/xhtml", "html:script") :
                    document.createElement("script");
            node.type = type || (context && context.config.scriptType) ||
                        "text/javascript";
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
            node.async = !s.skipAsync[url];

            if (context) {
                node.setAttribute("data-requirecontext", context.contextName);
            }
            node.setAttribute("data-requiremodule", moduleName);

            //Set up load listener. Test attachEvent first because IE9 has
            //a subtle issue in its addEventListener and script onload firings
            //that do not match the behavior of all other browsers with
            //addEventListener support, which fire the onload event for a
            //script right after the script execution. See:
            //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
            //UNFORTUNATELY Opera implements attachEvent but does not follow the script
            //script execution mode.
            if (node.attachEvent &&
                // check if node.attachEvent is artificially added by custom script or
                // natively supported by browser
                // read https://github.com/jrburke/requirejs/issues/187
                // if we can NOT find [native code] then it must NOT natively supported.
                // in IE8, node.attachEvent does not have toString()
                // TODO: a better way to check interactive mode
                !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code]') < 0) &&
                !isOpera) {
                //Probably IE. IE (at least 6-8) do not fire
                //script onload right after executing the script, so
                //we cannot tie the anonymous define call to a name.
                //However, IE reports the script as being in "interactive"
                //readyState at the time of the define call.
                useInteractive = true;


                if (fetchOnlyFunction) {
                    //Need to use old school onreadystate here since
                    //when the event fires and the node is not attached
                    //to the DOM, the evt.srcElement is null, so use
                    //a closure to remember the node.
                    node.onreadystatechange = function () {
                        //Script loaded but not executed.
                        //Clear loaded handler, set the real one that
                        //waits for script execution.
                        if (node.readyState === 'loaded') {
                            node.onreadystatechange = null;
                            node.attachEvent("onreadystatechange", callback);
                            fetchOnlyFunction(node);
                        }
                    };
                } else {
                    node.attachEvent("onreadystatechange", callback);
                }
            } else {
                node.addEventListener("load", callback, false);
            }
            node.src = url;

            //Fetch only means waiting to attach to DOM after loaded.
            if (!fetchOnlyFunction) {
                req.addScriptToDom(node);
            }

            return node;
        } else if (isWebWorker) {
            //In a web worker, use importScripts. This is not a very
            //efficient use of importScripts, importScripts will block until
            //its script is downloaded and evaluated. However, if web workers
            //are in play, the expectation that a build has been done so that
            //only one script needs to be loaded anyway. This may need to be
            //reevaluated if other use cases become common.
            importScripts(url);

            //Account for anonymous modules
            context.completeLoad(moduleName);
        }
    };

    //Look for a data-main script attribute, which could also adjust the baseUrl.
    if (isBrowser) {
        //Figure out baseUrl. Get it from the script tag with require.js in it.
        scripts = document.getElementsByTagName("script");

        for (globalI = scripts.length - 1; globalI > -1; globalI -= 1) {
            script = scripts[globalI];

            //Set the "head" where we can append children by
            //using the script's parent.
            if (!head) {
                head = script.parentNode;
            }

            //Look for a data-main attribute to set main script for the page
            //to load. If it is there, the path to data main becomes the
            //baseUrl, if it is not already set.
            dataMain = script.getAttribute('data-main');
            if (dataMain) {
                if (!cfg.baseUrl) {
                    //Pull off the directory of data-main for use as the
                    //baseUrl.
                    src = dataMain.split('/');
                    mainScript = src.pop();
                    subPath = src.length ? src.join('/')  + '/' : './';

                    //Set final config.
                    cfg.baseUrl = subPath;
                    //Strip off any trailing .js since dataMain is now
                    //like a module name.
                    dataMain = mainScript.replace(jsSuffixRegExp, '');
                }

                //Put the data-main script in the files to load.
                cfg.deps = cfg.deps ? cfg.deps.concat(dataMain) : [dataMain];

                break;
            }
        }
    }

    /**
     * The function that handles definitions of modules. Differs from
     * require() in that a string for the module should be the first argument,
     * and the function to execute after dependencies are loaded should
     * return a value to define the module corresponding to the first argument's
     * name.
     */
    define = function (name, deps, callback) {
        var node, context;

        //Allow for anonymous functions
        if (typeof name !== 'string') {
            //Adjust args appropriately
            callback = deps;
            deps = name;
            name = null;
        }

        //This module may not have dependencies
        if (!isArray(deps)) {
            callback = deps;
            deps = [];
        }

        //If no name, and callback is a function, then figure out if it a
        //CommonJS thing with dependencies.
        if (!deps.length && isFunction(callback)) {
            //Remove comments from the callback string,
            //look for require calls, and pull them into the dependencies,
            //but only if there are function args.
            if (callback.length) {
                callback
                    .toString()
                    .replace(commentRegExp, "")
                    .replace(cjsRequireRegExp, function (match, dep) {
                        deps.push(dep);
                    });

                //May be a CommonJS thing even without require calls, but still
                //could use exports, and module. Avoid doing exports and module
                //work though if it just needs require.
                //REQUIRES the function to expect the CommonJS variables in the
                //order listed below.
                deps = (callback.length === 1 ? ["require"] : ["require", "exports", "module"]).concat(deps);
            }
        }

        //If in IE 6-8 and hit an anonymous define() call, do the interactive
        //work.
        if (useInteractive) {
            node = currentlyAddingScript || getInteractiveScript();
            if (node) {
                if (!name) {
                    name = node.getAttribute("data-requiremodule");
                }
                context = contexts[node.getAttribute("data-requirecontext")];
            }
        }

        //Always save off evaluating the def call until the script onload handler.
        //This allows multiple modules to be in a file without prematurely
        //tracing dependencies, and allows for anonymous module support,
        //where the module name is not known until the script onload event
        //occurs. If no context, use the global queue, and get it processed
        //in the onscript load callback.
        (context ? context.defQueue : globalDefQueue).push([name, deps, callback]);

        return undefined;
    };

    define.amd = {
        multiversion: true,
        plugins: true,
        jQuery: true
    };


    /**
     * Executes the text. Normally just uses eval, but can be modified
     * to use a better, environment-specific call. Only used for transpiling
     * loader plugins, not for plain JS modules.
     * @param {String} text the text to execute/evaluate.
     */
    req.exec = function (text) {
        /*jslint evil: true */
        return eval(text);
    };

    /**
     * Executes a module callack function. Broken out as a separate function
     * solely to allow the build system to sequence the files in the built
     * layer in the right sequence.
     *
     * @private
     */
    req.execCb = function (name, callback, args, exports) {
        return callback.apply(exports, args);
    };

    //Set up default context. If require was a configuration object, use that as base config.
    req(cfg);

    //If modules are built into require.js, then need to make sure dependencies are
    //traced. Use a setTimeout in the browser world, to allow all the modules to register
    //themselves. In a non-browser env, assume that modules are not built into require.js,
    //which seems odd to do on the server.
    if (typeof setTimeout !== "undefined") {
        setTimeout(function () {
            var ctx = s.contexts[(cfg.context || defContextName)];
            ctx.require([]);
        }, 0);
    }
}());
