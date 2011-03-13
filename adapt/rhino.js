/**
 * @license RequireJS rhino Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint strict: false */
/*global require: false, java: false, load: false */

(function () {

    require.load = function (context, moduleName, url) {
        //isDone is used by require.ready()
        require.s.isDone = false;

        //Indicate a the module is in process of loading.
        context.loaded[moduleName] = false;
        context.scriptCount += 1;

        load(url);

        //Support anonymous modules.
        context.completeLoad(moduleName);
    };

}());