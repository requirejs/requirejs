/**
 * @license Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/runjs for details
 */
/*
 * This file patches run.js to communicate with the build system.
 */

/*jslint nomen: false, plusplus: false, regexp: false */
/*global load: false, run: false, logger: false, setTimeout: true,
readFile: false, processPragmas: false */
"use strict";

(function () {
    var runStartRegExp = /(^|\s+|;)run\s*\(/g,
        runDepsRegExp = /run\s*\(\s*(['"][^'"]+['"]\s*,)?\s*(\[[^\]]+])/;

    //These variables are not contextName-aware since the build should
    //only have one context.
    run.buildPathMap = {};
    run.buildFilePaths = [];
    
    //Helper functions for the execModules: false case
    function removeComments(contents) {
        //strips JS comments from a string. Not bulletproof, but does a good enough job
        //for stripping out stuff that is not related to mapping resource dependencies.

        //If we get the contents of the file from Rhino, it might not be a JS
        //string, but rather a Java string, which will cause the replace() method
        //to bomb.
        contents = contents ? contents + "" : "";
        //clobber all comments
        return contents.replace(/(\/\*([\s\S]*?)\*\/|\/\/(.*)$)/mg, "");
    }

    function extractMatchedParens(regexp, fileContents) {
        //Pass in a regexp that includes a start parens: (, and this function will
        //find the matching end parens for that regexp, remove the matches from fileContents,
        //and return an array of the matches found.

        var results = [], startIndex, endPoint,
            matches, matchCount, parenMatch,
            cleanedContent = [],
            previousLastIndex = 0,
            parenRe = /[\(\)]/g;

        regexp.lastIndex = 0;
        parenRe.lastIndex = 0;
        
        while ((matches = regexp.exec(fileContents))) {
            //Find end of the call by finding the matching end paren
            parenRe.lastIndex = regexp.lastIndex;
            matchCount = 1;
            while ((parenMatch = parenRe.exec(fileContents))) {
                if (parenMatch[0] === ")") {
                    matchCount -= 1;
                } else {
                    matchCount += 1;
                }
                if (matchCount === 0) {
                    break;
                }
            }
    
            if (matchCount !== 0) {
                throw "unmatched paren around character " + parenRe.lastIndex + " in: " + fileContents;
            }
    
            // Put the master matching string in the results.
            startIndex = regexp.lastIndex - matches[0].length;
            results.push(fileContents.substring(startIndex, parenRe.lastIndex));
            // add file's fragment from previous console.* match to current match 
            cleanedContent.push(fileContents.substring(previousLastIndex, startIndex));
            
            // Account for ending semicolon if desired.
            endPoint = parenRe.lastIndex;

            previousLastIndex = regexp.lastIndex = endPoint;
    
        }
    
        // add the last matched fragment to the cleaned output
        cleanedContent.push(fileContents.substring(previousLastIndex, fileContents.length));

        return results;
    }


    //Override load so that the file paths can be collected.
    run.load = function (moduleName, contextName) {
        /*jslint evil: true */
        var url = run.convertNameToPath(moduleName, contextName), map,
            contents, matches, i,
            context = run.s.contexts[contextName];
        context.loaded[moduleName] = false;

        //Save the module name to path mapping.
        map = run.buildPathMap[moduleName] = url;

        //Load the file contents, process for conditionals, then
        //evaluate it.
        contents = readFile(url);
        contents = processPragmas(url, contents, context.config.pragmas);

logger.trace("MODULE NAME: " + moduleName);

        //Only eval contents if asked, or if it is a run extension.
        if (context.config.execModules || moduleName === "run/text" || moduleName === "run/i18n") {
            eval(contents);
        } else {
            //Only find the run() parts with [] dependencies and
            //evaluate those. This path is useful when the code
            //does not follow the strict run pattern of wrapping all
            //code in a run callback.
            contents = removeComments(contents);
            matches = extractMatchedParens(runStartRegExp, contents);
            if (matches.length) {
                for (i = 0; match = matches[i]; i++) {
                    deps = runDepsRegExp.exec(match);
                    if (deps) {
                        //If have a module name be sure to track that in the run call.
                        if (deps[1] && deps[2]) {
                            eval('run(' + deps[1] + deps[2] + ');');
                        }
                        //Just call with dependencies.
                        if (deps[2]) {
                            eval('run(' + deps[2] + ');');
                        }
                    }
                }
            }
        }

        //Mark the module loaded.
        context.loaded[moduleName] = true;
        run.checkLoaded(contextName);
    };
    
    //Override a method provided by run/text.js for loading text files as
    //dependencies.
    run.fetchText = function (url, callback) {
        callback(readFile(url));
    };
    
    //Instead of bringing each module into existence, order all the file URLs.
    run.callModules = function (contextName, context, orderedModules) {
        var i, module, loadedFiles = {}, url, def, prop;
        for (i = 0; (module = orderedModules[i]); i++) {
            url = module.name && run.buildPathMap[module.name];
            if (url && !loadedFiles[url]) {
                run.buildFilePaths.push(url);
                loadedFiles[url] = true;
            }
        }
    };

}());
