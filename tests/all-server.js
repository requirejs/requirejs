/**
 * Run the tests in Node with this command:
 * node all-rhino.js
 *
 * Run the tests in Rhino with this command:
 * java -jar ../build/lib/rhino/js.jar all-rhino.js
 *
 * To run with debugger:
 * java -classpath ../build/lib/rhino/js.jar org.mozilla.javascript.tools.debugger.Main all-rhino.js *
 */

/*jslint strict: false, evil: true */
/*global Packages: false, process: false, require: true, doh: false */

//A hack to doh to avoid dojo setup stuff in doh/runner.js
var skipDohSetup = true,
    fs, load, env, exec;

(function () {
    if (typeof Packages !== 'undefined') {
        env = 'rhino';
        exec = function (text, fileName) {
            eval(text);
        };
    } else if (typeof process !== 'undefined') {
        env = 'node';

        //Get the fs module via Node's require before it
        //gets replaced. Used in require/node.js
        fs = require('fs');
        load = function (path) {
            return process.compile(fs.readFileSync(path, 'utf8'), path);
        };
        exec = process.compile;
    }

    if (env === 'node') {
        this.nodeRequire = require;
        //Remove the require definition so require.js can create a new one.
        require = null;
    }
}());

//Load require with rhino extension
load("../require.js");
load("../require/" + env + ".js");


//Load the tests.
load("doh/runner.js");
load('doh/_' + env + 'Runner.js');
load("simple-tests.js");
load("circular-tests.js");
load("relative/relative-tests.js");
load("exports/exports-tests.js");
load("anon/anon-tests.js");
load("packages/packages-tests.js");
load("plugins/sync-tests.js");

//Print out the final report
doh.run();
