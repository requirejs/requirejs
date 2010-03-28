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
readFile: false, pragma: false, Packages: false, parse: false */
"use strict";

(function () {
    /** Reset state for each build layer pass. */
    require._buildReset = function () {
        //These variables are not contextName-aware since the build should
        //only have one context.
        require.buildPathMap = {};
        require.buildFileToModule = {};
        require.buildFilePaths = [];
        require.loadedFiles = {};
        require.modulesWithNames = {};
        require.existingRequireUrl = "";
    };

    require._buildReset();

    //Override load so that the file paths can be collected.
    require.load = function (moduleName, contextName) {
        /*jslint evil: true */
        var url = require.nameToUrl(moduleName, null, contextName), map,
            contents, i, deps, matchName, matchDeps, depAry,
            invalidDep = false, unquotedMatchName,
            context = require.s.contexts[contextName],
            previouslyDefined = context.defined[moduleName];
        context.loaded[moduleName] = false;

        //Save the module name to path mapping.
        map = require.buildPathMap[moduleName] = url;

        //Load the file contents, process for conditionals, then
        //evaluate it.
        contents = readFile(url);
        contents = pragma.process(url, contents, context.config);

        //Find out if the file contains a require() definition. Need to know
        //this so we can inject plugins right after it, but before they are needed,
        //and to make sure this file is first, so that require.def calls work.
        //This situation mainly occurs when the build is done on top of the output
        //of another build, where the first build may include require somewhere in it.
        if (!require.existingRequireUrl && parse.definesRequire(url, contents)) {
            require.existingRequireUrl = url;
        }

        //Only eval complete contents if asked, or if it is a require extension.
        //Otherwise, treat the module as not safe for execution and parse out
        //the require calls.
        if (!context.config.execModules && moduleName !== "require/text" && moduleName !== "require/i18n") {
            //Only find the require parts with [] dependencies and
            //evaluate those. This path is useful when the code
            //does not follow the strict require pattern of wrapping all
            //code in a require callback.
            contents = parse(url, contents);
        }

        if (contents) {
            //Pause require, since the file might have many modules defined in it
            require.pause();

            eval(contents);

            //At this point, if the module is defined, it means it was a
            //simple module with no dependencies, defined by an object literal,
            //like an i18n bundle. Do this before require.resume() is called
            //to guarantee this is just an object literal.
            if (!previouslyDefined && context.defined[moduleName]) {
                //Call the overridden require.execCb here, defined
                //below, to get the module tracked as module with a real
                //name.
                require.execCb(moduleName);
            }

            //Resume require now that processing of the file has finished.
            require.resume();
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

    //Marks the module as part of the loaded set, and puts
    //it in the right position for output in the build layer,
    //since require() already did the dependency checks and should have
    //called this method already for those dependencies.
    require.execCb = function (name, cb, args) {
        var url = name && require.buildPathMap[name];
        if (url && !require.loadedFiles[url]) {
            require.buildFilePaths.push(url);
            require.loadedFiles[url] = true;
            require.modulesWithNames[name] = true;
        }
    };
}());
