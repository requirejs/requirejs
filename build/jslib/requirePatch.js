/**
 * @license RequireJS Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*
 * This file patches require.js to communicate with the build system.
 */

/*jslint nomen: false, plusplus: false, regexp: false, strict: false */
/*global require: false, define: true */

//NOT asking for require as a dependency since the goal is to modify the
//global require below
define([ 'env!env/file', 'pragma', 'parse'],
function (file,           pragma,   parse) {

    var allowRun = true;

    //This method should be called when the patches to require should take hold.
    return function () {
        if (!allowRun) {
            return;
        }
        allowRun = false;

        var layer,
            pluginBuilderRegExp = /(["']?)pluginBuilder(["']?)\s*[=\:]\s*["']([^'"\s]+)["']/,
            oldDef;

        /** Reset state for each build layer pass. */
        require._buildReset = function () {
            var oldContext = require.s.contexts._;

            //Clear up the existing context.
            delete require.s.contexts._;

            //Set up new context, so the layer object can hold onto it.
            require({});

            layer = require._layer = {
                buildPathMap: {},
                buildFileToModule: {},
                buildFilePaths: [],
                loadedFiles: {},
                modulesWithNames: {},
                existingRequireUrl: "",
                context: require.s.contexts._
            };

            //Set up a per-context list of plugins/pluginBuilders.
            layer.context.pluginBuilders = {};
            layer.context._plugins = {};

            //Return the previous context in case it is needed, like for
            //the basic config object.
            return oldContext;
        };

        require._buildReset();

        /**
         * Makes sure the URL is something that can be supported by the
         * optimization tool.
         * @param {String} url
         * @returns {Boolean}
         */
        require._isSupportedBuildUrl = function (url) {
            //Ignore URLs with protocols or question marks, means either network
            //access is needed to fetch it or it is too dynamic. Note that
            //on Windows, full paths are used for some urls, which include
            //the drive, like c:/something, so need to test for something other
            //than just a colon.
            return url.indexOf("://") === -1 && url.indexOf("?") === -1;
        };

        //Override require.def to catch modules that just define an object, so that
        //a dummy require.def call is not put in the build file for them. They do
        //not end up getting defined via require.execCb, so we need to catch them
        //at the require.def call.
        oldDef = require.def;

        //This function signature does not have to be exact, just match what we
        //are looking for.
        define = require.def = function (name, obj) {
            if (typeof name === "string") {
                layer.modulesWithNames[name] = true;
            }
            return oldDef.apply(require, arguments);
        };

        //Add some utilities for plugins/pluginBuilders
        require._readFile = file.readFile;
        require._fileExists = function (path) {
            return file.exists(path);
        };

        //Override load so that the file paths can be collected.
        require.load = function (context, moduleName, url) {
            /*jslint evil: true */
            var contents, pluginBuilderMatch, builderName;

            //Adjust the URL if it was not transformed to use baseUrl.
            if (require.jsExtRegExp.test(moduleName)) {
                url = context.config.dirBaseUrl + url;
            }

            context.loaded[moduleName] = false;
            context.scriptCount += 1;

            //Only handle urls that can be inlined, so that means avoiding some
            //URLs like ones that require network access or may be too dynamic,
            //like JSONP
            if (require._isSupportedBuildUrl(url)) {
                //Save the module name to path  and path to module name mappings.
                layer.buildPathMap[moduleName] = url;
                layer.buildFileToModule[url] = moduleName;

                //Load the file contents, process for conditionals, then
                //evaluate it.
                contents = file.readFile(url);
                contents = pragma.process(url, contents, context.config);

                //Find out if the file contains a require() definition. Need to know
                //this so we can inject plugins right after it, but before they are needed,
                //and to make sure this file is first, so that require.def calls work.
                //This situation mainly occurs when the build is done on top of the output
                //of another build, where the first build may include require somewhere in it.
                if (!layer.existingRequireUrl && parse.definesRequire(url, contents)) {
                    layer.existingRequireUrl = url;
                }

                if (moduleName in context.plugins) {
                    //This is a loader plugin, check to see if it has a build extension,
                    //otherwise the plugin will act as the plugin builder too.
                    pluginBuilderMatch = pluginBuilderRegExp.exec(contents);
                    if (pluginBuilderMatch) {
                        //Load the plugin builder for the plugin contents.
                        builderName = context.normalize(pluginBuilderMatch[3], moduleName);
                        contents = file.readFile(context.nameToUrl(builderName));
                    }

                    //plugins need to have their source evaled as-is.
                    context._plugins[moduleName] = true;
                }

                //Parse out the require and define calls.
                //Do this even for plugins in case they have their own
                //dependencies that may be separate to how the pluginBuilder works.
                if (!context._plugins[moduleName]) {
                    contents = parse(url, contents);
                }

                if (contents) {
                    eval(contents);

                    //Support anonymous modules.
                    context.completeLoad(moduleName);
                }

                // remember the list of dependencies for this layer.O
                layer.buildFilePaths.push(url);
            }

            //Mark the module loaded.
            context.loaded[moduleName] = true;

            //Get a handle on the pluginBuilder
            if (context._plugins[moduleName]) {
                context.pluginBuilders[moduleName] = context.defined[moduleName];
            }
        };

        //This method is called when a plugin specifies a loaded value. Use
        //this to track dependencies that do not go through require.load.
        require.onPluginLoad = function (context, pluginName, name, value) {
            var registeredName = pluginName + '!' + name;
            layer.buildFilePaths.push(registeredName);
            layer.buildFileToModule[registeredName] = registeredName;
            layer.modulesWithNames[registeredName] = true;
        };

        //Marks the module as part of the loaded set, and puts
        //it in the right position for output in the build layer,
        //since require() already did the dependency checks and should have
        //called this method already for those dependencies.
        require.execCb = function (name, cb, args) {
            var url = name && layer.buildPathMap[name];
            if (url && !layer.loadedFiles[url]) {
                layer.loadedFiles[url] = true;
                layer.modulesWithNames[name] = true;
            }
            if (cb.__requireJsBuild || layer.context._plugins[name]) {
                return cb.apply(null, args);
            }
            return undefined;
        };
    };
});
