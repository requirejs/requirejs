/**
 * @license Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
 * This script will create a new directory to use for a RequireJS-based node
 * project.
 *
 * Call this file like so:
 * java -jar path/to/js.jar create.js directory/containing/create.js/ path/to/node/lib path/for/new/project
 */

/*jslint */
/*global  load: false, fileUtil: false, commandLine: false, java: false */
"use strict";

(function (args) {
    var myPath = args[0],
        nodeLibPath = args[1],
        projectPath = args[2],
        libNameRegExp = /\/([^\/]+)\.js$/,
        files, contents = "", fixContents;

    if (myPath.charAt(myPath.length - 1) !== "/") {
        myPath += "/";
    }
    if (projectPath.charAt(projectPath.length - 1) !== "/") {
        projectPath += "/";
    }

    load(myPath + "../../jslib/fileUtil.js");
    load(myPath + "../../jslib/logger.js");
    load(myPath + "../../jslib/commandLine.js");

    //Create lib folder to hold require.js and converted node lib js files.
    fileUtil.copyFile(myPath + "rjs", projectPath + "rjs");
    fileUtil.copyFile(myPath + "../../../require.js", projectPath + "lib/require.js");
    fileUtil.copyDir(myPath + "../../../require", projectPath + "lib/require", /\w/);

    //Convert node files
    logger.trace("java -jar " + myPath +
                     "../../lib/rhino/js.jar " + myPath + "../convertCommonJs.js "
                     + myPath + "../ " + nodeLibPath +
                     " " + projectPath + "lib");
    commandLine.exec("java -jar " + myPath +
                     "../../lib/rhino/js.jar " + myPath + "../convertCommonJs.js "
                     + myPath + "../ " + nodeLibPath +
                     " " + projectPath + "lib");    

    //Some cleanup on the module conversion.
    //Fix an obsolute circular ref in sys
    fixContents = fileUtil.readFile(projectPath + "lib/sys.js");
    fixContents = fileUtil.saveFile(projectPath + "lib/sys.js",
                                    fixContents.replace(/,\s*"child_process"/, ""));

    //Assert cannot be converted via rhino since it uses exports.throws, and
    //rhino does not like the use of the throws word, so manually do the wrapper.
    //TODO: this is a bit fragile, assumes dependencies.
    fixContents = fileUtil.readFile(projectPath + "lib/assert.js");
    fixContents = fileUtil.saveFile(projectPath + "lib/assert.js",
                                    'require.def("assert", ["require", "exports", "module"], function(require, exports, module) {\n' +
                                    fixContents +
                                    '\n});');

    //Create the paths.cfg file
    files = fileUtil.getFilteredFileList(projectPath, /\.js$/, true);
    files.forEach(function (file) {
        var name = libNameRegExp.exec(file)[1];
        contents += (contents ? ",\n" : "") + "'" + name + "': 'lib/" + name + "'";
    });
    fileUtil.saveFile(projectPath + 'lib/paths.cfg', 'require({paths: {\n' + contents + '\n}});');

    //Make sure the index.js is there.
    if (!(new java.io.File(projectPath + "index.js")).exists()) {
        fileUtil.copyFile(myPath + "index.js", projectPath + "index.js");
    }

}(Array.prototype.slice.call(arguments)));
