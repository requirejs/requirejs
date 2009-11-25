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

/*jslint plusplus: false */
/*global load: false, print: false, quit: false, logger: false,
  fileUtil: false, java: false */

"use strict";

(function () {
    var runbuildPath, buildFile, baseUrlFile, run,
        //Set up defaults for the config.
        config = {
            copyPaths: true,
            optimize: "closure",
            optimizeCss: true
        },
        layers = [], ostring = Object.prototype.toString;

    function isArray(it) {
        return ostring.call(it) === "[object Array]";    
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     */
    function mixin(target, source) {
        //Use an empty object to avoid other bad JS code that modifies
        //Object.prototype.
        var empty = {}, prop;
        for (prop in source) {
            if (!(prop in target)) {
                target[prop] = source[prop];
            }
        }
    }

    if (!arguments || arguments.length < 2) {
        print("java -jar path/to/js.jar runbuild.js directory/containing/runbuild.js/ build.js\n" +
              "where build.js is the name of the build file (see example.build.js for hints on how to make a build file.");
        quit();
    }
    
    //First argument to this script should be the directory on where to find this script.
    runbuildPath = arguments[0];
    
    load(runbuildPath + "/jslib/logger.js");
    load(runbuildPath + "/jslib/fileUtil.js");
    
    //Find the build file, and make sure it exists.
    buildFile = new java.io.File(arguments[1]);
    if (!buildFile.exists()) {
        print("ERROR: build file does not exist: " + buildFile.getAbsolutePath());
        quit();
    }
    baseUrlFile = buildFile.getParentFile();
    buildFile = (buildFile.getAbsolutePath() + "").replace(/\\/g, "/");

    //Set up some defaults in the default config
    config.baseUrl = baseUrlFile.getAbsolutePath() + "";
    config.runUrl = baseUrlFile.getParentFile().getAbsolutePath() + "/run.js";

    //Set up the build file environment by creating a dummy run() function to
    //catch the build file information.
    run = function (cfg, name, deps) {
        //Normalize parameters
        if (typeof cfg === "string") {
            //config is really the name
            deps = name;
            name = cfg;
            cfg = null;
        }

        if (cfg) {
            mixin(config, cfg);
        }

        if (name) {
            layers[name] = {};
        }

        if (deps) {
            layers[name].deps = deps;
        }
    };

    //Load the build file.
    load(buildFile.getAbsolutePath());

    //Adjust the path properties as appropriate:
    xxx

    //Copy the files to the output directory.
    if (config.copyPaths) {
        
    }
}());
