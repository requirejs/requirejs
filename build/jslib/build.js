/**
 * @license Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint regexp: false, plusplus: false, nomen: false */
/*global java: false, lang: false, fileUtil: false, optimize: false,
  load: false, quit: false, print: false, logger: false, require: false,
  pragma: false */

"use strict";

var build, buildBaseConfig;
(function () {
    buildBaseConfig = {
            requireBuildPath: "../",
            appDir: "",
            pragmas: {},
            paths: {},
            optimize: "closure",
            optimizeCss: "standard.keepLines",
            inlineText: true,
            execModules: false
        };

    build = function (args) {
        var requireBuildPath, buildFile, baseUrlFile, buildPaths, deps, fileName, fileNames,
            prop, props, paths, path, i, fileContents, buildFileContents = "",
            doClosure, requireContents, pluginContents, pluginBuildFileContents,
            baseConfig, override, builtRequirePath, cmdConfig, config,
            modules, module, moduleName, builtModule;
    
        if (!args || args.length < 2) {
            print("java -jar path/to/js.jar build.js directory/containing/build.js/ build.js\n" +
                  "where build.js is the name of the build file (see example.build.js for hints on how to make a build file.");
            quit();
        }

        //First argument to this script should be the directory on where to find this script.
        //This path should end in a slash.
        requireBuildPath = args[0];
        if (requireBuildPath.charAt(requireBuildPath.length - 1) !== "/") {
            requireBuildPath += "/";
        }
    
        ["lang", "logger", "fileUtil", "parse", "optimize", "pragma", "build"].forEach(function (path) {
            load(requireBuildPath + "jslib/" + path + ".js");
        });
    
        //Next args can include a build file path as well as other build args.
        //build file path comes first. If it does not contain an = then it is
        //a build file path. Otherwise, just all build args.
        if (args[1].indexOf("=") === -1) {
            buildFile = args[1];
            args.splice(0, 2);
        } else {
            args.splice(0, 1);
        }
    
        //Remaining args are options to the build
        cmdConfig = build.convertArrayToObject(args);
        cmdConfig.buildFile = buildFile;
        cmdConfig.requireBuildPath = requireBuildPath;
    
        config = build.createConfig(cmdConfig);
        paths = config.paths;
    
        //Load require.js with the build patches.
        load(config.requireUrl);
        load(requireBuildPath + "jslib/requirePatch.js");
    
        if (!config.out && !config.cssIn) {
            //This is not just a one-off file build but a full build profile, with
            //lots of files to process.
    
            //First copy all the baseUrl content
            fileUtil.copyDir((config.appDir || config.baseUrl), config.dir, /\w/, true);
        
            //Adjust baseUrl if config.appDir is in play, and set up build output paths.
            buildPaths = {};
            if (config.appDir) {
                config.dirBaseUrl = config.dir + config.baseUrl;
                config.baseUrl = config.appDir + config.baseUrl;
                //All the paths should be inside the appDir
                buildPaths = paths;
            } else {
                config.dirBaseUrl = config.dir;
                //If no appDir, then make sure to copy the other paths to this directory.
                for (prop in paths) {
                    if (paths.hasOwnProperty(prop)) {
                        //Set up build path for each path prefix.
                        buildPaths[prop] = prop.replace(/\./g, "/");
                        //Copy files to build area. Copy all files (the /\w/ regexp)
                        fileUtil.copyDir(paths[prop], config.dirBaseUrl + buildPaths[prop], /\w/, true);
                    }
                }
            }
        }

        //Figure out source file location for each module layer. Do this by seeding require
        //with source area configuration. This is needed so that later the module layers
        //can be manually copied over to the source area, since the build may be
        //require multiple times and the above copyDir call only copies newer files.
        require({
            baseUrl: config.baseUrl,
            paths: paths
        });
        modules = config.modules;

        if (modules) {
            modules.forEach(function (module) {
                if (module.name) {
                    module._sourcePath = require.nameToUrl(module.name, null, require.s.ctxName);
                    //If the module does not exist, and this is not a "new" module layer,
                    //as indicated by a true "create" property on the module, then throw an error.
                    if (!(new java.io.File(module._sourcePath)).exists() && !module.create) {
                        throw new Error("ERROR: module path does not exist: " +
                                        module._sourcePath + " for module named: " + module.name +
                                        ". Path is relative to: " + (new java.io.File('.')).getAbsolutePath());
                    }
                }
            });
        }

        if (config.out) {
            //Just set up the _buildPath for the module layer.
            require(config);
            if (!config.cssIn) {
                config.modules[0]._buildPath = config.out;
            }
        } else if (!config.cssIn) {
            //Now set up the config for require to use the build area, and calculate the
            //build file locations. Pass along any config info too.
            baseConfig = {
                baseUrl: config.dirBaseUrl,
                paths: buildPaths
            };
            lang.mixin(baseConfig, config);
            require(baseConfig);
    
            if (modules) {
                modules.forEach(function (module) {
                    if (module.name) {
                        module._buildPath = require.nameToUrl(module.name, null, require.s.ctxName);
                        if (!module.create) {
                            fileUtil.copyFile(module._sourcePath, module._buildPath);
                        }
                    }
                });
            }
        }

        if (modules) {
            //For each module layer, call require to calculate dependencies.
            modules.forEach(function (module) {
                module.layer = build.traceDependencies(module, config);
            });

            //Now build up shadow layers for anything that should be excluded.
            //Do this after tracing dependencies for each module, in case one
            //of those modules end up being one of the excluded values.
            modules.forEach(function (module) {
                if (module.exclude) {
                    module.excludeLayers = [];
                    module.exclude.forEach(function (exclude, i) {
                        //See if it is already in the list of modules.
                        //If not trace dependencies for it.
                        module.excludeLayers[i] = build.findBuildModule(exclude, modules) ||
                                                 {layer: build.traceDependencies({name: exclude}, config)};
                    });
                }
            });

            modules.forEach(function (module) {
                if (module.exclude) {
                    //module.exclude is an array of module names. For each one,
                    //get the nested dependencies for it via a matching entry
                    //in the module.excludeLayers array.
                    module.exclude.forEach(function (excludeModule, i) {
                        var excludeLayer = module.excludeLayers[i].layer, map = excludeLayer.buildPathMap, prop;
                        for (prop in map) {
                            if (map.hasOwnProperty(prop)) {
                                build.removeModulePath(prop, map[prop], module.layer);
                            }
                        }
                    });
                }
                if (module.excludeShallow) {
                    //module.excludeShallow is an array of module names.
                    //shallow exclusions are just that module itself, and not
                    //its nested dependencies.
                    module.excludeShallow.forEach(function (excludeShallowModule) {
                        var path = module.layer.buildPathMap[excludeShallowModule];
                        if (path) {
                            build.removeModulePath(excludeShallowModule, path, module.layer);
                        }
                    });
                }

                //Flatten them and collect the build output for each module.
                builtModule = build.flattenModule(module, module.layer, config);
                fileUtil.saveUtf8File(module._buildPath, builtModule.text);
                buildFileContents += builtModule.buildText;
            });
        }

        //Do other optimizations.
        if (config.out && !config.cssIn) {
            //Just need to worry about one JS file.
            fileName = config.modules[0]._buildPath;
            optimize.jsFile(fileName, fileName, config);
        } else if (!config.cssIn) {
            //Normal optimizations across modules.

            //JS optimizations.
            fileNames = fileUtil.getFilteredFileList(config.dir, /\.js$/, true);    
            for (i = 0; (fileName = fileNames[i]); i++) {
                optimize.jsFile(fileName, fileName, config);
            }
    
            //CSS optimizations
            if (config.optimizeCss && config.optimizeCss !== "none") {
                optimize.css(config.dir, config);
            }
    
            //All module layers are done, write out the build.txt file.
            fileUtil.saveUtf8File(config.dir + "build.txt", buildFileContents);
        }

        //If just have one CSS file to optimize, do that here.
        if (config.cssIn) {
            optimize.cssFile(config.cssIn, config.out, config);
        }

        //Print out what was built into which layers.
        if (buildFileContents) {
            print(buildFileContents);
        }
        
    };

    /**
     * Converts an array that has String members of "name=value"
     * into an object, where the properties on the object are the names in the array.
     * Also converts the strings "true" and "false" to booleans for the values.
     * member name/value pairs, and converts some comma-separated lists into
     * arrays.
     * @param {Array} ary
     */
    build.convertArrayToObject = function (ary) {
        var result = {}, i, separatorIndex, prop, value,
            needArray = {
                "include": true,
                "exclude": true,
                "excludeShallow": true
            };

        for (i = 0; i < ary.length; i++) {
            separatorIndex = ary[i].indexOf("=");
            if (separatorIndex === -1) {
                throw "Malformed name/value pair: [" + ary[i] + "]. Format should be name=value";
            }

            value = ary[i].substring(separatorIndex + 1, ary[i].length);
            if (value === "true") {
                value = true;
            } else if (value === "false") {
                value = false;
            }

            prop = ary[i].substring(0, separatorIndex);

            //Convert to array if necessary
            if (needArray[prop]) {
                value = value.split(",");
            }

            result[prop] = value;
        }
        return result; //Object
    };

    /**
     * Creates a config object for an optimization build.
     * It will also read the build profile if it is available, to create
     * the configuration.
     *
     * @param {Object} cfg config options that take priority
     * over defaults and ones in the build file. These options could
     * be from a command line, for instance.
     *
     * @param {Object} the created config object.
     */
    build.createConfig = function (cfg) {
        /*jslint evil: true */
        var config = {}, baseUrl, buildFileContents, buildFileConfig,
            paths, props, i, prop;

        lang.mixin(config, buildBaseConfig);
        lang.mixin(config, cfg, true);

        //Normalize build directory location, and set up path to require.js
        if (config.requireBuildPath.charAt(config.requireBuildPath.length - 1) !== "/") {
            config.requireBuildPath += "/";
            //Also adjust the override config params, since it
            //may be re-applied later after reading the build file.
            if (cfg.requireBuildPath) {
                cfg.requireBuildPath = config.requireBuildPath;
            }
        }
        config.requireUrl = fileUtil.absPath(java.io.File(cfg.requireBuildPath + "../require.js"));

        if (config.buildFile) {
            //A build file exists, load it to get more config.
            config.buildFile = new java.io.File(config.buildFile).getAbsoluteFile();

            //Find the build file, and make sure it exists, if this is a build
            //that has a build profile, and not just command line args with an in=path
            if (!config.buildFile.exists()) {
                throw new Error("ERROR: build file does not exist: " + config.buildFile.getAbsolutePath());
            }

            config.baseUrl = fileUtil.absPath(config.buildFile.getParentFile());
            config.buildFile = fileUtil.absPath(config.buildFile);
            config.dir = config.baseUrl + "/build/";

            //Load build file options.
            buildFileContents = fileUtil.readFile(config.buildFile);
            buildFileConfig = eval("(" + buildFileContents + ")");
            lang.mixin(config, buildFileConfig, true);

            //Re-apply the override config values, things like command line
            //args should take precedence over build file values.
            lang.mixin(config, cfg, true);
        } else {
            //Base URL is relative to the in file.
            if (!config.out && !config.cssIn) {
                throw new Error("ERROR: 'out' or 'cssIn' option missing.");
            }
            if (!config.out) {
                throw new Error("ERROR: 'out' option missing.");
            } else {
                config.out = config.out.replace(lang.backSlashRegExp, "/");
            }

            if (!config.cssIn && !cfg.baseUrl) {
                throw new Error("ERROR: 'baseUrl' option missing.");
            }
        }

        if (config.out && !config.cssIn) {
            //Just one file to optimize.

            //Set up dummy module layer to build.
            config.modules = [
                {
                    name: config.name,
                    out: config.out,
                    include: config.include,
                    exclude: config.exclude,
                    excludeShallow: config.excludeShallow
                }
            ];

            if (config.includeRequire) {
                config.modules[0].includeRequire = true;
            }

            //Does not have a build file, so set up some defaults.
            //Optimizing CSS should not be allowed, unless explicitly
            //asked for on command line. In that case the only task is
            //to optimize a CSS file.
            if (!cfg.optimizeCss) {
                config.optimizeCss = "none";
            }
        }

        //Adjust the path properties as appropriate.
        //First make sure build paths use front slashes and end in a slash
        props = ["appDir", "dir", "baseUrl"];
        for (i = 0; (prop = props[i]); i++) {
            if (config[prop]) {
                config[prop] = config[prop].replace(lang.backSlashRegExp, "/");
                if (config[prop].charAt(config[prop].length - 1) !== "/") {
                    config[prop] += "/";
                }
            }
        }

        //Make sure paths has a setting for require, so support plugins
        //can be loaded for the build.
        paths = config.paths;
        if (!paths.require) {
            paths.require = config.requireUrl.substring(0, config.requireUrl.lastIndexOf("/")) + "/require";
        }

        return config;
    };

    /**
     * finds the module being built/optimized with the given moduleName,
     * or returns null.
     * @param {String} moduleName
     * @param {Array} modules
     * @returns {Object} the module object from the build profile, or null.
     */
    build.findBuildModule = function (moduleName, modules) {
        var i, module;
        for (i = 0; (module = modules[i]); i++) {
            if (module.name === moduleName) {
                return module;
            }
        }
        return null;
    };

    /**
     * Removes a module name and path from a layer, if it is supposed to be
     * excluded from the layer.
     * @param {String} moduleName the name of the module
     * @param {String} path the file path for the module
     * @param {Object} layer the layer to remove the module/path from
     */
    build.removeModulePath = function (module, path, layer) {
        var index = layer.buildFilePaths.indexOf(path);
        if (index !== -1) {
            layer.buildFilePaths.splice(index, 1);
        }

        //Take it out of the specified modules. Specified modules are mostly
        //used to find require modifiers.
        delete layer.specified[module];
    };

    /**
     * Uses the module build config object to trace the dependencies for the
     * given module.
     * 
     * @param {Object} module the module object from the build config info.
     * @param {Object} the build config object.
     *
     * @returns {Object} layer information about what paths and modules should
     * be in the flattened module.
     */
    build.traceDependencies = function (module, config) {
        var include, override, url, layer, prop,
            context = require.s.contexts[require.s.ctxName],
            baseConfig = context.config;

        //Reset some state set up in requirePatch.js, and clean up require's
        //current context.
        require._buildReset();

        //Put back basic config
        require(baseConfig);

        logger.trace("\nTracing dependencies for: " + (module.name || module.out));
        include = module.name && !module.create ? [module.name] : [];
        if (module.include) {
            include = include.concat(module.include);
        }

        //If there are overrides to basic config, set that up now.;
        if (module.override) {
            override = lang.delegate(baseConfig);
            lang.mixin(override, module.override, true);
            require(override);
        }

        //Figure out module layer dependencies by calling require to do the work.
        require(include);

        //Pull out the layer dependencies. Do not use the old context
        //but grab the latest value from inside require() since it was reset
        //since our last context reference.
        layer = require._layer;
        layer.specified = require.s.contexts[require.s.ctxName].specified;

        //Add any other files that did not have an explicit name on them.
        //These are files that do not call back into require when loaded.
        for (prop in layer.buildPathMap) {
            if (layer.buildPathMap.hasOwnProperty(prop)) {
                url = layer.buildPathMap[prop];
                //Always store the url to module name mapping for use later,
                //particularly for anonymous modules and tracking down files that
                //did not call require.def to define a module
                layer.buildFileToModule[url] = prop;

                if (!layer.loadedFiles[url]) {
                    //Do not add plugins to build file paths since they will
                    //be added later, near the top of the module layer.
                    if (prop.indexOf("require/") !== 0) {
                        layer.buildFilePaths.push(url);
                    }
                    layer.loadedFiles[url] = true;
                }
            }
        }

        //Reset config
        if (module.override) {
            require(baseConfig);
        }
        
        return layer;
    };

    /**
     * Uses the module build config object to create an flattened version
     * of the module, with deep dependencies included.
     * 
     * @param {Object} module the module object from the build config info.
     *
     * @param {Object} layer the layer object returned from build.traceDependencies.
     * 
     * @param {Object} the build config object.
     *
     * @returns {Object} with two properties: "text", the text of the flattened
     * module, and "buildText", a string of text representing which files were
     * included in the flattened module text.
     */
    build.flattenModule = function (module, layer, config) {
        var buildFileContents = "", requireContents = "",
            pluginContents = "", pluginBuildFileContents = "", includeRequire,
            anonDefRegExp = /(require\s*\.\s*def|define)\s*\(\s*(\[|f|\{)/,
            prop, path, reqIndex, fileContents, currContents,
            i, moduleName, specified, deps;

        //Use override settings, particularly for pragmas
        if (module.override) {
            config = lang.delegate(config);
            lang.mixin(config, module.override, true);
        }

        //Start build output for the module.
        buildFileContents += "\n" +
                             (config.dir ? module._buildPath.replace(config.dir, "") : module._buildPath) +
                             "\n----------------\n";

        //If the file wants require.js added to the module, add it now
        requireContents = "";
        pluginContents = "";
        pluginBuildFileContents = "";
        includeRequire = false;
        if ("includeRequire" in module) {
            includeRequire = module.includeRequire;
        }
        if (includeRequire) {
            requireContents = pragma.process(config.requireUrl, fileUtil.readFile(config.requireUrl), config);
            buildFileContents += "require.js\n";
        }

        //Check for any plugins loaded, and hoist to the top, but below
        //the require() definition.
        specified = layer.specified;
        for (prop in specified) {
            if (specified.hasOwnProperty(prop)) {
                if (prop.indexOf("require/") === 0) {
                    path = layer.buildPathMap[prop];
                    if (path) {
                        pluginBuildFileContents += path.replace(config.dir, "") + "\n";
                        pluginContents += pragma.process(path, fileUtil.readFile(path), config);
                    }
                }
            }
        }
        if (includeRequire) {
            //require.js will be included so the plugins will appear right after it.
            buildFileContents += pluginBuildFileContents;
        }

        //If there was an existing file with require in it, hoist to the top.
        if (!includeRequire && layer.existingRequireUrl) {
            reqIndex = layer.buildFilePaths.indexOf(layer.existingRequireUrl);
            if (reqIndex !== -1) {
                layer.buildFilePaths.splice(reqIndex, 1);
                layer.buildFilePaths.unshift(layer.existingRequireUrl);
            }
        }

        //Write the built module to disk, and build up the build output.
        fileContents = "";
        for (i = 0; (path = layer.buildFilePaths[i]); i++) {
            moduleName = layer.buildFileToModule[path];

            //Add the contents but remove any pragmas.
            currContents = pragma.process(path, fileUtil.readFile(path), config);

            //If anonymous module, insert the module name.
            currContents = currContents.replace(anonDefRegExp, function (match, callName, suffix) {
                layer.modulesWithNames[moduleName] = true;

                //Look for CommonJS require calls inside the function if this is
                //an anonymous define/require.def call that just has a function registered.
                deps = null;
                if (suffix.indexOf('f') !== -1) {
                    deps = parse.getAnonDeps(path, currContents);
                    if (deps.length) {
                        deps = deps.map(function (dep) {
                            return "'" + dep + "'";
                        });
                    } else {
                        deps = null;
                    }
                }

                //Adust module name if it is for a plugin
                if (require.s.contexts._.defPlugin[moduleName]) {
                    moduleName = require.s.contexts._.defPlugin[moduleName] + '!' + moduleName;
                    //Mark that it is a module with a name so do not need
                    //a stub name insertion for it later.
                    layer.modulesWithNames[moduleName] = true;
                }

                return "define('" + moduleName + "'," +
                       (deps ? ('[' + deps.toString() + '],') : '') +
                       suffix;
            });

            fileContents += currContents;

            buildFileContents += path.replace(config.dir, "") + "\n";
            //Some files may not have declared a require module, and if so,
            //put in a placeholder call so the require does not try to load them
            //after the module is processed.
            //If we have a name, but no defined module, then add in the placeholder.
            if (moduleName && !layer.modulesWithNames[moduleName] && !config.skipModuleInsertion) {
                fileContents += 'define("' + moduleName + '", function(){});\n';
            }

            //If we have plugins but are not injecting require.js,
            //then need to place the plugins after the require definition,
            //if it was found.
            if (layer.existingRequireUrl === path && !includeRequire) {
                fileContents += pluginContents;
                buildFileContents += pluginBuildFileContents;
                pluginContents = "";
            }
        }

        //Add the require file contents to the head of the file.
        fileContents = (requireContents ? requireContents + "\n" : "") +
                       (pluginContents ? pluginContents + "\n" : "") +
                       fileContents;

        return {
            text: fileContents,
            buildText: buildFileContents
        };
    };
}());