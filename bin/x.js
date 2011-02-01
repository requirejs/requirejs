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

/*jslint strict: false */
/*global load: true, process: false, Packages: false, require: true */

var console;
(function (args, loadFunc) {

    var requireBuildPath, fileName, env, fs, exec,
        load = typeof loadFunc !== 'undefined' ? loadFunc : null;

    if (typeof Packages !== 'undefined') {
        env = 'rhino';
        requireBuildPath = args[0];
        fileName = args[1];
        exec = function (string, name) {
            return eval(string);
        };

        if (typeof console === 'undefined') {
            console = {
                log: function () {
                    print.apply(undefined, arguments);
                }
            };
        }
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

        exec = function (string, name) {
            return process.compile(string, name);
        }
        requireBuildPath = process.argv[2];
        fileName = process.argv[3];
    }

    //Make sure build path ends in a slash.
    if (requireBuildPath.charAt(requireBuildPath.length - 1) !== "/") {
        requireBuildPath += "/";
    }

    //Actual base directory is up one directory from this script.
    requireBuildPath += '../';

    load(requireBuildPath + 'require.js');
    load(requireBuildPath + 'require/' + env + '.js');
    exec("require({" +
        "baseUrl: '" + requireBuildPath + "build/jslib/'," +
        "paths: {" +
        "    require: '../../require'" +
        "}," +
        "argsHasRequirePath: true" +
    "})", 'bootstrap');

    load(fileName);

}((typeof Packages !== 'undefined' ? arguments : []), (typeof load !== 'undefined' ? load: undefined)));
