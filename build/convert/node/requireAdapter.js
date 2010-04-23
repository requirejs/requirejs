/**
 * @license RequireJS requireAdapter Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint nomen: false */
/*global require: false, process: false */

//>>includeStart("useStrict", pragmas.useStrict);
"use strict";
//>>includeEnd("useStrict");

/*INSERT REQUIREJS HERE*/

(function () {
    /*INSERT PROTECTED CONTENT HERE*/

    var natives = process.binding('natives'),
        isDebug = global.__requireIsDebug;

    //TODO: make this async. Using sync now to cheat to get to a bootstrap.
    require.load = function (moduleName, contextName) {
        var url = require.nameToUrl(moduleName, null, contextName),
            context = require.s.contexts[contextName],
            content;

        //isDone is used by require.ready()
        require.s.isDone = false;

        //Indicate a the module is in process of loading.
        context.loaded[moduleName] = false;

        //Load the content for the module. Be sure to first check the natives
        //modules that are burned into node first.
        if (natives[moduleName]) {
            content = natives[moduleName];
        } else {
            content = require._nodeReadFile(url);
        }

        //If a CommonJS module, translate it on the fly.
        //The commonJs module is from build/jslib/commonJs.js
        content = commonJs.convert(moduleName, url, content);

        //TODO: remove when node code is updated:
        //sys has an obsolete circular ref to child_process. Remove it.
        if (moduleName === "sys") {
            content = content.replace(/,\s*"child_process"/, "");
        }

        if (isDebug) {
            logger.trace("RequireJS about to evaluate module: " + moduleName);
        }
        process.compile(content, url);

        //Mark the module loaded.
        context.loaded[moduleName] = true;
    };

    //Do some patch-ups
    logger._sysPrint = global.__requireLog;
    commonJs.useRhino = false;

    //Set useLog to true if some modules do not seem to convert.
    commonJs.useLog = false;
    if (isDebug) {
        commonJs.useLog = true;
        commonJs.logConverted = true;
        global._requirejs_logger = logger;
    }

    require._log = global.__requireLog;
    require._nodeReadFile = global.__requireReadFile;

    delete global.__requireReadFile;
    delete global.__requireLog;
    delete global.__requireIsDebug;
}());


