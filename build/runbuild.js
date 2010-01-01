/**
 * @license Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/runjs for details
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

/*jslint regexp: false, nomen: false, plusplus: false */
/*global load: false, print: false, quit: false, logger: false,
  fileUtil: false, java: false, Packages: false, readFile: false */

"use strict";
var run;

(function (args) {
    var runbuildPath, buildFile, baseUrlFile, buildPaths, deps, fileName, fileNames,
        prop, props, paths, path, i, fileContents, buildFileContents = "", builtRunPath,
        pauseResumeRegExp = /run\s*\.\s*(pause|resume)\s*\(\s*\)(;)?/g,
        textDepRegExp = /["'](text)\!([^"']+)["']/g,
        conditionalRegExp = /(exclude|include)Start\s*\(\s*["'](\w+)["']\s*,(.*)\)/,
        context, doClosure, runContents, specified, delegate, baseConfig, override,
        JSSourceFilefromCode, placeHolderModName,

        //Set up defaults for the config.
        config = {
            pragmas: {},
            paths: {},
            optimize: "closure",
            optimizeCss: true,
            inlineText: true,
            execModules: true
        },
        layers = {}, layer, layerName, ostring = Object.prototype.toString;

    //Bind to Closure compiler, but if it is not available, do not sweat it.
    try {
        JSSourceFilefromCode = java.lang.Class.forName('com.google.javascript.jscomp.JSSourceFile').getMethod('fromCode', [java.lang.String, java.lang.String]);
    } catch(e) {}

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

    delegate = (function () {
        // boodman/crockford delegation w/ cornford optimization
        function TMP() {}
        return function (obj, props) {
            TMP.prototype = obj;
            var tmp = new TMP();
            TMP.prototype = null;
            if (props) {
                mixin(tmp, props);
            }
            return tmp; // Object
        };
    }());

    //Helper for closureOptimize, because of weird Java-JavaScript interactions.
    function closurefromCode(filename, content) {
        return JSSourceFilefromCode.invoke(null, [filename, content]);
    }

    function closureOptimize(fileName, fileContents, keepLines) {
        var jscomp = Packages.com.google.javascript.jscomp,
            flags = Packages.com.google.common.flags,
            //Fake extern
            externSourceFile = closurefromCode("fakeextern.js", " "),
            //Set up source input
            jsSourceFile = closurefromCode(String(fileName), String(fileContents)),
            options, FLAG_compilation_level, FLAG_warning_level, compiler;

        //Set up options
        options = new jscomp.CompilerOptions();
        options.prettyPrint = keepLines;

        FLAG_compilation_level = flags.Flag.value(jscomp.CompilationLevel.SIMPLE_OPTIMIZATIONS);
        FLAG_compilation_level.get().setOptionsForCompilationLevel(options);

        //Run the compiler
        compiler = new Packages.com.google.javascript.jscomp.Compiler();
        compiler.compile(externSourceFile, jsSourceFile, options);
        return compiler.toSource();  
    }

    //Adds escape sequences for non-visual characters, double quote and backslash
    //and surrounds with double quotes to form a valid string literal.
    //Assumes the string will be in a single quote string value.
    function jsEscape(text) {
        return text.replace(/(['\\])/g, '\\$1')
            .replace(/[\f]/g, "\\f")
            .replace(/[\b]/g, "\\b")
            .replace(/[\n]/g, "\\n")
            .replace(/[\t]/g, "\\t")
            .replace(/[\r]/g, "\\r");
    }

    //Inlines text! dependencies.
    function inlineText(fileName, fileContents) {
        var parts, modName, ext, strip, content;
        return fileContents.replace(textDepRegExp, function (match, prefix, dep) {
            parts = dep.split("!");
            modName = parts[0];
            ext = parts[1];
            strip = parts[2];
            content = parts[3];
            
            if (strip !== "strip") {
                content = strip;
                strip = null;
            }
            
            if (content) {
                //Already an inlined resource, return.
                return match;
            } else {
                content = readFile(run.convertNameToPath(modName, run.s.ctxName, "." + ext));
                if (strip) {
                    content = run.textStrip(content);
                }
                return "'" + prefix  +
                       "!" + modName +
                       "!" + ext +
                       (strip ? "!strip" : "") +
                       "!" + jsEscape(content) + "'";
            }
        });
    }

    /**
     * processes the fileContents for some //>> conditional statements
     */
    this.processPragmas = function (fileName, fileContents, config) {
        /*jslint evil: true */
        var foundIndex = -1, startIndex = 0, lineEndIndex, conditionLine,
            matches, type, marker, condition, isTrue, endRegExp, endMatches,
            endMarkerIndex, shouldInclude, startLength, pragmas = config.pragmas;
        
        //If pragma work is not desired, skip it.
        if (config.skipPragmas) {
            logger.trace("SKIPPING PRAGMAS!!!!");
            return fileContents;
        }

        while ((foundIndex = fileContents.indexOf("//>>", startIndex)) !== -1) {
            //Found a conditional. Get the conditional line.
            lineEndIndex = fileContents.indexOf("\n", foundIndex);
            if (lineEndIndex === -1) {
                lineEndIndex = fileContents.length - 1;
            }
    
            //Increment startIndex past the line so the next conditional search can be done.
            startIndex = lineEndIndex + 1;
    
            //Break apart the conditional.
            conditionLine = fileContents.substring(foundIndex, lineEndIndex + 1);
            matches = conditionLine.match(conditionalRegExp);
            if (matches) {
                type = matches[1];
                marker = matches[2];
                condition = matches[3];
                isTrue = false;
                //See if the condition is true.
                try {
                    isTrue = !!eval("(" + condition + ")");
                } catch (e) {
                    throw "Error in file: " +
                           fileName +
                           ". Conditional comment: " +
                           conditionLine +
                           " failed with this error: " + e;
                }
            
                //Find the endpoint marker.
                endRegExp = new RegExp('\\/\\/\\>\\>\\s*' + type + 'End\\(\\s*[\'"]' + marker + '[\'"]\\s*\\)', "g");
                endMatches = endRegExp.exec(fileContents.substring(startIndex, fileContents.length));
                if (endMatches) {
                    endMarkerIndex = startIndex + endRegExp.lastIndex - endMatches[0].length;
                    
                    //Find the next line return based on the match position.
                    lineEndIndex = fileContents.indexOf("\n", endMarkerIndex);
                    if (lineEndIndex === -1) {
                        lineEndIndex = fileContents.length - 1;
                    }
    
                    //Should we include the segment?
                    shouldInclude = ((type === "exclude" && !isTrue) || (type === "include" && isTrue));
                    
                    //Remove the conditional comments, and optionally remove the content inside
                    //the conditional comments.
                    startLength = startIndex - foundIndex;
                    fileContents = fileContents.substring(0, foundIndex) +
                        (shouldInclude ? fileContents.substring(startIndex, endMarkerIndex) : "") +
                        fileContents.substring(lineEndIndex + 1, fileContents.length);
                    
                    //Move startIndex to foundIndex, since that is the new position in the file
                    //where we need to look for more conditionals in the next while loop pass.
                    startIndex = foundIndex;
                } else {
                    throw "Error in file: " +
                          fileName +
                          ". Cannot find end marker for conditional comment: " +
                          conditionLine;
                    
                }
            }
        }
    
        return fileContents;
    };

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
                if (cfg.override) {
                    layer.override = cfg.override;
                }
            }

            if (deps) {
                layer.deps = deps;
            }
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
    if (!paths.run) {
        paths.run = config.runUrl.substring(0, config.runUrl.lastIndexOf("/")) + "/run";
    }
    buildPaths = {};
    
    //First copy all the baseUrl content
    fileUtil.copyDir(config.baseUrl, config.dir, /\w/, true);

    //Now copy all paths.
    for (prop in paths) {
        if (paths.hasOwnProperty(prop)) {
            //Set up build path for each path prefix.
            buildPaths[prop] = prop.replace(/\./g, "/");
            //Copy files to build area. Copy all files (the /\w/ regexp)
            fileUtil.copyDir(paths[prop], config.dir + buildPaths[prop], /\w/, true);
        }
    }

    //If run.js does not exist in build output, put it in there.
    builtRunPath = config.dir + "run.js";
    if (!((new Packages.java.io.File(builtRunPath)).exists())) {
        fileUtil.copyFile(config.runUrl, builtRunPath, true);
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
            layers[layerName]._sourcePath = run.convertNameToPath(layerName, run.s.ctxName);
        }
    }

    //Now set up the config for run to use the build area, and calculate the
    //build file locations.
    run({
        baseUrl: config.dir,
        paths: buildPaths,
        locale: config.locale,
        pragmas: config.pragmas,
        execModules: config.execModules
    });

    for (layerName in layers) {
        if (layers.hasOwnProperty(layerName)) {
            layer = layers[layerName];
            layer._buildPath = run.convertNameToPath(layerName, run.s.ctxName);
            fileUtil.copyFile(layer._sourcePath, layer._buildPath);
        }
    }

    //For each layer, call run to calculate dependencies, and then save
    //the calculated layer to disk in the build area.
    context = run.s.contexts[run.s.ctxName];
    for (layerName in layers) {
        if (layers.hasOwnProperty(layerName)) {
            layer = layers[layerName];

            //Reset some state set up in runPatch.js
            run.buildPathMap = {};
            run.buildFileToModule = {};
            run.buildFilePaths = [];

            logger.trace("\nFiguring out dependencies for: " + layerName);
            deps = [layerName];
            if (layer.deps) {
                deps = deps.concat(layer.deps);
            }
            
            //If there are overrides to basic config, set that up now.
            baseConfig = context.config;
            if (layer.override) {
                override = delegate(baseConfig);
                mixin(override, layer.override, true);
                run(override);
            }

            //Figure out layer dependencies by calling run to do the work.
            run(deps);
            
            //Reset config
            if (layer.override) {
                run(baseConfig);
            }

            //Start build output for the layer.
            buildFileContents += "\n" + layer._buildPath.replace(config.dir, "") + "\n----------------\n";

            //If the file wants run.js added to the layer, add it now
            runContents = "";
            if (layer.includeRun) {
                runContents = this.processPragmas(config.runUrl, fileUtil.readFile(config.runUrl), context.config);
                buildFileContents += "run.js\n";
    
                //Check for any plugins loaded.
                specified = context.specified;
                for (prop in specified) {
                    if (specified.hasOwnProperty(prop)) {
                        if (prop.indexOf("run/") === 0) {
                            path = run.buildPathMap[prop];
                            buildFileContents += path.replace(config.dir, "") + "\n";
                            runContents += this.processPragmas(path, fileUtil.readFile(path), context.config);
                        }
                    }
                }
            }

            //Write the build layer to disk, and build up the build output.
            fileContents = "";
            for (i = 0; (path = run.buildFilePaths[i]); i++) {
                fileContents += fileUtil.readFile(path);
                buildFileContents += path.replace(config.dir, "") + "\n";
                //Some files may not have declared a run module, and if so,
                //put in a placeholder call so the run does not try to load them
                //after the layer is processed.
                placeHolderModName = run.buildFileToModule[path];
                if (placeHolderModName) {
                    fileContents += 'run("' + placeHolderModName + '", function(){});\n';
                }
            }

            //Remove any run.pause/resume calls, then add them back around
            //the whole file, but only if there were files written out, besides
            //the run.js and plugin files.
            if (run.buildFilePaths.length) {
                fileContents = fileContents.replace(pauseResumeRegExp, "");
                fileContents = "run.pause();\n" + fileContents + "\nrun.resume();\n";
            }

            //Add the run file contents to the head of the file.
            fileContents = (runContents ? runContents + "\n" : "") + fileContents;

            fileUtil.saveUtf8File(layer._buildPath, fileContents);
        }
    }

    //All layers are done, write out the build.txt file.
    fileUtil.saveUtf8File(config.dir + "build.txt", buildFileContents);

    //Do bulk optimizations
    if (config.inlineText) {
        //Make sure text extension is loaded.
        run(["run/text"]);
        logger.info("Inlining text dependencies");
    }
    doClosure = config.optimize.indexOf("closure") === 0;
    if (doClosure) {
        logger.info("Optimizing JS files with Closure Compiler");
    }

    fileNames = fileUtil.getFilteredFileList(config.dir, /\.js$/, true);    
    for (i = 0; (fileName = fileNames[i]); i++) {
        fileContents = fileUtil.readFile(fileName);

        //Inline text files.
        if (config.inlineText) {
            fileContents = inlineText(fileName, fileContents);
        }

        //Optimize the JS files if asked.
        if (doClosure) {
            fileContents = closureOptimize(fileName,
                                           fileContents,
                                           (config.optimize.indexOf(".keepLines") !== -1));
        }

        fileUtil.saveUtf8File(fileName, fileContents);
    }


}(arguments));
