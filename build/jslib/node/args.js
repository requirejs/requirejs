/**
 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint strict: false */
/*global define: false, process: false */

define(function () {
    //Do not return the "node" or "r.js" arguments
    var args = process.argv.slice(2);

    return args;
});
