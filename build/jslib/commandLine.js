/**
 * @license RequireJS Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint */
/*global Packages: false */
"use strict";

var commandLine = {};
(function () {
    var runtime = Packages.java.lang.Runtime.getRuntime();

    /**
     * Executes a command on the command line. May not work right in
     * Windows environments, except maybe via something like cygwin.
     * @param {String} command the command to run on the command line.
     */
    commandLine.exec = function (command) {
        var process = runtime.exec(["/bin/sh", "-c", command]);
        process.waitFor();
    };
}());
