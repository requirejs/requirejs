/**
 * @license RequireJS node Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint regexp: false, strict: false */
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
        path = req('path'),
        vm = req('vm');

    //Clear out the global set by x.js
    nodeRequire = null;

    //Make nodeRequire available off of require, to allow a script to
    //add things to its require.paths for example.
    require.nodeRequire = req;

    //Supply an implementation that allows synchronous get of a module.
    require.get = function (context, moduleName, relModuleMap) {
        if (moduleName === "require" || moduleName === "exports" || moduleName === "module") {
            require.onError(new Error("Explicit require of " + moduleName + " is not allowed."));
        }

        var ret,
            moduleMap = context.makeModuleMap(moduleName, relModuleMap);

        //Normalize module name, if it contains . or ..
        moduleName = moduleMap.fullName;

        if (moduleName in context.defined) {
            ret = context.defined[moduleName];
        } else {
            if (ret === undefined) {
                //Try to dynamically fetch it.
                require.load(context, moduleName, moduleMap.url);
                //The above call is sync, so can do the next thing safely.
                ret = context.defined[moduleName];
            }
        }

        return ret;
    };

    require.load = function (context, moduleName, url) {
        var contents;

        //isDone is used by require.ready()
        require.s.isDone = false;

        //Indicate a the module is in process of loading.
        context.loaded[moduleName] = false;
        context.scriptCount += 1;

        if (path.existsSync(url)) {
            contents = fs.readFileSync(url, 'utf8');
            vm.runInThisContext(contents, url);
        } else {
            define(function () {
                return req(moduleName);
            });
        }

        //Support anonymous modules.
        context.completeLoad(moduleName);
    };
}());