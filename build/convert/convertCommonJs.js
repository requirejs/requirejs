/**
 * Converts CommonJS modules to be requirejs compliant modules.
 * 
 * Usage:
 * java -jar ../lib/rhino/js.jar convertCommonJs.js /path/containing/convertCommonJs.js/ path/to/commonjs outputDir
 *
 * For debugger: 
 * java -classpath ../lib/rhino/js.jar org.mozilla.javascript.tools.debugger.Main /path/containing/convertCommonJs.js/ convertCommonJs.js path/to/commonjs outputDir
 *
 */
/*jslint plusplus: false */
/*global load: false, fileUtil: false, logger: false, Packages: false, convert: true */

"use strict";

var myPath = arguments[0],
    commonJsPath = arguments[1],
    savePath = arguments[2],
    prefix = arguments[3];

//Load libs to help
if (myPath.charAt(myPath.length - 1) !== "/") {
    myPath += "/";
}
load(myPath + "../jslib/fileUtil.js");
load(myPath + "../jslib/logger.js");
load(myPath + "../jslib/commonJs.js");

commonJs.convertDir(commonJsPath, savePath, prefix);
