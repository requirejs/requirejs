/**
 * @license RequireJS Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*
 * This file patches require.js to communicate with the build system.
 */

/*jslint nomen: false, plusplus: false, regexp: false */
/*global load: false, require: false, logger: false, setTimeout: true,
readFile: false, processPragmas: false, Packages: false, parse: false */
"use strict";

(function () {
    //These variables are not contextName-aware since the build should
    //only have one context.
    require.buildPathMap = {};
    require.buildFileToModule = {};
    require.buildFilePaths = [];
    require.loadedFiles = {};
    require.modulesWithNames = {};

    //Override load so that the file paths can be collected.
    require.load = function (moduleName, contextName) {
        /*jslint evil: true */
        var url = require.nameToUrl(moduleName, null, contextName), map,
            contents, i, deps, matchName, matchDeps, depAry,
            invalidDep = false, unquotedMatchName,
            context = require.s.contexts[contextName];
        context.loaded[moduleName] = false;

        //Save the module name to path mapping.
        map = require.buildPathMap[moduleName] = url;

        //Load the file contents, process for conditionals, then
        //evaluate it.
        contents = readFile(url);
        contents = processPragmas(url, contents, context.config);

        //Only eval contents if asked, or if it is a require extension.
        if (context.config.execModules || moduleName === "require/text" || moduleName === "require/i18n") {
            require.pause();
            eval(contents);
            require.resume();
        } else {
            //Only find the require parts with [] dependencies and
            //evaluate those. This path is useful when the code
            //does not follow the strict require pattern of wrapping all
            //code in a require callback.
            contents = parse(url, contents);
            if (contents) {
                //Pause require, since the file might have many modules defined in it
                require.pause();

                eval(contents);

                //Resume require now that processing of the file has finished.
                require.resume();
            }
        }

        //Mark the module loaded.
        context.loaded[moduleName] = true;
        require.checkLoaded(contextName);
    };

    //Override a method provided by require/text.js for loading text files as
    //dependencies.
    require.fetchText = function (url, callback) {
        callback(readFile(url));
    };

    require.execCb = function (name, cb, args) {
        var url = name && require.buildPathMap[name];
        if (url && !require.loadedFiles[url]) {
            require.buildFilePaths.push(url);
            require.loadedFiles[url] = true;
            require.modulesWithNames[name] = true;
        }
    };
}());
