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
/*global require: false */
"use strict";

require(['logger', 'env!env/file'], function (logger, file) {

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
            file.readFile("../../jslib/commonJs.js")
        ].join("\n"),

        requirejs = [
            file.readFile("../../../require.js"),
            //Make sure to name the modules, otherwise will get mismatched module error.
            file.readFile("../../../require/i18n.js").replace(/define\(/, 'define("require/i18n",'),
            file.readFile("../../../require/text.js").replace(/define\(/, 'define("require/text",')
        ].join("\n"),

        adapter = file.readFile("requireAdapter.js"),
        r = file.readFile("r-source.js");

    //Inject files into requireAdapter.
    adapter = jsEscape(adapter.replace(/\/\*INSERT REQUIREJS HERE\*\//, requirejs)
                     .replace(/\/\*INSERT PROTECTED CONTENT HERE\*\//, injected));

    //Now inject requireAdapter as a string in the r.js file
    r = r.replace(/'\/\*INSERT STRING HERE\*\/'/, adapter.replace(/['\r\n]/g, "\\'"));

    file.saveFile("r.js", r);
});
