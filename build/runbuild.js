/*
    Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
    Available via the new BSD license.
    see: http://code.google.com/p/runjs/ for details
*/

/*
 * This file will optimize files that can be loaded via run.js into one file.
 * This file needs Rhino to run, and if the Closure compiler is used to minify
 * files, Java 6 is required.
 *
 * Call this file like so:
 * java -jar path/to/js.jar runbuild.js directory/containing/runbuild.js/ build.js
 *
 * General use:
 *
 * Create a build.js file that has run() calls to the build layer/bundle that you
 * want to create. Use the config option on runjs to specify paths on where
 * to find things. See example.build.js for more information.
 */

/*jslint nomen: false, plusplus: false */
/*global load: false, print: false, quit: false, logger: false,
  fileUtil: false, java: false */

"use strict";
var run;

(function (args) {
    var runbuildPath, buildFile, baseUrlFile, buildPaths,
        prop, props, paths, path, i, fileContents, buildFileContents = "",
        pauseResumeRegExp = /run\s*\.\s*(pause|resume)\s*\(\s*\)(;)?/g,
        //Set up defaults for the config.
        config = {
            paths: {},
            optimize: "closure",
            optimizeCss: true
        },
        layers = {}, layer, layerName, ostring = Object.prototype.toString;

    function isArray(it) {
        return ostring.call(it) === "[object Array]";    
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     */
    function mixin(target, source, override) {
        //Use an empty object to avoid other bad JS code that modifies
        //Object.prototype.
        var empty = {}, prop;
        for (prop in source) {
            if (override || !(prop in target)) {
                target[prop] = source[prop];
            }
        }
    }

    if (!args || args.length < 2) {
        print("java -jar path/to/js.jar runbuild.js directory/containing/runbuild.js/ build.js\n" +
              "where build.js is the name of the build file (see example.build.js for hints on how to make a build file.");
        quit();
    }

    //First argument to this script should be the directory on where to find this script.
    runbuildPath = args[0];

    load(runbuildPath + "/jslib/logger.js");
    load(runbuildPath + "/jslib/fileUtil.js");

    //Find the build file, and make sure it exists.
    buildFile = new java.io.File(args[1]).getAbsoluteFile();
    if (!buildFile.exists()) {
        print("ERROR: build file does not exist: " + buildFile.getAbsolutePath());
        quit();
    }

    baseUrlFile = buildFile.getAbsoluteFile().getParentFile();
    buildFile = (buildFile.getAbsolutePath() + "").replace(/\\/g, "/");

    //Set up some defaults in the default config
    config.baseUrl = baseUrlFile.getAbsolutePath() + "";
    config.runUrl = baseUrlFile.getParentFile().getAbsolutePath() + "/run.js";
    config.dir = baseUrlFile.getAbsolutePath() + "/build/";

    //Set up the build file environment by creating a dummy run() function to
    //catch the build file information.
    run = function (cfg, name, deps) {
        var layer;
        //Normalize parameters
        if (typeof cfg === "string") {
            //config is really the name
            deps = name;
            name = cfg;
            cfg = null;
        }

        if (cfg) {
            mixin(config, cfg, true);
        }

        layer = null;
        if (name) {
            layer = layers[name] = {};
            
            if (cfg) {
                if (cfg.excludes) {
                    layer.excludes = cfg.excludes;
                }
                if (cfg.includeRun) {
                    layer.includeRun = true;
                }
            }
        }

        if (deps) {
            layer.deps = deps;
        }
    };

    //Load the build file, reset run to null, then load run.js
    load(buildFile.toString());
    run = null;
    load(config.runUrl);
    load(runbuildPath + "/jslib/runpatch.js");

    //Adjust the path properties as appropriate.
    //First make sure build paths use front slashes and end in a slash
    props = ["dir", "baseUrl"];
    for (i = 0; (prop = props[i]); i++) {
        config[prop] = config[prop].replace(/\\/g, "/");
        if (config[prop].charAt(config[prop].length - 1) !== "/") {
            config[prop] += "/";
        }
    }

    //Set up build output paths. Include baseUrl directory.
    paths = config.paths;
    paths.__baseUrl = config.baseUrl;
    buildPaths = {
        "__baseUrl": config.dir
    };
    for (prop in paths) {
        if (paths.hasOwnProperty(prop)) {
            //Set up build path for each path prefix.
            if (prop !== "__baseUrl") {
                buildPaths[prop] = config.dir + prop.replace(/\./g, "/") + "/";
            }
            //Copy files to build area. Copy all files (the /\w/ regexp)
            fileUtil.copyDir(paths[prop], buildPaths[prop], /\w/, true);
        }
    }

    //Figure out source file location for each layer. Do this by seeding run()
    //with source area configuration. This is needed so that later the layers
    //can be manually copied over to the source area, since the build may be
    //run multiple times and the above copyDir call only copies newer files.
    run({
        baseUrl: config.baseUrl,
        paths: paths     
    });
    for (layerName in layers) {
        if (layers.hasOwnProperty(layerName)) {
            layers[layerName]._sourcePath = run.convertNameToPath(layerName, run._currContextName);
        }
    }

    //Now set up the config for run to use the build area, and calculate the
    //build file locations
    run({
        baseUrl: config.dir,
        paths: buildPaths
    });
    for (layerName in layers) {
        if (layers.hasOwnProperty(layerName)) {
            layer = layers[layerName];
            layer._buildPath = run.convertNameToPath(layerName, run._currContextName);
            fileUtil.copyFile(layer._sourcePath, layer._buildPath);
        }
    }

    //For each layer, call run to calculate dependencies, and then save
    //the calculated layer to disk in the build area.
    for (layerName in layers) {
        if (layers.hasOwnProperty(layerName)) {
            layer = layers[layerName];

            //Reset some state set up in runPatch.js
            run.buildPathMap = {};
            run.buildFilePaths = [];

            logger.trace("\nFiguring out dependencies for: " + layerName);
            run([layerName]);

            //Write the build layer to disk, and build up the build output.
            fileContents = "";
            buildFileContents += layer._buildPath.replace(config.dir, "") + "\n----------------\n";
            for (i = 0; (path = run.buildFilePaths[i]); i++) {
                fileContents += fileUtil.readFile(path);
                buildFileContents += path.replace(config.dir, "") + "\n";
            }

            //Remove any run.pause/resume calls, then add them back around
            //the whole file.
            fileContents = fileContents.replace(pauseResumeRegExp, "");
            fileContents = "run.pause();\n" + fileContents + "\nrun.resume();\n";

            //If the file wants run.js added to the layer, add it now
            if (layer.includeRun) {
                fileContents = fileUtil.readFile(config.runUrl) + "\n" + fileContents;
            }

            fileUtil.saveUtf8File(layer._buildPath, fileContents);
        }
    }

    //All layers are done, write out the build.txt file.
    fileUtil.saveUtf8File(config.dir + "build.txt", buildFileContents);
    logger.info("\nBuilt layers:\n\n" + buildFileContents);

}(arguments));
