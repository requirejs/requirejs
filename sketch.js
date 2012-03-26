/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 1.1.0dev Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint regexp: true, nomen: true */
/*global window, navigator, document, importScripts, jQuery, setTimeout, opera */

var requirejs, require, define;
(function () {
    'use strict';

    //Change this version number for each release.
    var version = "1.1.0dev",
        commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
        cjsRequireRegExp = /require\(\s*["']([^'"\s]+)["']\s*\)/g,
        currDirRegExp = /^\.\//,
        jsSuffixRegExp = /\.js$/,
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
        req;

    function isFunction(it) {
        return ostring.call(it) === "[object Function]";
    }

    function isArray(it) {
        return ostring.call(it) === "[object Array]";
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     * This is not robust in IE for transferring methods that match
     * Object.prototype names, but the uses of mixin here seem unlikely to
     * trigger a problem related to that.
     */
    function mixin(target, source, force) {
        var prop;
        if (source) {
            for (prop in source) {
                if(source.hasOwnProperty(prop) &&
                  (force || !target.hasOwnProperty(prop))) {
                    target[prop] = source[prop];
                }
            }
        }
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
            defined = {},
            paused = [],
            urlMap = {},
            requireCounter = 1,
            Module, context, handlers;

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
         *
         * @returns {Object}
         */
        function makeModuleMap(name, parentModuleMap) {
            //If no name, then it means it is a require call, generate an
            //internal name.
            name = name || '_@r' + (requireCounter += 1);

            var index = name ? name.indexOf("!") : -1,
                prefix = null,
                parentName = parentModuleMap ? parentModuleMap.name : null,
                originalName = name,
                normalizedName, url, pluginModule;

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

            return {
                prefix: prefix,
                name: normalizedName,
                parentMap: parentModuleMap,
                url: url,
                originalName: originalName,
                id: prefix ? prefix + "!" + (normalizedName || '') : normalizedName
            };
        }

        function getModule(depMap) {
            var id = depMap.id,
                mod = registry[id];

            if (defined.hasOwnProperty(id)) {
                throw new Error(id + ' is already defined');
            }

            if (mod) {
                mod = registry[id] = new Module(depMap);
            }

            return mod;
        }

        function enable(depMap) {
            var id = depMap.id,
                mod;

            if (!defined.hasOwnProperty(id)) {
                mod = getModule(depMap);
                mod.enabled = true;
                mod.check();
            }
        }

        function exec(obj, fn, args) {
            return fn.apply(obj, args);
        }

        function on(depMap, name, fn) {
            var id = depMap.id;

            if (defined.hasOwnProperty(id)) {
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
            var relMap = mod.map,
                modRequire = makeContextModuleFunc(altRequire || context.require, relMap, enableBuildCallback);

            mixin(modRequire, {
                toUrl: makeContextModuleFunc(context.toUrl, relMap),
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
                return (mod.exports = {});
            },
            'module': function (mod) {
                return (mod.module = {
                    id: mod.map.id,
                    uri: mod.map.url,
                    exports: undefined
                });
            }
        };

        Module = function (map) {
            this.events = {};
            this.map = map;

            /* this.exports this.factory this.depCount
               this.depMaps = [], this.depExports = []
               this.enabled
            */

            paused.push(map);
        };

        Module.prototype = {
            init: function(depMaps, factory, errback, options) {
                options = options || {};

                if (options.enabled) {
                    this.enabled = true;
                }

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
                        depMap = makeModuleMap(depMap, this.map);
                    }

                    var depExports = this.depExports,
                        handler = handlers[depMap.id];

                    if (handler) {
                        this.depExports[i] = handler(this);
                        return;
                    }

                    this.depCount += 1;

                    if (this.enabled) {
                        enable(depMap);
                    }

                    on(depMap, 'define', bind(this, function (depExports) {
                        this.depExports[i] = depExports;
                        this.depCount -= 1;
                        this.check();
                    }));

                    if (errback) {
                        on(depMap, 'error', function (err) {
                            errback(err);
                        });
                    }
                }));

                this.check();

    //.inited check in paused dont do if inited
            },

            check: function () {
                if (this.depCount === 0) {
                    if (this.enabled) {
                        var exports = exec(this.exports, this.factory, this.depExports);
                        //TODO do module.exports vs return value stuff
                        // here

                        this.emit('defined', this.exports);
                    }
                }
            },

            require: function () {

            },

            on: function(name, fn) {
                var cbs = this.events[name];
                if (!cbs) {
                    cbs = this.events[name] = [];
                }
                cbs.push(cbs);
            },

            emit: function (name, evt) {
                each(this.events[name], function (cb) {
                    cb(evt);
                });
            }
        };

        return (context = {
            require: function (deps, callback, errback, relMap) {
                var moduleName, id, map, depMaps, requireMod;
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

                //Mark all the dependencies as needing to be loaded.
                map = makeModuleMap(null, relMap);
                requireMod = getModule(map);
                requireMod.init(depMaps, callback, errback, {
                    enabled: true
                });

                return context.require;
            }
        });
    }
}());
