/*
    Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
    Available via the new BSD license.
    see: http://code.google.com/p/runjs/ for details
*/

/*
 * This file patches run.js to communicate with the build system.
 */

run.load = function (moduleName, contextName) {
    logger.trace("HERE IN LOAD");
    var url = run.convertNameToPath(moduleName, contextName);
    logger.trace("loading url: " + url);
    load(url);
    //Mark the module loaded.
    run._contexts[contextName].loaded[moduleName] = true;
    run.checkLoaded(contextName);
}

run.callModules = function (contextName, context, orderedModules) {
  var i, module;
  for (i = 0; module = orderedModules[i]; i++) {
      logger.trace("BUILD LAYER MODULE: " + module.name);
  }
}