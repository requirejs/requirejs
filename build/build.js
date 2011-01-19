/**
 * @license Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
 * This file will optimize files that can be loaded via require.js into one file.
 * This file needs Rhino to require, and if the Closure compiler is used to minify
 * files, Java 6 is required.
 *
 * Call this file like so:
 * java -jar path/to/js.jar build.js directory/containing/build.js/ build.js
 *
 * General use:
 *
 * Create a build.js file that has the build options you want and pass that
 * build file to this file to do the build. See example.build.js for more information.
 */

/*jslint regexp: false, nomen: false, plusplus: false */
/*global load: false, print: false, quit: false, logger: false,
  fileUtil: false, lang: false, pragma: false, optimize: false, build: false,
  java: false, Packages: false */

"use strict";

debugger;

var requireBuildPath, env;
if (typeof Packages !== 'undefined') {
    env = 'rhino';
    requireBuildPath = arguments[0];
} else if (typeof process !== 'undefined') {
    env = 'node';
    requireBuildPath = process.argv[3];
    //Account for debug being passed to r.js
    if (requireBuildPath.indexOf('build.js') !== -1) {
        requireBuildPath = process.argv[4];
    }
} else if (typeof window !== "undefined" && navigator && document) {
    env = 'browser';
    requireBuildPath = require.s.baseUrl;
}

//Make sure build path ends in a slash.
if (requireBuildPath.charAt(requireBuildPath.length - 1) !== "/") {
    requireBuildPath += "/";
}

if (env === 'rhino') {
    //Load up require.js
    load(requireBuildPath + '../require.js');
    load(requireBuildPath + '../require/rhino.js');
}

require({
    baseUrl: requireBuildPath + 'jslib/',
    //Use a separate context than the default context so that the
    //build can use the default context.
    context: 'build'
},       ['env!env/args', 'build'],
function (args,            build) {
    build(args);
});
