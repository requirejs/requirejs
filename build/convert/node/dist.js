/**
 * @license Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
 * This script will create the final r.js file used in node projects to use
 * RequireJS.
 *
 * Call this file like so:
 * java -jar ../../lib/rhino/js.jar dist.js
 */

/*jslint */
/*global load: false, fileUtil: false */
"use strict";

load("../../jslib/logger.js");
load("../../jslib/fileUtil.js");

/**
 * Escapes a string so it is safe as a JS string
 * Taken from Dojo's buildUtil.jsEscape
 * @param {String} str
 * @returns {String}
 */
function jsEscape(str) {
    return ('"' + str.replace(/(["\\])/g, '\\$1') + '"'
        ).replace(/[\f]/g, "\\f"
        ).replace(/[\b]/g, "\\b"
        ).replace(/[\n]/g, "\\n"
        ).replace(/[\t]/g, "\\t"
        ).replace(/[\r]/g, "\\r"); // string
}

var injected = [
        fileUtil.readFile("../../jslib/logger.js"),
        fileUtil.readFile("../../jslib/commonJs.js")
    ].join("\n"),

    requirejs = [
        fileUtil.readFile("../../../require.js"),
        fileUtil.readFile("../../../require/i18n.js"),
        fileUtil.readFile("../../../require/text.js")
    ].join("\n");

    adapter = fileUtil.readFile("requireAdapter.js"),
    r = fileUtil.readFile("r-source.js");
    
//Inject files into requireAdapter.
adapter = jsEscape(adapter.replace(/\/\*INSERT REQUIREJS HERE\*\//, requirejs)
                 .replace(/\/\*INSERT PROTECTED CONTENT HERE\*\//, injected));

//Now inject requireAdapter as a string in the r.js file
r = r.replace(/'\/\*INSERT STRING HERE\*\/'/, adapter.replace(/['\r\n]/g, "\\'"));

fileUtil.saveFile("r.js", r);
