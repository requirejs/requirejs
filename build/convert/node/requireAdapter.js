/**
 * @license RequireJS requireAdapter Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint nomen: false, plusplus: false, regexp: false */
/*global require: false, process: false, global: false,
         console: false, logger: false, commonJs: false */

"use strict";

/*INSERT REQUIREJS HERE*/

(function () {
    /*INSERT PROTECTED CONTENT HERE*/

    var natives = process.binding('natives'),
        isDebug = global.__requireIsDebug,
        paths = global.__requirePaths,
        suffixRegExp = /\.js$/,
        extensions = ['.js', '.node', '/index.js', '/index.node'],
        baseContext = require.s.contexts._,
        noUrls = {
            require: true,
            exports: true,
            module: true
        };

    function generateNodeExtension(context, url) {
        var exports = {};

        if (!context.nodeExts) {
            context.nodeExts = {};
        }
        context.nodeExts[url] = exports;

        process.dlopen(url, exports);

        return 'define(function() { return require.s.contexts["' +
                context.contextName +
                '"].nodeExts["' +
                url +
                '"];});';
    }

    require.paths = paths;

    //Override require callback to use exports as the "this", to accomodate
    //some modules that attach to "this". WTF? Specifically,
    //socket.io/support/socket.io-client/lib/io.js.
    require.execCb = function (name, cb, args) {
        return cb.apply(baseContext.defined[name] || null, args);
    };

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

    function tryExtensions(url) {
        var i, ext, tempUrl;
        for (i = 0; (ext = extensions[i]); i++) {
            tempUrl = url + ext;
            if (require._fileExists(tempUrl)) {
                return tempUrl;
            }
        }
        return null;
    }

    require.toModuleUrl = function (context, moduleName, relModuleMap) {
        //Do not bother for modules that will not have URLs.
        if (noUrls[moduleName]) {
            return null;
        }

        //Start with normal logic
        var url = context.nameToUrl(moduleName, null, relModuleMap),
            tempUrl, i, path;

        //Now apply Node lookup logic.
        //Look up source for the module. Use node rules to look for name.js,
        //name.node, name/index.js, name/index.node, then look in node
        //natives cache. Use the natives cache last, to allow for path mapping
        //overrides to native, to allow monkey patching.
        if (require._fileExists(url)) {
            return url;
        }

        //Remove the .js extension.
        url = url.replace(suffixRegExp, '');

        //Try normal url extensions
        if ((tempUrl = tryExtensions(url))) {
            return tempUrl;
        }

        //Now try in require.paths, do this after doing RequireJS logic.
        url = moduleName;
        for (i = 0; i < paths.length; i++) {
            path = paths[i];
            if (path) {
                if ((tempUrl = tryExtensions(path + '/' + url))) {
                    return tempUrl;
                }
            }
        }

        //See if it is in the native list. Do this last to allow
        //for monkey patch overrides.
        if (natives[moduleName]) {
            //a natives module that is burned into node.
            return "nodenative:" + moduleName;
        }

        return null;
    };

    require.load = function (context, moduleName, url) {
        var dirName, content;

        //isDone is used by require.ready()
        require.s.isDone = false;

        if (!url) {
            //Node seems to fail "silently" if it does not find a module
            //for a given path. Was doing the "cannot find module" error
            //but now just log it.
            url = "about:404";
            content = " ";
            if (isDebug) {
                logger.trace(">> RequireJS cannot find file for module: " +
                            moduleName + ", using an empty object.");
            }
        } else if (isDebug) {
            logger.trace("RequireJS loading module: " + moduleName + " at path: " + url);
        }

        if (!content) {
            if (url.indexOf('nodenative:') === 0) {
                content = natives[moduleName];
            } else if (url.indexOf('.node') === url.length - 5) {
                content = generateNodeExtension(context, url);
            } else {
                content = require._nodeReadFile(url);
            }
        }

        //Some node modules have a shell script path thing at the top, remove
        content = content.replace(/^\#\!.*[\r\n]/, '');

        //If a CommonJS module, translate it on the fly.
        //The commonJs module is from build/jslib/commonJs.js
        content = commonJs.convert(moduleName, url, content, true);

        //TODO: remove when node code is updated:
        //sys has an obsolete circular ref to child_process. Remove it.
        if (moduleName === "sys") {
            content = content.replace(/,\s*"child_process"/, "");
        }

        //Attempt to support __dirname and __filename in node
        dirName = url.split('/');
        dirName.pop();
        if (dirName.length) {
            dirName = dirName.join('/');
        } else {
            dirName = '.';
        }
        content = '(function () { var __dirname = "' + dirName +
                  '"; var __filename = "' + url +
                  '";\n' + content + '\n}());';


        //Indicate a the module is in process of loading.
        context.loaded[moduleName] = false;
        context.scriptCount += 1;

        process.compile(content, url);

        //Support anonymous modules.
        context.completeLoad(moduleName);
    };

    //Adapter to get text plugin to work.
    require.fetchText = function (url, callback) {
        var content = require._nodeReadFile(url);
        callback(content);
    };

    //Do some patch-ups
    logger._sysPrint = global.__requireLog;
    commonJs.useRhino = false;

    //Set useLog to true if some modules do not seem to convert.
    commonJs.useLog = false;
    if (isDebug) {
        commonJs.useLog = true;
        //Uncomment to try to see converted module code, but seems to be
        //not useful-- only prints a little bit, interferes with other output?
        //commonJs.logConverted = true;
        global._requirejs_logger = logger;
    }

    require._log = global.__requireLog;
    require._nodeReadFile = global.__requireReadFile;
    require._fileExists = global.__requireFileExists;

    delete global.__requireReadFile;
    delete global.__requireLog;
    delete global.__requireIsDebug;
    delete global.__requireFileExists;
    delete global.__requirePaths;
}());
