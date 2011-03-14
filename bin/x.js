/**
 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
 * This is a bootstrap script to allow running RequireJS in the command line
 * in either a Java/Rhino or Node environment. It is best to call this script
 * via the x script that is a sibling to it.
 */

/*jslint strict: false, evil: true */
/*global readFile: true, process: false, Packages: false, require: true
  print: false */

var console;
(function (args, readFileFunc) {

    var fileName, env, fs, vm, exec, rhinoContext,
        requireBuildPath = '',
        jsSuffixRegExp = /\.js$/,
        //This flag is turned to false by the distribution script,
        //because a requireBuildPath is not needed since the scripts
        //are inlined in this script.
        useRequireBuildPath = true,
        argOffset = useRequireBuildPath ? 0 : 1,
        readFile = typeof readFileFunc !== 'undefined' ? readFileFunc : null;

    if (typeof Packages !== 'undefined') {
        env = 'rhino';

        if (useRequireBuildPath) {
            requireBuildPath = args[0];
        }
        fileName = args[1 - argOffset];

        //Set up execution context.
        rhinoContext = Packages.org.mozilla.javascript.ContextFactory.getGlobal().enterContext();

        exec = function (string, name) {
            return rhinoContext.evaluateString(this, string, name, 0, null);
        };

        //Define a console.log for easier logging. Don't
        //get fancy though.
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
        vm = require('vm');
        this.nodeRequire = require;
        require = null;

        readFile = function (path) {
            return fs.readFileSync(path, 'utf8');
        };

        exec = function (string, name) {
            return vm.runInThisContext(string, name);
        };

        if (useRequireBuildPath) {
            requireBuildPath = process.argv[2];
        }

        fileName = process.argv[3 - argOffset];
    }

    //Make sure build path ends in a slash.
    requireBuildPath = requireBuildPath.replace(/\\/g, '/');
    if (requireBuildPath.charAt(requireBuildPath.length - 1) !== "/") {
        requireBuildPath += "/";
    }

    //Actual base directory is up one directory from this script.
    requireBuildPath += '../';

    exec(readFile(requireBuildPath + 'require.js'), 'require.js');

    //These are written out long-form so that they can be replaced by
    //the distribution script.
    if (env === 'rhino') {
        exec(readFile(requireBuildPath + 'adapt/rhino.js'), 'rhino.js');
    } else if (env === 'node') {
        exec(readFile(requireBuildPath + 'adapt/node.js'), 'node.js');
    }

    if (useRequireBuildPath) {
        exec("require({" +
            "baseUrl: '" + requireBuildPath + "build/jslib/'" +
        "})", 'bootstrap');
    }

    //Support a default file name to execute. Useful for hosted envs
    //like Joyent where it defaults to a server.js as the only executed
    //script.
    if (!fileName || !jsSuffixRegExp.test(fileName)) {
        fileName = 'main.js';
    }

    if (!useRequireBuildPath) {
        //Use the file name's directory as the baseUrl if available.
        dir = fileName.replace(/\\/g, '/');
        if (dir.indexOf('/') !== -1) {
            dir = dir.split('/');
            dir.pop();
            dir.join('/');
            exec("require({baseUrl: '" + dir + "'});");
        }
    }

    exec(readFile(fileName), fileName);

}((typeof Packages !== 'undefined' ? arguments : []), (typeof readFile !== 'undefined' ? readFile: undefined)));
