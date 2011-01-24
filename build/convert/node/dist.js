/**
 * @license Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
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

/*jslint */
/*global require: false */
'use strict';

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
    injected = [
        fs.readFileSync('../../jslib/commonJs.js', 'utf8')
    ].join('\n'),

    requirejs = [
        fs.readFileSync('../../../require.js', 'utf8'),
        //Make sure to name the modules, otherwise will get mismatched module error.
        fs.readFileSync('../../../require/i18n.js', 'utf8').replace(/define\(/, "define('require/i18n',"),
        fs.readFileSync('../../../require/text.js', 'utf8').replace(/define\(/, "define('require/text',")
    ].join('\n'),

    adapter = fs.readFileSync('requireAdapter.js', 'utf8'),
    r = fs.readFileSync('r-source.js', 'utf8');

//Inject files into requireAdapter.
adapter = jsEscape(adapter.replace(/\/\*INSERT REQUIREJS HERE\*\//, requirejs)
                 .replace(/\/\*INSERT PROTECTED CONTENT HERE\*\//, injected));

//Now inject requireAdapter as a string in the r.js file
r = r.replace(/'\/\*INSERT STRING HERE\*\/'/, adapter.replace(/['\r\n]/g, "\\'"));

fs.writeFileSync('r.js', r, 'utf8');
