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
 * Create a build.js file that has the build options you want and pass that
 * build file to this file to do the build. See example.build.js for more information.
 */

/*jslint regexp: false, nomen: false, plusplus: false */
/*global load: false, print: false, quit: false, logger: false,
  fileUtil: false, lang: false, pragma: false, optimize: false, build: false,
  java: false, Packages: false, readFile: false */

"use strict";
var require;

(function (args) {
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
    
}(Array.prototype.slice.call(arguments)));
