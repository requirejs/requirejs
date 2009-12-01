/*
    Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
    Available via the new BSD license.
    see: http://code.google.com/p/runjs/ for details
*/

/*
 * This file patches run.js to communicate with the build system.
 */

/*jslint nomen: false, plusplus: false */
/*global load: false, run: false, logger: false, setTimeout: true */
"use strict";

//These variables are not contextName-aware since the build should
//only have one context.
run.buildPathMap = {};
run.buildFilePaths = [];

run.load = function (moduleName, contextName) {
    var url = run.convertNameToPath(moduleName, contextName), map;

    //Save the module name to path mapping.
    map = run.buildPathMap[moduleName] = url;

    load(url);

    //Mark the module loaded.
    run._contexts[contextName].loaded[moduleName] = true;
    run.checkLoaded(contextName);
};

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

