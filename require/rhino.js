/**
 * @license RequireJS rhino Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*global require: false, readFile: false */

/*
TODO: Work out relative paths, that use ./ and such, and allow loading normal
CommonJS modules, by overriding require.get().
*/

/*globals load: false */

//>>includeStart("useStrict", pragmas.useStrict);
"use strict";
//>>includeEnd("useStrict");

require.load = function (moduleName, contextName) {
    var url = require.nameToUrl(moduleName, null, contextName),
        context = require.s.contexts[contextName];

    //isDone is used by require.ready()
    require.s.isDone = false;

    //Indicate a the module is in process of loading.
    context.loaded[moduleName] = false;

    load(url);

    //Mark the module loaded.
    context.loaded[moduleName] = true;
};
