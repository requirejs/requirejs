/**
 * @license RequireJS Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint plusplus: false, regexp: false */
/*global Packages: false, logger: false, fileUtil: false */
"use strict";

var commonJs = {
    depRegExp: /require\s*\(\s*["']([\w-_\.\/]+)["']\s*\)/g,

    //Set this to false in non-rhino environments. If rhino, then it uses
    //rhino's decompiler to remove comments before looking for require() calls,
    //otherwise, it will use a crude regexp approach to remove comments. The
    //rhino way is more robust, but he regexp is more portable across environments.
    useRhino: true,

    //Set to false if you do not want this file to log. Useful in environments
    //like node where you want the work to happen without noise.
    useLog: true,

    //Set to true to see full converted module contents logged to output.
    logConverted: false,

    convertDir: function (commonJsPath, savePath, prefix) {
        //Normalize prefix
        prefix = prefix ? prefix + "/" : "";

        var fileList, i,
            jsFileRegExp = /\.js$/,
            fileName, moduleName, convertedFileName, fileContents;

        //Get list of files to convert.
        fileList = fileUtil.getFilteredFileList(commonJsPath, /\w/, true);
        
        //Normalize on front slashes and make sure the paths do not end in a slash.
        commonJsPath = commonJsPath.replace(/\\/g, "/");
        savePath = savePath.replace(/\\/g, "/");
        if (commonJsPath.charAt(commonJsPath.length - 1) === "/") {
            commonJsPath = commonJsPath.substring(0, commonJsPath.length - 1);
        }
        if (savePath.charAt(savePath.length - 1) === "/") {
            savePath = savePath.substring(0, savePath.length - 1);
        }

        //Cycle through all the JS files and convert them.
        if (!fileList || !fileList.length) {
            if (commonJsPath === "convert") {
                //A request just to convert one file.
                logger.trace('\n\n' + commonJs.convert(savePath, fileUtil.readFile(savePath)));
            } else {
                logger.error("No files to convert in directory: " + commonJsPath);
            }
        } else {
            for (i = 0; (fileName = fileList[i]); i++) {
                convertedFileName = fileName.replace(commonJsPath, savePath);

                //Handle JS files.
                if (jsFileRegExp.test(fileName)) {
                    moduleName = fileName.replace(commonJsPath + "/", "").replace(/\.js$/, "");
        
                    fileContents = fileUtil.readFile(fileName);
                    fileContents = commonJs.convert(prefix + moduleName, fileName, fileContents);
                    fileUtil.saveUtf8File(convertedFileName, fileContents);
                } else {
                    //Just copy the file over.
                    fileUtil.copyFile(fileName, convertedFileName, true);
                }
            }
        }
    },

    /**
     * Removes the comments from a string. Uses a more robust method if
     * Rhino is available, otherwise a cruder regexp is used. If the regexp
     * is used, then the contents may not be executable, but hopefully good
     * enough to use to find require() calls.
     * 
     * @param {String} fileContents
     * @param {String} fileName mostly used for informative reasons if an error.
     * 
     * @returns {String} a string of JS with comments removed.
     */
    removeComments: function (fileContents, fileName) {
        var context, script;
        if (commonJs.useRhino) {
            context = Packages.org.mozilla.javascript.Context.enter();
            script = context.compileString(fileContents, fileName, 1, null);
            return String(context.decompileScript(script, 0));
        } else {
            return fileContents.replace(/(\/\*([\s\S]*?)\*\/|\/\/(.*)$)/mg, "");
        }
    },

    /**
     * Regexp for testing if there is already a require.def call in the file,
     * in which case do not try to convert it.
     */
    defRegExp: /(require\s*\.\s*def|define)\s*\(/,

    /**
     * Regexp for testing if there is a require([]) or require(function(){})
     * call, indicating the file is already in requirejs syntax.
     */
    rjsRegExp: /require\s*\(\s*(\[|function)/,

    /**
     * Does the actual file conversion.
     *
     * @param {String} moduleName the name of the module to use for the
     * define() call.
     * 
     * @param {String} fileName the name of the file.
     * 
     * @param {String} fileContents the contents of a file :)
     *
     * @returns {String} the converted contents
     */
    convert: function (moduleName, fileName, fileContents) {
        //Strip out comments.
        if (commonJs.useLog) {
            logger.trace("fileName: " + fileName);
        }
        try {
            var i, deps = [], depName, origDepName, part, pathConverted = {},
                prop, reqRegExp, match,
                //Remove comments
                tempContents = commonJs.removeComments(fileContents, fileName),
                baseName = moduleName.split("/");

            //First see if the module is not already RequireJS-formatted.
            if (commonJs.defRegExp.test(tempContents) || commonJs.rjsRegExp.test(tempContents)) {
                return fileContents;
            }

            //Set baseName to be one directory higher than moduleName.
            baseName.pop();
    
            //Reset the regexp to start at beginning of file. Do this
            //since the regexp is reused across files.
            commonJs.depRegExp.lastIndex = 0;

            //Find dependencies in the code that was not in comments.
            while ((match = commonJs.depRegExp.exec(tempContents))) {
                depName = match[1];
                if (commonJs.useLog) {
                    logger.trace("  " + depName);
                }
                if (depName) {
                    deps.push('"' + depName + '"');
                }
            }

            //Construct the wrapper boilerplate.
            fileContents = 'define(["require", "exports", "module"' +
                   (deps.length ? ', ' + deps.join(",") : '') + '], ' +
                   'function(require, exports, module) {\n' +
                   (commonJs.logConverted ? 'global._requirejs_logger.trace("Evaluating module: ' + moduleName + '");\n' : "") +
                   fileContents +
                   '\n});\n';
        } catch (e) {
            logger.error("COULD NOT CONVERT: " + fileName + ", so skipping it. Error was: " + e);
            return fileContents;
        }

        if (commonJs.logConverted) {
            logger.trace("\nREQUIREJS CONVERTED MODULE: " + moduleName + "\n\n" + fileContents + "\n");
        }
        return fileContents;
    }
};