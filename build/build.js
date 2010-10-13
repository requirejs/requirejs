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
var require;

(function (args) {
    var requireBuildPath = args[0];
    if (requireBuildPath.charAt(requireBuildPath.length - 1) !== "/") {
        requireBuildPath += "/";
    }
    load(requireBuildPath + "jslib/build.js");
    build(args);

}(Array.prototype.slice.call(arguments)));
