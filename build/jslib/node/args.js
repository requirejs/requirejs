/**
 * @license Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

'use strict';
/*jslint */
/*global define: false, process: false */

define(function () {
    //Do not return the "node" or "r.js" arguments
    var args = process.argv.slice(2);

    //Account for "debug" passed for r.js.
    if (args[0] === 'debug') {
        args.shift();
    }

    //Take off the script name argument, since the rhino branch does
    //not have it.
    args.shift();

    return args;
});
