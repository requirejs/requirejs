/**
 * @license Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint plusplus: false */
/*global require: false, java: false, Packages: false, logger: false, fileUtil: false,
  readFile: false, lang: false */

"use strict";

var optimize;

(function () {
    var JSSourceFilefromCode,
        textDepRegExp = /["'](text)\!([^"']+)["']/g,
        relativeDefRegExp = /(require\s*\.\s*def|define)\s*\(\s*['"]([^'"]+)['"]/g,
        cssImportRegExp = /\@import\s+(url\()?\s*([^);]+)\s*(\))?([\w, ]*)(;)?/g,
        cssUrlRegExp = /\url\(\s*([^\)]+)\s*\)?/g;


    //Bind to Closure compiler, but if it is not available, do not sweat it.
    try {
        JSSourceFilefromCode = java.lang.Class.forName('com.google.javascript.jscomp.JSSourceFile').getMethod('fromCode', [java.lang.String, java.lang.String]);
    } catch (e) {}

    //Helper for closure compiler, because of weird Java-JavaScript interactions.
    function closurefromCode(filename, content) {
        return JSSourceFilefromCode.invoke(null, [filename, content]);
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
        fileName = fileName.replace(lang.backSlashRegExp, "/");
        var endIndex = fileName.lastIndexOf("/"),
            //Make a file path based on the last slash.
            //If no slash, so must be just a file name. Use empty string then.
            filePath = (endIndex !== -1) ? fileName.substring(0, endIndex + 1) : "";

        //Make sure we have a delimited ignore list to make matching faster
        if (cssImportIgnore && cssImportIgnore.charAt(cssImportIgnore.length - 1) !== ",") {
            cssImportIgnore += ",";
        }

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
            importFileName = importFileName.replace(lang.backSlashRegExp, "/");
    
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
                    fixedUrlMatch = fixedUrlMatch.replace(lang.backSlashRegExp, "/");
    
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

    optimize = {
        closure: function (fileName, fileContents, keepLines) {
            var jscomp = Packages.com.google.javascript.jscomp,
                flags = Packages.com.google.common.flags,
                //Fake extern
                externSourceFile = closurefromCode("fakeextern.js", " "),
                //Set up source input
                jsSourceFile = closurefromCode(String(fileName), String(fileContents)),
                options, FLAG_compilation_level, compiler,
                Compiler = Packages.com.google.javascript.jscomp.Compiler;

            logger.trace("Minifying file: " + fileName);

            //Set up options
            options = new jscomp.CompilerOptions();
            options.prettyPrint = keepLines;

            FLAG_compilation_level = flags.Flag.value(jscomp.CompilationLevel.SIMPLE_OPTIMIZATIONS);
            FLAG_compilation_level.get().setOptionsForCompilationLevel(options);

            //Trigger the compiler
            Compiler.setLoggingLevel(Packages.java.util.logging.Level.WARNING);
            compiler = new Compiler();
            compiler.compile(externSourceFile, jsSourceFile, options);
            return compiler.toSource();  
        },
    
        //Inlines text! dependencies.
        inlineText: function (fileName, fileContents) {
            return fileContents.replace(textDepRegExp, function (match, prefix, dep, offset) {
                var parts, modName, ext, strip, content, normalizedName, index,
                    defSegment, defStart, defMatch, tempMatch, defName;

                parts = dep.split("!");
                modName = parts[0];
                ext = "";
                strip = parts[1];
                content = parts[2];

                //Extension is part of modName
                index = modName.lastIndexOf(".");
                if (index !== -1) {
                    ext = modName.substring(index + 1, modName.length);
                    modName = modName.substring(0, index);
                }

                //Adjust the text path to be a full name, not a relative
                //one, if needed.
                normalizedName = modName;
                if (modName.charAt(0) === ".") {
                    //Need to backtrack an arbitrary amount in the file
                    //to find the require.def call
                    //that includes this relative name, to find what path to use
                    //for the relative part.
                    defStart = offset - 1000;
                    if (defStart < 0) {
                        defStart = 0;
                    }
                    defSegment = fileContents.substring(defStart, offset);

                    //Take the last match, the one closest to current text! string.
                    relativeDefRegExp.lastIndex = 0;
                    while ((tempMatch = relativeDefRegExp.exec(defSegment)) !== null) {
                        defMatch = tempMatch;
                    }

                    if (!defMatch) {
                        throw new Error("Cannot resolve relative dependency: " + dep + " in file: " + fileName);
                    }

                    //Take the last match, the one closest to current text! string.
                    defName = defMatch[2];

                    normalizedName = require.normalizeName(modName, defName, require.s.contexts._);
                }

                if (strip !== "strip") {
                    content = strip;
                    strip = null;
                }

                if (content) {
                    //Already an inlined resource, return.
                    return match;
                } else {
                    content = readFile(require.nameToUrl(normalizedName, "." + ext, require.s.ctxName));
                    if (strip) {
                        content = require.textStrip(content);
                    }
                    return "'" + prefix  +
                           "!" + modName +
                           (ext ? "." + ext : "") +
                           (strip ? "!strip" : "") +
                           "!" + jsEscape(content) + "'";
                }
            });
        },

        /**
         * Optimizes a file that contains JavaScript content. It will inline
         * text plugin files and run it through Google Closure Compiler
         * minification, if the config options specify it.
         *
         * @param {String} fileName the name of the file to optimize
         * @param {String} outFileName the name of the file to use for the
         * saved optimized content.
         * @param {Object} config the build config object.
         */
        jsFile: function (fileName, outFileName, config) {
            var doClosure = (config.optimize + "").indexOf("closure") === 0,
                fileContents;

            if (config.inlineText && !optimize.textLoaded) {
                //Make sure text extension is loaded.
                require(["require/text"]);
                optimize.textLoaded = true;
            }

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

            fileUtil.saveUtf8File(outFileName, fileContents);
        },

        /**
         * Optimizes one CSS file, inlining @import calls, stripping comments, and
         * optionally removes line returns.
         * @param {String} fileName the path to the CSS file to optimize
         * @param {String} outFileName the path to save the optimized file.
         * @param {Object} config the config object with the optimizeCss and
         * cssImportIgnore options.
         */
        cssFile: function (fileName, outFileName, config) {
            //Read in the file. Make sure we have a JS string.
            var originalFileContents = fileUtil.readFile(fileName),
                fileContents = flattenCss(fileName, originalFileContents, config.cssImportIgnore),
                startIndex, endIndex;

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
                if (config.optimizeCss.indexOf(".keepLines") === -1) {
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

            fileUtil.saveUtf8File(outFileName, fileContents);
        },

        /**
         * Optimizes CSS files, inlining @import calls, stripping comments, and
         * optionally removes line returns.
         * @param {String} startDir the path to the top level directory
         * @param {Object} config the config object with the optimizeCss and
         * cssImportIgnore options.
         */
        css: function (startDir, config) {
            if (config.optimizeCss.indexOf("standard") !== -1) {
                var i, fileName, startIndex, endIndex, originalFileContents, fileContents,
                    fileList = fileUtil.getFilteredFileList(startDir, /\.css$/, true);
                if (fileList) {
                    for (i = 0; i < fileList.length; i++) {
                        fileName = fileList[i];
                        logger.trace("Optimizing (" + config.optimizeCss + ") CSS file: " + fileName);
                        optimize.cssFile(fileName, fileName, config);
                    }
                }
            }
        }
    };
}());