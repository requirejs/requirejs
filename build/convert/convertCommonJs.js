/**
 * Converts CommonJS modules to be requirejs compliant modules.
 * 
 * Usage:
 * java -jar ../lib/rhino/js.jar convertCommonJs.js path/to/commonjs outputDir
 *
 * For debugger: 
 * java -classpath ../lib/rhino/js.jar org.mozilla.javascript.tools.debugger.Main convertCommonJs.js path/to/commonjs outputDir
 *
 */
/*jslint plusplus: false */
/*global load: false, fileUtil: false, logger: false, Packages: false, convert: true */

"use strict";

load("../jslib/fileUtil.js");
load("../jslib/logger.js");

var startTime = (new Date()).getTime(),
    convertTime,
    commonJsPath = arguments[0],
    savePath = arguments[1],
    prefix = arguments[2] ? arguments[2] + "/" : "",
    //Get list of files to convert.
    fileList = fileUtil.getFilteredFileList(commonJsPath, /\w/, true),
    jsFileRegExp = /\.js$/,
    depRegExp = /require\s*\(\s*["']([\w-_\.\/]+)["']\s*\)/g,
    fileName, moduleName, convertedFileName, fileContents,
    i;

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
        logger.trace('\n\n' + convert(savePath, fileUtil.readFile(savePath)));
    } else {
        logger.error("No files to convert in directory: " + commonJsPath);
    }
} else {
    for (i = 0; (fileName = fileList[i]); i++) {
        //Handle JS files.
        if (jsFileRegExp.test(fileName)) {
            convertedFileName = fileName.replace(commonJsPath, savePath);
            moduleName = fileName.replace(commonJsPath + "/", "").replace(/\.js$/, "");

            fileContents = fileUtil.readFile(fileName);
            fileContents = convert(prefix + moduleName, fileName, fileContents);
            fileUtil.saveUtf8File(convertedFileName, fileContents);
        } else {
            //Just copy the file over.
            fileUtil.copyFile(fileName, convertedFileName, true);
        }
    }
}

/**
 * Does the actual file conversion.
 *
 * @param {String} moduleName the name of the module to use for the
 * require.def call.
 * 
 * @param {String} fileName the name of the file.
 * 
 * @param {String} fileContents the contents of a file :)
 */
function convert(moduleName, fileName, fileContents) {
    //Strip out comments.
    logger.trace("fileName: " + fileName);
    try {
        var context = Packages.org.mozilla.javascript.Context.enter(), match,
            //deps will be an array of strings of dependency names.
            i, deps = [], depName, origDepName, part, pathConverted = {},
            prop, reqRegExp,
            script = context.compileString(fileContents, fileName, 1, null),
            //Remove comments
            tempContents = String(context.decompileScript(script, 0)),
            baseName = moduleName.split("/");

        //Set baseName to be one directory higher than moduleName.
        baseName.pop();

        //Reset the regexp to start at beginning of file. Do this
        //since the regexp is reused across files.
        depRegExp.lastIndex = 0;

        //Find dependencies in the code that was not in comments.
        while ((match = depRegExp.exec(tempContents))) {
            depName = match[1];
            logger.trace("  " + depName);
            if (depName) {
                //Adjust any relative paths.
                if (depName.charAt(0) === ".") {
                    origDepName = depName;
                    depName = baseName.concat(depName.split("/"));
                    for (i = 0; (part = depName[i]); i++) {
                        if (part === ".") {
                            depName.splice(i, 1);
                            i -= 1;
                        } else if (part === "..") {
                            depName.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                    depName = depName.join("/");
                    pathConverted[origDepName] = depName;
                }
                deps.push('"' + depName + '"');
            }
        }

        //Convert file content references that used a relative module name
        //reference to be a more complete module name. Note that above we used
        //content that had comments removed, now we are dealing with the original
        //contents with comments, and that is why this is a separate, more expensive
        //pass vs. uses a fileContents.replace() with a function.
        for (prop in pathConverted) {
            if (pathConverted.hasOwnProperty(prop)) {
                reqRegExp = new RegExp('require\\s*\\(\\s*[\'"]' + prop + '[\'"]\\s*\\)', 'g');
                fileContents = fileContents.replace(reqRegExp, 'require("' + pathConverted[prop] + '")');
            }
        }

        //Construct the wrapper boilerplate.
        return 'require.def("' + moduleName + '", ["require", "exports", "module"' +
               (deps.length ? ', ' + deps.join(",") : '') + '], ' +
               'function(require, exports, module) {\n' +
               fileContents +
               '\n});\n';

    } catch (e) {
        logger.error("COULD NOT CONVERT: " + fileName + ", so skipping it. Error was: " + e);
        return fileContents;
    }

    return fileContents;
}
