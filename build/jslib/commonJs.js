/**
 * @license RequireJS Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint plusplus: false, regexp: false, strict: false */
/*global define: false, console: false */

define(['env!env/file', 'uglifyjs/index'], function (file, uglify) {
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

        convertDir: function (commonJsPath, savePath) {
            var fileList, i,
                jsFileRegExp = /\.js$/,
                fileName, convertedFileName, fileContents;

            //Get list of files to convert.
            fileList = file.getFilteredFileList(commonJsPath, /\w/, true);

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
                if (commonJs.useLog) {
                    if (commonJsPath === "convert") {
                        //A request just to convert one file.
                        console.log('\n\n' + commonJs.convert(savePath, file.readFile(savePath)));
                    } else {
                        console.log("No files to convert in directory: " + commonJsPath);
                    }
                }
            } else {
                for (i = 0; (fileName = fileList[i]); i++) {
                    convertedFileName = fileName.replace(commonJsPath, savePath);

                    //Handle JS files.
                    if (jsFileRegExp.test(fileName)) {
                        fileContents = file.readFile(fileName);
                        fileContents = commonJs.convert(fileName, fileContents);
                        file.saveUtf8File(convertedFileName, fileContents);
                    } else {
                        //Just copy the file over.
                        file.copyFile(fileName, convertedFileName, true);
                    }
                }
            }
        },

        /**
         * Removes the comments from a string.
         *
         * @param {String} fileContents
         * @param {String} fileName mostly used for informative reasons if an error.
         *
         * @returns {String} a string of JS with comments removed.
         */
        removeComments: function (fileContents, fileName) {
            //Uglify's ast generation removes comments, so just convert to ast,
            //then back to source code to get rid of comments.
            return uglify.uglify.gen_code(uglify.parser.parse(fileContents), true);
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
         * @param {String} fileName the name of the file.
         *
         * @param {String} fileContents the contents of a file :)
         *
         * @param {Boolean} skipDeps if true, require("") dependencies
         * will not be searched, but the contents will just be wrapped in the
         * standard require, exports, module dependencies. Only usable in sync
         * environments like Node where the require("") calls can be resolved on
         * the fly.
         *
         * @returns {String} the converted contents
         */
        convert: function (fileName, fileContents, skipDeps) {
            //Strip out comments.
            try {
                var deps = [], depName, match,
                    //Remove comments
                    tempContents = commonJs.removeComments(fileContents, fileName);

                //First see if the module is not already RequireJS-formatted.
                if (commonJs.defRegExp.test(tempContents) || commonJs.rjsRegExp.test(tempContents)) {
                    return fileContents;
                }

                //Reset the regexp to start at beginning of file. Do this
                //since the regexp is reused across files.
                commonJs.depRegExp.lastIndex = 0;

                if (!skipDeps) {
                    //Find dependencies in the code that was not in comments.
                    while ((match = commonJs.depRegExp.exec(tempContents))) {
                        depName = match[1];
                        if (depName) {
                            deps.push('"' + depName + '"');
                        }
                    }
                }

                //Construct the wrapper boilerplate.
                fileContents = 'define(["require", "exports", "module"' +
                       (deps.length ? ', ' + deps.join(",") : '') + '], ' +
                       'function(require, exports, module) {\n' +
                       fileContents +
                       '\n});\n';
            } catch (e) {
                console.log("COULD NOT CONVERT: " + fileName + ", so skipping it. Error was: " + e);
                return fileContents;
            }

            return fileContents;
        }
    };

    return commonJs;
});
