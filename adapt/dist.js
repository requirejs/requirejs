/**
 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
 * This script will create the final r.js file used in node projects to use
 * RequireJS.
 *
 * This file uses Node to run:
 * node dist.js
 */

/*jslint strict: false */
/*global require: false */

/**
 * Escapes a string so it is safe as a JS string
 * Taken from Dojo's buildUtil.jsEscape
 * @param {String} str
 * @returns {String}
 */
function jsEscape(str) {
    return ('"' + str.replace(/(["\\])/g, '\\$1') + '"'
        ).replace(/[\f]/g, '\\f'
        ).replace(/[\b]/g, '\\b'
        ).replace(/[\n]/g, '\\n'
        ).replace(/[\t]/g, '\\t'
        ).replace(/[\r]/g, '\\r'); // string
}

var fs = require('fs'),
    contents = fs.readFileSync('../bin/x.js', 'utf8'),
    loadRegExp = /readFile\(requireBuildPath \+ '([\w\/\.]+)'\)/g;

//Inline file contents
contents = contents.replace(loadRegExp, function (match, fileName) {
    return jsEscape(fs.readFileSync('../' + fileName, 'utf8'));
});

//Switch the behavior to "inlined mode"
contents = contents.replace(/useRequireBuildPath \= true/, 'useRequireBuildPath = false');

fs.writeFileSync('r.js', contents, 'utf8');
