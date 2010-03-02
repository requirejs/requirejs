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
readFile: false, processPragmas: false, Packages: false */
"use strict";

(function () {
    var requireDepsRegExp = /require(\s*\.\s*def)?\s*\(\s*((['"]([^'"]+)['"])\s*,)?\s*(\[[^\]]+\])?/g,
        quotedStringRegExp = /^\s*['"][^'"]+['"]\s*$/;

    //These variables are not contextName-aware since the build should
    //only have one context.
    require.buildPathMap = {};
    require.buildFileToModule = {};
    require.buildFilePaths = [];
    require.loadedFiles = {};
    require.modulesWithNames = {};

    //Helper functions for the execModules: false case
    function removeComments(fileName, contents) {
        //Use Rhino to strip out comments automatically.
        var context = Packages.org.mozilla.javascript.Context.enter(), script;
        try {
            // Use the interpreter for interactive input (copied this from Main rhino class).
            context.setOptimizationLevel(-1);
    
            script = context.compileString(contents, fileName, 1, null);
            contents = context.decompileScript(script, 0) + "";
        } finally {
            Packages.org.mozilla.javascript.Context.exit();
        }
        return contents;
    }

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
            eval(contents);
        } else {
            //Only find the require parts with [] dependencies and
            //evaluate those. This path is useful when the code
            //does not follow the strict require pattern of wrapping all
            //code in a require callback.
            contents = removeComments(url, contents);

            //Pause require, since the file might have many modules defined in it
            require.pause();

            requireDepsRegExp.lastIndex = 0;
            while ((deps = requireDepsRegExp.exec(contents))) {
                //Validate matched name and deps, if either one is not
                //a JS string (or array of strings for deps), then do
                //not try to use them, since it is a runtime-computed value.

                //If matchName exists, then it is quoted, given the structure
                //of the regexp, which wants to find quotes around the value.
                matchName = deps[3];
                unquotedMatchName = deps[4];
                matchDeps = deps[5];
                if (matchDeps) {
                    depAry = matchDeps.replace(/^\s*\[/, "").replace(/\]\s*$/, "").split(/\s*,\s*/);
                    if (!depAry) {
                        continue;
                    } else {
                        //Go through each dep and see if they are quoted strings.
                        //If not, then skip this match
                        invalidDep = false;
                        for (i = 0; i < depAry.length; i++) {
                            if ((invalidDep = !quotedStringRegExp.test(depAry[i]))) {
                                break;
                            }
                        }
                        if (invalidDep) {
                            continue;
                        }
                    }

                    matchDeps = eval('(' + matchDeps  + ')');
                }

                //If have a module name be sure to track that in the require call.
                if (matchName) {
                    require.modulesWithNames[moduleName] = true;
                    require.def(unquotedMatchName, matchDeps);
                    //eval('require.def(' + matchName + ', ' + matchDeps + ', );');
                } else if (matchDeps) {
                    //Just call with dependencies.
                    require(matchDeps);
                }
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

    require.execCb = function (name, cb, args) {
        var url = name && require.buildPathMap[name];
        if (url && !require.loadedFiles[url]) {
            require.buildFilePaths.push(url);
            require.loadedFiles[url] = true;
            require.modulesWithNames[name] = true;
        }
    };
}());
