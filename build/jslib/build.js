/**
 * @license Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint regexp: false, plusplus: false, nomen: false */
/*global java: false, lang: false, fileUtil: false, optimize: false,
  load: false, quit: false, print: false, logger: false, require: false,
  pragma: false */

"use strict";

var build;
(function () {
    var baseConfig = {
            requireBuildPath: "../",
            appDir: "",
            pragmas: {
                useStrict: true
            },
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
        cmdConfig = lang.convertArrayToObject(args);
        cmdConfig.buildFile = buildFile;
        cmdConfig.requireBuildPath = requireBuildPath;
    
        config = build.createConfig(cmdConfig);
        paths = config.paths;
    
        //Load require.js with the build patches.
        load(config.requireUrl);
        load(requireBuildPath + "jslib/requirePatch.js");
    
        if (!config.name && !config.cssIn) {
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
                module._sourcePath = require.nameToUrl(module.name, null, require.s.ctxName);
                if (!(new java.io.File(module._sourcePath)).exists()) {
                    throw new Error("ERROR: module path does not exist: " +
                                    module._searchPath + " for module named: " + module.name);
                }
            });
        }
    
        if (config.name) {
            //Just set up the _buildPath for the module layer.
            require(config);
            config.modules[0]._buildPath = config.out;
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
                    module._buildPath = require.nameToUrl(module.name, null, require.s.ctxName);
                    fileUtil.copyFile(module._sourcePath, module._buildPath);
                });
            }
        }
    
        //For each module layer, call require to calculate dependencies, and then save
        //the calculated module layer to disk in the build area.
        if (modules) {
            modules.forEach(function (module) {
                builtModule = build.flattenModule(module, config);
                fileUtil.saveUtf8File(module._buildPath, builtModule.text);
                buildFileContents += builtModule.buildText;
            });
        }
    
        //Do other optimizations.
        if (config.name) {
            //Just need to worry about one file.
            fileName = config.modules[0]._buildPath;
            optimize.jsFile(fileName, fileName, config);
        } else if (!config.cssIn) {   
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

        lang.mixin(config, baseConfig);
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
            if (!config.name && !config.cssIn) {
                throw new Error("ERROR: 'name' or 'cssIn' option missing.");
            }
            if (!config.out) {
                throw new Error("ERROR: 'out' option missing.");
            } else {
                config.out = config.out.replace(lang.backSlashRegExp, "/");
            }

            if (config.name && !cfg.baseUrl) {
                throw new Error("ERROR: 'baseUrl' option missing.");
            }
        }

        if (config.name) {
            //Just one file to optimize.

            //Make sure include is an array, and not a string from command line.
            //Assume if it is a string then it is a comma-separated list of values.
            if (typeof config.include === "string") {
                config.include = config.include.split(",");
            }

            //Set up dummy module layer to build.
            config.modules = [
                {
                    name: config.name,
                    include: config.include
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

    build.resumeRegExp = /require\s*\.\s*resume\s*\(\s*\)(;)?/g;

    /**
     * Uses the module build config object to create an flattened version
     * of the module, with deep dependencies included.
     * 
     * @param {Object} module the module object from the build config info.
     * @param {Object} the build config object.
     *
     * @returns {Object} with two properties: "text", the text of the flattened
     * module, and "buildText", a string of text representing which files were
     * included in the flattened module text.
     */
    build.flattenModule = function (module, config) {
        var include, override, prop, url, buildFileContents = "", requireContents = "",
            pluginContents = "", pluginBuildFileContents = "", includeRequire,
            specified, path, reqIndex, fileContents, currContents,
            i, placeHolderModName, needPause,
            context = require.s.contexts[require.s.ctxName];

        //Reset some state set up in requirePatch.js
        require._buildReset();

        logger.trace("\nTracing dependencies for: " + module.name);
        include = [module.name];
        if (module.include) {
            include = include.concat(module.include);
        }

        //If there are overrides to basic config, set that up now.
        baseConfig = context.config;
        if (module.override) {
            override = lang.delegate(baseConfig);
            lang.mixin(override, module.override, true);
            require(override);
        }

        //Figure out module layer dependencies by calling require to do the work.
        require(include);

        //Add any other files that did not have an explicit name on them.
        //These are files that do not call back into require when loaded.
        for (prop in require.buildPathMap) {
            if (require.buildPathMap.hasOwnProperty(prop)) {
                url = require.buildPathMap[prop];
                if (!require.loadedFiles[url]) {
                    require.buildFileToModule[url] = prop;
                    //Do not add plugins to build file paths since they will
                    //be added later, near the top of the module layer.
                    if (prop.indexOf("require/") !== 0) {
                        require.buildFilePaths.push(url);
                    }
                    require.loadedFiles[url] = true;
                }
            }
        }

        //Reset config
        if (module.override) {
            require(baseConfig);
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
            requireContents = pragma.process(config.requireUrl, fileUtil.readFile(config.requireUrl), context.config);
            if (require.buildFilePaths.length) {
                requireContents += "require.pause();\n";
            }
            buildFileContents += "require.js\n";
        }

        //Check for any plugins loaded, and hoist to the top, but below
        //the require() definition.
        specified = context.specified;
        for (prop in specified) {
            if (specified.hasOwnProperty(prop)) {
                if (prop.indexOf("require/") === 0) {
                    path = require.buildPathMap[prop];
                    //Path may be null, context.specified is populated by
                    //all module layers at the moment, but buildPathMaps are reset
                    //for each module layer. TODO: fix this.
                    if (path) {
                        pluginBuildFileContents += path.replace(config.dir, "") + "\n";
                        pluginContents += pragma.process(path, fileUtil.readFile(path), context.config);
                    }
                }
            }
        }
        if (includeRequire) {
            //require.js will be included so the plugins will appear right after it.
            buildFileContents += pluginBuildFileContents;
        }

        //If there was an existing file with require in it, hoist to the top.
        if (!includeRequire && require.existingRequireUrl) {
            reqIndex = require.buildFilePaths.indexOf(require.existingRequireUrl);
            if (reqIndex !== -1) {
                require.buildFilePaths.splice(reqIndex, 1);
            }
            require.buildFilePaths.unshift(require.existingRequireUrl);
        }

        //Write the built module to disk, and build up the build output.
        fileContents = "";
        for (i = 0; (path = require.buildFilePaths[i]); i++) {
            //Add the contents but remove any pragmas and require.pause/resume calls.
            currContents = pragma.process(path, fileUtil.readFile(path), context.config);
            needPause = build.resumeRegExp.test(currContents);

            //If this is the first file, and require() is not part of the file
            //and require() is not added later at the end to the top of the file,
            //need to start off with a require.pause() call.
            if (i === 0 && require.existingRequireUrl !== path && !includeRequire) {
                fileContents += "require.pause()\n";
            }

            fileContents += currContents;

            buildFileContents += path.replace(config.dir, "") + "\n";
            //Some files may not have declared a require module, and if so,
            //put in a placeholder call so the require does not try to load them
            //after the module is processed.
            placeHolderModName = require.buildFileToModule[path];
            //If we have a name, but no defined module, then add in the placeholder.
            if (placeHolderModName && !require.modulesWithNames[placeHolderModName]) {
                fileContents += 'require.def("' + placeHolderModName + '", function(){});\n';
            }

            //If we have plugins but are not injecting require.js,
            //then need to place the plugins after the require definition,
            //if it was found.
            if (require.existingRequireUrl === path && !includeRequire) {
                fileContents += pluginContents;
                buildFileContents += pluginBuildFileContents;
                pluginContents = "";
                fileContents += "require.pause();\n";
            }

            //If the file contents had a require.resume() we need to now pause
            //dependency resolution for the rest of the files. Multiple require.pause()
            //calls are OK.
            if (needPause) {
                fileContents += "require.pause();\n";
            }
        }

        //Resume dependency resolution
        if (require.buildFilePaths.length) {
            fileContents += "\nrequire.resume();\n";
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