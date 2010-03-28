/**
 * @license Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
 * This file will optimize files that can be loaded via require.js into one file.
 * This file needs Rhino to require, and if the Closure compiler is used to minify
 * files, Java 6 is required.
 *
 * Call this file like so:
 * java -jar path/to/js.jar build.js directory/containing/build.js/ build.js
 *
 * General use:
 *
 * Create a build.js file that has require calls to the build layer/bundle that you
 * want to create. Use the config option on requirejs to specify paths on where
 * to find things. See example.build.js for more information.
 */

/*jslint regexp: false, nomen: false, plusplus: false */
/*global load: false, print: false, quit: false, logger: false,
  fileUtil: false, lang: false, pragma: false, optimize: false, java: false,
  Packages: false, readFile: false */

"use strict";
var require;

(function (args) {
    var requireBuildPath, buildFile, baseUrlFile, buildPaths, deps, fileName, fileNames,
        prop, props, paths, path, i, fileContents, buildFileContents = "", builtrequirePath,
        resumeRegExp = /require\s*\.\s*resume\s*\(\s*\)(;)?/g,
        context, doClosure, requireContents, pluginContents, pluginBuildFileContents,
        currContents, needPause, reqIndex, specified, baseConfig, override,
        placeHolderModName, url, builtRequirePath, cmdConfig,

        //Set up defaults for the config.
        config = {
            pragmas: {
                useStrict: true
            },
            paths: {},
            optimize: "closure",
            optimizeCss: "standard.keepLines",
            inlineText: true,
            execModules: false
        },

        layers = {}, layer, layerName;


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

    ["lang", "logger", "fileUtil", "parse", "optimize", "pragma"].forEach(function (path) {
        load(requireBuildPath + "jslib/" + path + ".js");
    });

    //Next args can include a build file path as well as other build args.
    //build file path comes first. If it does not contain an = then it is
    //a build file path. Otherwise, just all build args.
    if (args[1].indexOf("=") === -1) {
        buildFile = new java.io.File(args[1]).getAbsoluteFile();
        args.splice(0, 2);
    } else {
        args.splice(0, 1);
    }

    //Remaining args are options to the build
    cmdConfig = lang.convertArrayToObject(args);

    //If this is a one file build, then skip some things.
    lang.mixin(config, cmdConfig, true);
    config.optimizeCss = "none";

    //Find the build file, and make sure it exists, if this is a build
    //that has a build profile, and not just command line args with an in=path
    if (buildFile && !buildFile.exists() || cmdConfig["in"]) {
        print("ERROR: build file does not exist: " + buildFile.getAbsolutePath());
        quit();
    }

    baseUrlFile = buildFile.getAbsoluteFile().getParentFile();

    buildFile = (buildFile.getAbsolutePath() + "").replace(lang.backSlashRegExp, "/");

    //Set up some defaults in the default config
    config.appDir = "";
    config.baseUrl = baseUrlFile.getAbsolutePath() + "";
    config.requireUrl = requireBuildPath + "../require.js";
    config.dir = baseUrlFile.getAbsolutePath() + "/build/";

    //Set up the build file environment by creating a dummy require function to
    //catch the build file information.
    require = function (cfg, name, deps) {
        var layer;
        //Normalize parameters
        if (typeof cfg === "string") {
            //config is really the name
            deps = name;
            name = cfg;
            cfg = null;
        }

        if (cfg) {
            lang.mixin(config, cfg, true);
        }

        layer = null;
        if (name) {
            layer = layers[name] = {};
            
            if (cfg) {
                if (cfg.excludes) {
                    layer.excludes = cfg.excludes;
                }
                if (cfg.includeRequire) {
                    layer.includeRequire = true;
                }
                if (cfg.override) {
                    layer.override = cfg.override;
                }
            }

            if (deps) {
                layer.deps = deps;
            }
        }
    };

    //Load the build file, reset require to null, then load require.js
    load(buildFile.toString());
    require = null;
    load(config.requireUrl);
    load(requireBuildPath + "jslib/requirePatch.js");

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

    //Set up build output paths. Include baseUrl directory.
    paths = config.paths;
    if (!paths.require) {
        paths.require = config.requireUrl.substring(0, config.requireUrl.lastIndexOf("/")) + "/require";
    }
    buildPaths = {};
    
    //First copy all the baseUrl content
    fileUtil.copyDir((config.appDir || config.baseUrl), config.dir, /\w/, true);

    //Adjust baseUrl if config.appDir is in play.
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

    //If require.js does not exist in build output, put it in there.
    builtRequirePath = config.dirBaseUrl + "require.js";
    if (!((new Packages.java.io.File(builtRequirePath)).exists())) {
        fileUtil.copyFile(config.requireUrl, builtRequirePath, true);
    }

    //Figure out source file location for each layer. Do this by seeding require
    //with source area configuration. This is needed so that later the layers
    //can be manually copied over to the source area, since the build may be
    //require multiple times and the above copyDir call only copies newer files.
    require({
        baseUrl: config.baseUrl,
        paths: paths
    });
    for (layerName in layers) {
        if (layers.hasOwnProperty(layerName)) {
            layers[layerName]._sourcePath = require.nameToUrl(layerName, null, require.s.ctxName);
        }
    }

    //Now set up the config for require to use the build area, and calculate the
    //build file locations. Pass along any config info too.
    baseConfig = {
        baseUrl: config.dirBaseUrl,
        paths: buildPaths
    };
    lang.mixin(baseConfig, config);
    require(baseConfig);

    for (layerName in layers) {
        if (layers.hasOwnProperty(layerName)) {
            layer = layers[layerName];
            layer._buildPath = require.nameToUrl(layerName, null, require.s.ctxName);
            fileUtil.copyFile(layer._sourcePath, layer._buildPath);
        }
    }

    //For each layer, call require to calculate dependencies, and then save
    //the calculated layer to disk in the build area.
    context = require.s.contexts[require.s.ctxName];
    for (layerName in layers) {
        if (layers.hasOwnProperty(layerName)) {
            layer = layers[layerName];

            //Reset some state set up in requirePatch.js
            require._buildReset();

            logger.trace("\nFiguring out dependencies for: " + layerName);
            deps = [layerName];
            if (layer.deps) {
                deps = deps.concat(layer.deps);
            }

            //If there are overrides to basic config, set that up now.
            baseConfig = context.config;
            if (layer.override) {
                override = lang.delegate(baseConfig);
                lang.mixin(override, layer.override, true);
                require(override);
            }

            //Figure out layer dependencies by calling require to do the work.
            require(deps);

            //Add any other files that did not have an explicit name on them.
            //These are files that do not call back into require when loaded.
            for (prop in require.buildPathMap) {
                if (require.buildPathMap.hasOwnProperty(prop)) {
                    url = require.buildPathMap[prop];
                    if (!require.loadedFiles[url]) {
                        require.buildFileToModule[url] = prop;
                        //Do not add plugins to build file paths since they will
                        //be added later, near the top of the layer.
                        if (prop.indexOf("require/") !== 0) {
                            require.buildFilePaths.push(url);
                        }
                        require.loadedFiles[url] = true;
                    }
                }
            }

            //Reset config
            if (layer.override) {
                require(baseConfig);
            }

            //Start build output for the layer.
            buildFileContents += "\n" + layer._buildPath.replace(config.dir, "") + "\n----------------\n";

            //If the file wants require.js added to the layer, add it now
            requireContents = "";
            pluginContents = "";
            pluginBuildFileContents = "";
            if (layer.includeRequire) {
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
                        //all layers at the moment, but buildPathMaps are reset
                        //for each layer. TODO: fix this.
                        if (path) {
                            pluginBuildFileContents += path.replace(config.dir, "") + "\n";
                            pluginContents += pragma.process(path, fileUtil.readFile(path), context.config);
                        }
                    }
                }
            }
            if (layer.includeRequire) {
                //require.js will be included so the plugins will appear right after it.
                buildFileContents += pluginBuildFileContents;
            }

            //If there was an existing file with require in it, hoist to the top.
            if (!layer.includeRequire && require.existingRequireUrl) {
                reqIndex = require.buildFilePaths.indexOf(require.existingRequireUrl);
                if (reqIndex !== -1) {
                    require.buildFilePaths.splice(reqIndex, 1);
                }
                require.buildFilePaths.unshift(require.existingRequireUrl);
            }

            //Write the build layer to disk, and build up the build output.
            fileContents = "";
            for (i = 0; (path = require.buildFilePaths[i]); i++) {
                //Add the contents but remove any pragmas and require.pause/resume calls.
                currContents = pragma.process(path, fileUtil.readFile(path), context.config);
                needPause = resumeRegExp.test(currContents);

                fileContents += currContents;

                //If the file contents had a require.resume() we need to now pause
                //dependency resolution for the rest of the files. Multiple require.pause()
                //calls are OK.
                if (needPause) {
                    fileContents += "require.pause();\n";
                }

                buildFileContents += path.replace(config.dir, "") + "\n";
                //Some files may not have declared a require module, and if so,
                //put in a placeholder call so the require does not try to load them
                //after the layer is processed.
                placeHolderModName = require.buildFileToModule[path];
                //If we have a name, but no defined module, then add in the placeholder.
                if (placeHolderModName && !require.modulesWithNames[placeHolderModName]) {
                    fileContents += 'require.def("' + placeHolderModName + '", function(){});\n';
                }

                //If we have plugins but are not injecting require.js,
                //then need to place the plugins after the require definition,
                //if it was found.
                if (require.existingRequireUrl === path && !layer.includeRequire) {
                    fileContents += pluginContents;
                    buildFileContents += pluginBuildFileContents;
                    pluginContents = "";
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

            fileUtil.saveUtf8File(layer._buildPath, fileContents);
        }
    }

    //All layers are done, write out the build.txt file.
    fileUtil.saveUtf8File(config.dir + "build.txt", buildFileContents);

    //Do bulk optimizations
    if (config.inlineText) {
        //Make sure text extension is loaded.
        require(["require/text"]);
        logger.info("Inlining text dependencies");
    }
    doClosure = (config.optimize + "").indexOf("closure") === 0;
    if (doClosure) {
        logger.info("Optimizing JS files with Closure Compiler");
    }

    fileNames = fileUtil.getFilteredFileList(config.dir, /\.js$/, true);    
    for (i = 0; (fileName = fileNames[i]); i++) {
        fileContents = fileUtil.readFile(fileName);

        //Inline text files.
        if (config.inlineText) {
            fileContents = optimize.inlineText(fileName, fileContents);
        }

        //Optimize the JS files if asked.
        if (doClosure) {
            fileContents = optimize.closure(fileName,
                                           fileContents,
                                           (config.optimize.indexOf(".keepLines") !== -1));
        }

        fileUtil.saveUtf8File(fileName, fileContents);
    }

    //Do CSS optimizations
    if (config.optimizeCss && config.optimizeCss !== "none") {
        optimize.css(config.dir, config.optimizeCss, config.cssImportIgnore);
    }

}(Array.prototype.slice.call(arguments)));
