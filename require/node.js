/**
 * @license RequireJS node Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

"use strict";
/*global require: false, define: false, nodeRequire: true, process: false */

/**
 * This adapter assumes that x.js has loaded it and set up
 * some variables. This adapter just allows limited RequireJS
 * usage from within the requirejs directory. The general
 * node adapater is r.js.
 */
(function () {
    var req = nodeRequire,
        fs = req('fs'),
        path = req('path');

    //Clear out the global set by x.js
    nodeRequire = null;


    require.load = function (context, moduleName, url) {
        //isDone is used by require.ready()
        require.s.isDone = false;

        //Indicate a the module is in process of loading.
        context.loaded[moduleName] = false;
        context.scriptCount += 1;

        if (path.existsSync(url)) {
            process.compile(fs.readFileSync(url), url);
        } else {
            define(function () {
                return req(moduleName);
            });
        }

        //Support anonymous modules.
        context.completeLoad(moduleName);
    };

    //Adapter to get text plugin to work.
    require.fetchText = function (url, callback) {
        callback(fs.readFileSync(url, 'utf8'));
    };

}());