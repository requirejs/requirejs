/**
 * @license RequireJS node Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint nomen: false */
/*global require: false */

//>>includeStart("useStrict", pragmas.useStrict);
"use strict";
//>>includeEnd("useStrict");

//TODO: make this async. Using sync now to cheat to get to a bootstrap.
require.load = function (moduleName, contextName) {
    var url = require.nameToUrl(moduleName, null, contextName),
        context = require.s.contexts[contextName];

    //isDone is used by require.ready()
    require.s.isDone = false;

    //Indicate a the module is in process of loading.
    context.loaded[moduleName] = false;

    //This method is created by the rjs bootstrap file for node
    require._nodeExecPath(url);

    //Mark the module loaded.
    context.loaded[moduleName] = true;
};

//Globals set up by the rjs bootstrap
require._nodeExecPath = global.__requireExecPath;
require._log = global.__requireLog;
delete global.__requireExecPath;
delete global.__requireLog;
