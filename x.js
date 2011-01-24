/**
 * @license Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
 * This is a bootstrap script to allow running RequireJS in the command line
 * in either a Java/Rhino or Node environment. It is best to call this script
 * via the x script that is a sibling to it.
 */

/*jslint regexp: false, nomen: false, plusplus: false */
/*global load: true, process: false, Packages: false, require: true */
"use strict";

(function () {

    var requireBuildPath, fileName, env, fs,
        load = typeof load !== 'undefined' ? load : null;

    if (typeof Packages !== 'undefined') {
        env = 'rhino';
        requireBuildPath = arguments[0];
        fileName = arguments[1];
    } else if (typeof process !== 'undefined') {
        env = 'node';

        //Get the fs module via Node's require before it
        //gets replaced. Used in require/node.js
        fs = require('fs');
        this.nodeRequire = require;
        require = null;

        load = function (path) {
            return process.compile(fs.readFileSync(path, 'utf8'), path);
        };

        requireBuildPath = process.argv[2];
        fileName = process.argv[3];
    }

    //Make sure build path ends in a slash.
    if (requireBuildPath.charAt(requireBuildPath.length - 1) !== "/") {
        requireBuildPath += "/";
    }

    load(requireBuildPath + 'require.js');
    load(requireBuildPath + 'require/' + env + '.js');
    process.compile("require({" +
        "baseUrl: '" + requireBuildPath + "build/jslib/'," +
        "paths: {" +
        "    require: '../../require'" +
        "}" +
    "})", 'bootstrap');

    load(fileName);

}());
