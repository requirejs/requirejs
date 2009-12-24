/*
    Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
    Available via the new BSD license.
    see: http://code.google.com/p/runjs/ for details
*/

/*
 * This file patches run.js to communicate with the build system.
 */

/*jslint nomen: false, plusplus: false */
/*global load: false, run: false, logger: false, setTimeout: true,
readFile: false, processPragmas: false */
"use strict";

//These variables are not contextName-aware since the build should
//only have one context.
run.buildPathMap = {};
run.buildFilePaths = [];

//Override load so that the file paths can be collected.
run.load = function (moduleName, contextName) {
    /*jslint evil: true */
    var url = run.convertNameToPath(moduleName, contextName), map,
        contents,
        context = run.s.contexts[contextName];
    context.loaded[moduleName] = false;

    //Save the module name to path mapping.
    map = run.buildPathMap[moduleName] = url;

    //Load the file contents, process for conditionals, then
    //evaluate it.
    contents = readFile(url);
    contents = processPragmas(url, contents, context.config.pragmas);
    eval(contents);

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

