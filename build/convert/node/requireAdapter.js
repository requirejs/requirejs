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
        isDebug = global.__requireIsDebug,
        suffixRegExp = /\.js$/;

    //Override require callback to use exports as the "this", to accomodate
    //some modules that attach to "this". WTF? Specifically,
    //socket.io/support/socket.io-client/lib/io.js.
    require.execCb = function (name, cb, args) {
        return cb.apply(require.s.contexts[require.s.ctxName].defined[name] || null, args);
    };

    require.get = function (moduleName, contextName, relModuleName) {
        if (moduleName === "require" || moduleName === "exports" || moduleName === "module") {
            require.onError(new Error("Explicit require of " + moduleName + " is not allowed."));
        }
        contextName = contextName || require.s.ctxName;

        var ret, context = require.s.contexts[contextName];

        //Normalize module name, if it contains . or ..
        moduleName = require.normalizeName(moduleName, relModuleName, context);

        ret = context.defined[moduleName];
        if (ret === undefined) {
            //Try to dynamically fetch it.
            require([moduleName], function () {}, contextName, relModuleName);
            //The above call is sync, so can do the next thing safely.
            ret = context.defined[moduleName];
        }
        return ret;
    };

    //Sync environments can allow multiple nested checkLoaded calls since
    //nested dependencies are satisfied immediately.
    require.blockCheckLoaded = false;

    //TODO: make this async. Using sync now to cheat to get to a bootstrap.
    require.load = function (moduleName, contextName) {
        var url = require.nameToUrl(moduleName, null, contextName),
            context = require.s.contexts[contextName],
            content, dirName, indexUrl;

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
            if (require._fileExists(url)) {
                content = require._nodeReadFile(url);
            } else {
                //Maybe it is the goofy index.js thing Node supports.
                indexUrl = url.replace(suffixRegExp, '/index.js');
                if (require._fileExists(indexUrl)) {
                    content = require._nodeReadFile(indexUrl);
                    url = indexUrl;
                } else {
                    //Goofy part, there is at least one module, that does
                    //a try{require('constants')} catch(){}, so need to mark
                    //the module as "loaded" but just undefined, so requirejs
                    //later does not trigger a timeout error.
                    context.loaded[moduleName] = true;
                    context.defined[moduleName] = undefined;
                    throw new Error("RequireJS cannot find file for module: " +
                                    moduleName + " Tried paths: " + url +
                                    ' and ' + indexUrl);
                }
            }
        }

        //If a CommonJS module, translate it on the fly.
        //The commonJs module is from build/jslib/commonJs.js
        content = commonJs.convert(moduleName, url, content, true);

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
    require._fileExists = global.__requireFileExists;

    delete global.__requireReadFile;
    delete global.__requireLog;
    delete global.__requireIsDebug;
    delete global.__requireFileExists;
}());


