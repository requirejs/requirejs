/**
 * @license RequireJS requireAdapter Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint nomen: false */
/*global require: false, process: false, global: false, logger: false, commonJs: false */

"use strict";

/*INSERT REQUIREJS HERE*/

(function () {
    /*INSERT PROTECTED CONTENT HERE*/

    var natives = process.binding('natives'),
        isDebug = global.__requireIsDebug;

    //TODO: make this async. Using sync now to cheat to get to a bootstrap.
    require.load = function (moduleName, contextName) {
        var url = require.nameToUrl(moduleName, null, contextName),
            context = require.s.contexts[contextName],
            content, dirName;

        //isDone is used by require.ready()
        require.s.isDone = false;

        //Indicate a the module is in process of loading.
        context.loaded[moduleName] = false;

        //Load the content for the module. Be sure to first check the natives
        //modules that are burned into node first.
        if (natives[moduleName]) {
            if (isDebug) {
                logger.trace("RequireJS loading module: " + moduleName + " from Node cache");
            }

            content = natives[moduleName];
        } else {
            if (isDebug) {
                logger.trace("RequireJS loading module: " + moduleName + " at path: " + url);
            }
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

        //Attempt to support __dirname and __filename in node
        dirName = url.split('/');
        dirName.pop();
        if (dirName.length) {
            dirName = dirName.join('/');
        } else {
            dirName = '.';
        }
        content = '(function () { var __dirname = "' + dirName +
                  '"; var __filename = "' + url +
                  '";\n' + content + '\n}());';

        process.compile(content, url);

        //Support anonymous modules.
        require.completeLoad(moduleName, context);
    };

    //Adapter to get text plugin to work.
    require.fetchText = function (url, callback) {
        var content = require._nodeReadFile(url);
        callback(content);
    };

    //Do some patch-ups
    logger._sysPrint = global.__requireLog;
    commonJs.useRhino = false;

    //Set useLog to true if some modules do not seem to convert.
    commonJs.useLog = false;
    if (isDebug) {
        commonJs.useLog = true;
        //Uncomment to try to see converted module code, but seems to be
        //not useful-- only prints a little bit, interferes with other output?
        //commonJs.logConverted = true;
        global._requirejs_logger = logger;
    }

    require._log = global.__requireLog;
    require._nodeReadFile = global.__requireReadFile;

    delete global.__requireReadFile;
    delete global.__requireLog;
    delete global.__requireIsDebug;
}());


