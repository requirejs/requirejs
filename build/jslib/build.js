/**
 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint regexp: false, plusplus: false, nomen: false, strict: false  */
/*global define: false, require: false */


define([ 'lang', 'logger', 'env!env/file', 'parse', 'optimize', 'pragma',
         'env!env/load', 'requirePatch'],
function (lang,   logger,   file,          parse,    optimize,   pragma,
          load,           requirePatch) {
    var build, buildBaseConfig;

    buildBaseConfig = {
            requireBuildPath: "../",
            appDir: "",
            pragmas: {},
            paths: {},
            optimize: "uglify",
            optimizeCss: "standard.keepLines",
            inlineText: true,
            isBuild: true
        };

    function endsWithSlash(dirName) {
        if (dirName.charAt(dirName.length - 1) !== "/") {
            dirName += "/";
        }
        return dirName;
    }


    /**
     * Main API entry point into the build. The args argument can either be
     * an array of arguments (like the onese passed on a command-line),
     * or it can be a JavaScript object that has the format of a build profile
     * file.
     *
     * If it is an object, then in addition to the normal properties allowed in
     * a build profile file, the object should contain one other property:
     *
     * requireBuildPath: a string that is the path to find require.js and the
     * require/ directory. This should be a pristine require.js with only
     * require.js contents (no plugins or jQuery).
     *
     * The object could also contain a "buildFile" property, which is a string
     * that is the file path to a build profile that contains the rest
     * of the build profile directives.
     *
     * This function does not return a status, it should throw an error if
     * there is a problem completing the build.
     */
    build = function (args) {
        var requireBuildPath, buildFile, cmdConfig;

        if (!args || lang.isArray(args)) {
            if (!args || args.length < 2) {
                logger.error("build.js directory/containing/build.js/ buildProfile.js\n" +
                      "where buildProfile.js is the name of the build file (see example.build.js for hints on how to make a build file).");
                return;
            }

            //Second argument should be the directory on where to find this script.
            //This path should end in a slash.
            requireBuildPath = args[0];
            requireBuildPath = endsWithSlash(requireBuildPath);

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
        } else {
            cmdConfig = args;
        }

        build._run(cmdConfig);
    };

    build._run = function (cmdConfig) {
        var buildFileContents = "",
            buildPaths, fileName, fileNames,
            prop, paths, i,
            baseConfig, config,
            modules, builtModule, srcPath, buildContext,
            destPath;

        //Can now run the patches to require.js to allow it to be used for
        //build generation. Do it here instead of at the top of the module
        //because we want normal require behavior to load the build tool
        //then want to switch to build mode.
        requirePatch();

        config = build.createConfig(cmdConfig);
        paths = config.paths;

        if (!config.out && !config.cssIn) {
            //This is not just a one-off file build but a full build profile, with
            //lots of files to process.

            //First copy all the baseUrl content
            file.copyDir((config.appDir || config.baseUrl), config.dir, /\w/, true);

            //Adjust baseUrl if config.appDir is in play, and set up build output paths.
            buildPaths = {};
            if (config.appDir) {
                //All the paths should be inside the appDir
                buildPaths = paths;
            } else {
                //If no appDir, then make sure to copy the other paths to this directory.
                for (prop in paths) {
                    if (paths.hasOwnProperty(prop)) {
                        //Set up build path for each path prefix.
                        buildPaths[prop] = prop.replace(/\./g, "/");

                        //Make sure source path is fully formed with baseUrl,
                        //if it is a relative URL.
                        srcPath = paths[prop];
                        if (srcPath.indexOf('/') !== 0 && srcPath.indexOf(':') === -1) {
                            srcPath = config.baseUrl + srcPath;
                        }

                        destPath = config.dirBaseUrl + buildPaths[prop];

                        //If the srcPath is a directory, copy the whole directory.
                        if (file.exists(srcPath) && file.isDirectory(srcPath)) {
                            //Copy files to build area. Copy all files (the /\w/ regexp)
                            file.copyDir(srcPath, destPath, /\w/, true);
                        } else {
                            //Try a .js extension
                            srcPath += '.js';
                            destPath += '.js';
                            file.copyFile(srcPath, destPath);
                        }
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
            paths: paths,
            packagePaths: config.packagePaths,
            packages: config.packages
        });
        buildContext = require.s.contexts._;
        modules = config.modules;

        if (modules) {
            modules.forEach(function (module) {
                if (module.name) {
                    module._sourcePath = buildContext.nameToUrl(module.name);
                    //If the module does not exist, and this is not a "new" module layer,
                    //as indicated by a true "create" property on the module, and
                    //it is not a plugin-loaded resource, then throw an error.
                    if (!file.exists(module._sourcePath) && !module.create &&
                        module.name.indexOf('!') === -1) {
                        throw new Error("ERROR: module path does not exist: " +
                                        module._sourcePath + " for module named: " + module.name +
                                        ". Path is relative to: " + file.absPath('.'));
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
                        module._buildPath = buildContext.nameToUrl(module.name, null);
                        if (!module.create) {
                            file.copyFile(module._sourcePath, module._buildPath);
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
                file.saveUtf8File(module._buildPath, builtModule.text);
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
            fileNames = file.getFilteredFileList(config.dir, /\.js$/, true);
            for (i = 0; (fileName = fileNames[i]); i++) {
                optimize.jsFile(fileName, fileName, config);
            }

            //CSS optimizations
            if (config.optimizeCss && config.optimizeCss !== "none") {
                optimize.css(config.dir, config);
            }

            //All module layers are done, write out the build.txt file.
            file.saveUtf8File(config.dir + "build.txt", buildFileContents);
        }

        //If just have one CSS file to optimize, do that here.
        if (config.cssIn) {
            optimize.cssFile(config.cssIn, config.out, config);
        }

        //Print out what was built into which layers.
        if (buildFileContents) {
            logger.info(buildFileContents);
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

            if (prop.indexOf("paths.") === 0) {
                //Special handling of paths properties. paths.foo=bar is transformed
                //to data.paths = {foo: 'bar'}
                if (!result.paths) {
                    result.paths = {};
                }
                prop = prop.substring("paths.".length, prop.length);
                result.paths[prop] = value;
            } else {
                result[prop] = value;
            }
        }
        return result; //Object
    };

    build.makeAbsPath = function (path, absFilePath) {
        //Add abspath if necessary. If path starts with a slash or has a colon,
        //then already is an abolute path.
        if (path.indexOf('/') !== 0 && path.indexOf(':') === -1) {
            path = absFilePath +
                   (absFilePath.charAt(absFilePath.length - 1) === '/' ? '' : '/') +
                   path;
            path = file.normalize(path);
        }
        return path;
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
        var config = {}, buildFileContents, buildFileConfig,
            paths, props, i, prop, buildFile, absFilePath, originalBaseUrl;

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
        config.requireUrl = file.absPath(cfg.requireBuildPath + "../require.js");

        if (config.buildFile) {
            //A build file exists, load it to get more config.
            buildFile = file.absPath(config.buildFile);

            //Find the build file, and make sure it exists, if this is a build
            //that has a build profile, and not just command line args with an in=path
            if (!file.exists(buildFile)) {
                throw new Error("ERROR: build file does not exist: " + buildFile);
            }

            absFilePath = config.baseUrl = file.absPath(file.parent(buildFile));
            config.dir = config.baseUrl + "/build/";

            //Load build file options.
            buildFileContents = file.readFile(buildFile);
            try {
                buildFileConfig = eval("(" + buildFileContents + ")");
            } catch(e) {
                throw new Error("Build file " + buildFile + " is malformed: " + e);
            }
            lang.mixin(config, buildFileConfig, true);

            //Re-apply the override config values, things like command line
            //args should take precedence over build file values.
            lang.mixin(config, cfg, true);
        } else {
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

            //In this scenario, the absFile path is current directory
            absFilePath = file.absPath('.');
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
        //First make sure build paths use front slashes and end in a slash,
        //and make sure they are aboslute paths.
        props = ["appDir", "dir", "baseUrl"];
        for (i = 0; (prop = props[i]); i++) {
            if (config[prop]) {
                config[prop] = config[prop].replace(lang.backSlashRegExp, "/");

                //Add abspath if necessary.
                if (prop === "baseUrl") {
                    originalBaseUrl = config.baseUrl;
                    if (config.appDir) {
                        //If baseUrl with an appDir, the baseUrl is relative to
                        //the appDir, *not* the absFilePath. appDir and dir are
                        //made absolute before baseUrl, so this will work.
                        config.baseUrl = build.makeAbsPath(originalBaseUrl, config.appDir);
                        //Set up dir output baseUrl.
                        config.dirBaseUrl = build.makeAbsPath(originalBaseUrl, config.dir);
                    } else {
                        //The dir output baseUrl is same as regular baseUrl, both
                        //relative to the absFilePath.
                        config.baseUrl = build.makeAbsPath(config[prop], absFilePath);
                        config.dirBaseUrl = config.dir || config.baseUrl;
                    }

                    //Make sure dirBaseUrl ends in a slash, since it is
                    //concatenated with other strings.
                    config.dirBaseUrl = endsWithSlash(config.dirBaseUrl);
                } else {
                    config[prop] = build.makeAbsPath(config[prop], absFilePath);
                }

                config[prop] = endsWithSlash(config[prop]);
            }
        }

        //Make sure some other paths are absolute.
        props = ["out", "cssIn"];
        for (i = 0; (prop = props[i]); i++) {
            if (config[prop]) {
                config[prop] = build.makeAbsPath(config[prop], absFilePath);
            }
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
        var include, override, layer, context, baseConfig, oldContext;

        //Reset some state set up in requirePatch.js, and clean up require's
        //current context.
        oldContext = require._buildReset();

        //Grab the reset layer and context after the reset, but keep the
        //old config to reuse in the new context.
        baseConfig = oldContext.config;
        layer = require._layer;
        context = layer.context;

        //Put back basic config, use a fresh object for it.
        //WARNING: probably not robust for paths and packages/packagePaths,
        //since those property's objects can be modified. But for basic
        //config clone it works out.
        require(lang.delegate(baseConfig));

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

        //Pull out the layer dependencies.
        layer.specified = context.specified;

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
            context = layer.context,
            path, reqIndex, fileContents, currContents,
            i, moduleName, includeRequire,
            parts, builder, writeApi;

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
        includeRequire = false;
        if ("includeRequire" in module) {
            includeRequire = module.includeRequire;
        }
        if (includeRequire) {
            requireContents = pragma.process(config.requireUrl, file.readFile(config.requireUrl), config);
            buildFileContents += "require.js\n";
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

            //Figure out if the module is a result of a build plugin, and if so,
            //then delegate to that plugin.
            parts = context.makeModuleMap(moduleName);
            builder = parts.prefix && context.pluginBuilders[parts.prefix];
            if (builder) {
                if (builder.write) {
                    writeApi = function (input) {
                        fileContents += input;
                    };
                    writeApi.asModule = function (moduleName, input) {
                        fileContents += build.toTransport(moduleName, path, input, layer);
                    };
                    builder.write(parts.prefix, parts.name, writeApi);
                }
            } else {
                //Add the contents but remove any pragmas.
                currContents = pragma.process(path, file.readFile(path), config);

                currContents = build.toTransport(moduleName, path, currContents, layer);

                fileContents += currContents;
            }

            buildFileContents += path.replace(config.dir, "") + "\n";
            //Some files may not have declared a require module, and if so,
            //put in a placeholder call so the require does not try to load them
            //after the module is processed.
            //If we have a name, but no defined module, then add in the placeholder.
            if (moduleName && !layer.modulesWithNames[moduleName] && !config.skipModuleInsertion) {
                //If including jquery, register the module correctly, otherwise
                //register an empty function. For jquery, make sure jQuery is
                //a real object, and perhaps not some other file mapping, like
                //to zepto.
                if (moduleName === 'jquery') {
                    fileContents += '\n(function () {\n' +
                                   'var jq = typeof jQuery !== "undefined" && jQuery;\n' +
                                   'define("jquery", [], function () { return jq; });\n' +
                                   '}());\n';
                } else {
                    fileContents += 'define("' + moduleName + '", function(){});\n';
                }
            }
        }

        //Add the require file contents to the head of the file.
        fileContents = (requireContents ? requireContents + "\n" : "") +
                       fileContents;

        return {
            text: fileContents,
            buildText: buildFileContents
        };
    };

    //This regexp is not bullet-proof, and it has one optional part to
    //avoid issues with some Dojo transition modules that use a
    //define(\n//begin v1.x content
    //for a comment.
    build.anonDefRegExp = /(require\s*\.\s*def|define)\s*\(\s*(\/\/[^\n\r]*[\r\n])?(\[|f|\{)/;

    build.toTransport = function (moduleName, path, contents, layer) {
        //If anonymous module, insert the module name.
        return contents.replace(build.anonDefRegExp, function (match, callName, possibleComment, suffix) {
            layer.modulesWithNames[moduleName] = true;

            //Look for CommonJS require calls inside the function if this is
            //an anonymous define/require.def call that just has a function registered.
            var deps = null;
            if (suffix.indexOf('f') !== -1) {
                deps = parse.getAnonDeps(path, contents);

                if (deps.length) {
                    deps = deps.map(function (dep) {
                        return "'" + dep + "'";
                    });
                } else {
                    deps = null;
                }
            }

            return "define('" + moduleName + "'," +
                   (deps ? ('[' + deps.toString() + '],') : '') +
                   suffix;
        });

    };

    return build;
});
