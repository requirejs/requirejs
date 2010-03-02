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
  fileUtil: false, java: false, Packages: false, readFile: false */

"use strict";
var require;

(function (args) {
    var requireBuildPath, buildFile, baseUrlFile, buildPaths, deps, fileName, fileNames,
        prop, props, paths, path, i, fileContents, buildFileContents = "", builtrequirePath,
        resumeRegExp = /require\s*\.\s*resume\s*\(\s*\)(;)?/g,
        textDepRegExp = /["'](text)\!([^"']+)["']/g,
        conditionalRegExp = /(exclude|include)Start\s*\(\s*["'](\w+)["']\s*,(.*)\)/,
        backSlashRegExp = /\\/g,
        cssImportRegExp = /\@import\s+(url\()?\s*([^);]+)\s*(\))?([\w, ]*)(;)?/g,
        cssUrlRegExp = /\url\(\s*([^\)]+)\s*\)?/g,
        context, doClosure, requireContents, specified, delegate, baseConfig, override,
        JSSourceFilefromCode, placeHolderModName, url, builtRequirePath,

        //Set up defaults for the config.
        config = {
            pragmas: {},
            paths: {},
            optimize: "closure",
            optimizeCss: "standard.keepLines",
            inlineText: true,
            execModules: false
        },
        layers = {}, layer, layerName, ostring = Object.prototype.toString;

    //Bind to Closure compiler, but if it is not available, do not sweat it.
    try {
        JSSourceFilefromCode = java.lang.Class.forName('com.google.javascript.jscomp.JSSourceFile').getMethod('fromCode', [java.lang.String, java.lang.String]);
    } catch (e) {}

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

        //Trigger the compiler
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
                content = readFile(require.nameToUrl(modName, "." + ext, require.s.ctxName));
                if (strip) {
                    content = require.textStrip(content);
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
     * If an URL from a CSS url value contains start/end quotes, remove them.
     * This is not done in the regexp, since my regexp fu is not that strong,
     * and the CSS spec allows for ' and " in the URL if they are backslash escaped.
     * @param {String} url
     */
    function cleanCssUrlQuotes(url) {
        //Make sure we are not ending in whitespace.
        //Not very confident of the css regexps above that there will not be ending
        //whitespace.
        url = url.replace(/\s+$/, "");

        if (url.charAt(0) === "'" || url.charAt(0) === "\"") {
            url = url.substring(1, url.length - 1);
        }

        return url;
    }

    /**
     * Inlines nested stylesheets that have @import calls in them.
     * @param {String} fileName
     * @param {String} fileContents
     * @param {String} [cssImportIgnore]
     */
    function flattenCss(fileName, fileContents, cssImportIgnore) {
        //Find the last slash in the name.
        fileName = fileName.replace(backSlashRegExp, "/");
        var endIndex = fileName.lastIndexOf("/"),
            //Make a file path based on the last slash.
            //If no slash, so must be just a file name. Use empty string then.
            filePath = (endIndex !== -1) ? fileName.substring(0, endIndex + 1) : "";
    
        return fileContents.replace(cssImportRegExp, function (fullMatch, urlStart, importFileName, urlEnd, mediaTypes) {
            //Only process media type "all" or empty media type rules.
            if (mediaTypes && ((mediaTypes.replace(/^\s\s*/, '').replace(/\s\s*$/, '')) !== "all")) {
                return fullMatch;
            }
    
            importFileName = cleanCssUrlQuotes(importFileName);
            
            //Ignore the file import if it is part of an ignore list.
            if (cssImportIgnore && cssImportIgnore.indexOf(importFileName + ",") !== -1) {
                return fullMatch;
            }

            //Make sure we have a unix path for the rest of the operation.
            importFileName = importFileName.replace(backSlashRegExp, "/");
    
            try {
                //if a relative path, then tack on the filePath.
                //If it is not a relative path, then the readFile below will fail,
                //and we will just skip that import.
                var fullImportFileName = importFileName.charAt(0) === "/" ? importFileName : filePath + importFileName,
                    importContents = fileUtil.readFile(fullImportFileName), i,
                    importEndIndex, importPath, fixedUrlMatch, colonIndex, parts;

                //Make sure to flatten any nested imports.
                importContents = flattenCss(fullImportFileName, importContents);

                //Make the full import path
                importEndIndex = importFileName.lastIndexOf("/");

                //Make a file path based on the last slash.
                //If no slash, so must be just a file name. Use empty string then.
                importPath = (importEndIndex !== -1) ? importFileName.substring(0, importEndIndex + 1) : "";

                //Modify URL paths to match the path represented by this file.
                importContents = importContents.replace(cssUrlRegExp, function (fullMatch, urlMatch) {
                    fixedUrlMatch = cleanCssUrlQuotes(urlMatch);
                    fixedUrlMatch = fixedUrlMatch.replace(backSlashRegExp, "/");
    
                    //Only do the work for relative URLs. Skip things that start with / or have
                    //a protocol.
                    colonIndex = fixedUrlMatch.indexOf(":");
                    if (fixedUrlMatch.charAt(0) !== "/" && (colonIndex === -1 || colonIndex > fixedUrlMatch.indexOf("/"))) {
                        //It is a relative URL, tack on the path prefix
                        urlMatch = importPath + fixedUrlMatch;
                    } else {
                        logger.trace(importFileName + "\n  URL not a relative URL, skipping: " + urlMatch);
                    }

                    //Collapse .. and .
                    parts = urlMatch.split("/");
                    for (i = parts.length - 1; i > 0; i--) {
                        if (parts[i] === ".") {
                            parts.splice(i, 1);
                        } else if (parts[i] === "..") {
                            if (i !== 0 && parts[i - 1] !== "..") {
                                parts.splice(i - 1, 2);
                                i -= 1;
                            }
                        }
                    }
    
                    return "url(" + parts.join("/") + ")";
                });
    
                return importContents;
            } catch (e) {
                logger.trace(fileName + "\n  Cannot inline css import, skipping: " + importFileName);
                return fullMatch;
            }
        });
    }

   /**
     * Optimizes CSS files, inlining @import calls, stripping comments, and
     * optionally removes line returns.
     * @param {String} startDir the path to the top level directory
     * @param {String} optimizeType, the config's optimizeCss value.
     * @param {String} a comma-separated list of paths to not @import inline.
     */
    function optimizeCss(startDir, optimizeType, cssImportIgnore) {
        if (optimizeType.indexOf("standard") !== -1) {
            //Make sure we have a delimited ignore list to make matching faster
            if (cssImportIgnore) {
                cssImportIgnore = cssImportIgnore + ",";
            }

            var i, fileName, startIndex, endIndex, originalFileContents, fileContents,
                fileList = fileUtil.getFilteredFileList(startDir, /\.css$/, true);
            if (fileList) {
                for (i = 0; i < fileList.length; i++) {
                    fileName = fileList[i];
                    logger.trace("Optimizing (" + optimizeType + ") CSS file: " + fileName);
                    
                    //Read in the file. Make sure we have a JS string.
                    originalFileContents = fileUtil.readFile(fileName);
                    fileContents = flattenCss(fileName, originalFileContents, cssImportIgnore);
    
                    //Do comment removal.
                    try {
                        startIndex = -1;
                        //Get rid of comments.
                        while ((startIndex = fileContents.indexOf("/*")) !== -1) {
                            endIndex = fileContents.indexOf("*/", startIndex + 2);
                            if (endIndex === -1) {
                                throw "Improper comment in CSS file: " + fileName;
                            }
                            fileContents = fileContents.substring(0, startIndex) + fileContents.substring(endIndex + 2, fileContents.length);
                        }
                        //Get rid of newlines.
                        if (optimizeType.indexOf(".keepLines") === -1) {
                            fileContents = fileContents.replace(/[\r\n]/g, "");
                            fileContents = fileContents.replace(/\s+/g, " ");
                            fileContents = fileContents.replace(/\{\s/g, "{");
                            fileContents = fileContents.replace(/\s\}/g, "}");
                        } else {
                            //Remove multiple empty lines.
                            fileContents = fileContents.replace(/(\r\n)+/g, "\r\n");
                            fileContents = fileContents.replace(/(\n)+/g, "\n");
                        }
                    } catch (e) {
                        fileContents = originalFileContents;
                        logger.error("Could not optimized CSS file: " + fileName + ", error: " + e);
                    }
        
                    //Write out the file with appropriate copyright.
                    fileUtil.saveUtf8File(fileName, fileContents);
                }
            }
        }
    }

    /**
     * processes the fileContents for some //>> conditional statements
     */
    this.processPragmas = function (fileName, fileContents, config) {
        /*jslint evil: true */
        var foundIndex = -1, startIndex = 0, lineEndIndex, conditionLine,
            matches, type, marker, condition, isTrue, endRegExp, endMatches,
            endMarkerIndex, shouldInclude, startLength, pragmas = config.pragmas,
            //Legacy arg defined to help in dojo conversion script. Remove later
            //when dojo no longer needs conversion:
            kwArgs = {
                profileProperties: {
                    hostenvType: "browser"
                }
            };

        //If pragma work is not desired, skip it.
        if (config.skipPragmas) {
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
        print("java -jar path/to/js.jar build.js directory/containing/build.js/ build.js\n" +
              "where build.js is the name of the build file (see example.build.js for hints on how to make a build file.");
        quit();
    }

    //First argument to this script should be the directory on where to find this script.
    requireBuildPath = args[0];

    load(requireBuildPath + "/jslib/logger.js");
    load(requireBuildPath + "/jslib/fileUtil.js");

    //Find the build file, and make sure it exists.
    buildFile = new java.io.File(args[1]).getAbsoluteFile();
    if (!buildFile.exists()) {
        print("ERROR: build file does not exist: " + buildFile.getAbsolutePath());
        quit();
    }

    baseUrlFile = buildFile.getAbsoluteFile().getParentFile();
    buildFile = (buildFile.getAbsolutePath() + "").replace(backSlashRegExp, "/");

    //Set up some defaults in the default config
    config.appDir = "";
    config.baseUrl = baseUrlFile.getAbsolutePath() + "";
    config.requireUrl = baseUrlFile.getParentFile().getAbsolutePath() + "/require.js";
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
            mixin(config, cfg, true);
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
    load(requireBuildPath + "/jslib/requirePatch.js");

    //Adjust the path properties as appropriate.
    //First make sure build paths use front slashes and end in a slash
    props = ["appDir", "dir", "baseUrl"];
    for (i = 0; (prop = props[i]); i++) {
        if (config[prop]) {
            config[prop] = config[prop].replace(backSlashRegExp, "/");
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
    mixin(baseConfig, config);
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
            require.buildPathMap = {};
            require.buildFileToModule = {};
            require.buildFilePaths = [];
            require.loadedFiles = {};
            require.modulesWithNames = {};

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
                        //Only add require plugins to build file paths if
                        //require is not included in the layer
                        if (prop.indexOf("require/") !== 0 || !layer.includeRequire) {
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
            if (layer.includeRequire) {
                requireContents = this.processPragmas(config.requireUrl, fileUtil.readFile(config.requireUrl), context.config);
                buildFileContents += "require.js\n";
    
                //Check for any plugins loaded.
                specified = context.specified;
                for (prop in specified) {
                    if (specified.hasOwnProperty(prop)) {
                        if (prop.indexOf("require/") === 0) {
                            path = require.buildPathMap[prop];
                            buildFileContents += path.replace(config.dir, "") + "\n";
                            requireContents += this.processPragmas(path, fileUtil.readFile(path), context.config);
                        }
                    }
                }
            }

            //Write the build layer to disk, and build up the build output.
            fileContents = "";
            for (i = 0; (path = require.buildFilePaths[i]); i++) {
                fileContents += fileUtil.readFile(path);
                buildFileContents += path.replace(config.dir, "") + "\n";
                //Some files may not have declared a require module, and if so,
                //put in a placeholder call so the require does not try to load them
                //after the layer is processed.
                placeHolderModName = require.buildFileToModule[path];
                //If we have a name, but no defined module, then add in the placeholder.
                if (placeHolderModName && !require.modulesWithNames[placeHolderModName]) {
                    fileContents += 'require.def("' + placeHolderModName + '", function(){});\n';
                }
            }

            //Remove any require.resume calls, then add one at the end of
            //the whole file, but only if there were files written out, besides
            //the require.js and plugin files. Include a require.pause() call at
            //the top, but in some cases when require.js is not added to the file
            //in this build pass, it may already be there. So always add it with a
            //guard around the pause() call. Multiple pause() calls are OK, but
            //there should only be one resume() call at the end of the file.
            if (require.buildFilePaths.length) {
                fileContents = fileContents.replace(resumeRegExp, "");
                fileContents = "if (typeof require !== 'undefined' && require.pause) {require.pause();}\n" + fileContents + "\nrequire.resume();\n";
            }

            //Add the require file contents to the head of the file.
            fileContents = (requireContents ? requireContents + "\n" : "") + fileContents;

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

    //Do CSS optimizations
    if (config.optimizeCss && config.optimizeCss !== "none") {
        optimizeCss(config.dir, config.optimizeCss, config.cssImportIgnore);
    }

}(arguments));
