/**
 * @license RequireJS jsonp Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint nomen: false, plusplus: false */
/*global require: false, setTimeout: false */
"use strict";

(function () {
    var countId = 0;

    //A place to hold callback functions
    require._jsonp = {};

    require.plugin({
        prefix: "jsonp",

        /**
         * This callback is prefix-specific, only gets called for this prefix
         */
        require: function (name, deps, callback, context) {
            //No-op, require never gets these jsonp items, they are always
            //a dependency, see load for the action.
        },

        /**
         * Called when a new context is defined. Use this to store
         * context-specific info on it.
         */
        newContext: function (context) {
            require.mixin(context, {
                jsonpWaiting: []
            });
        },

        /**
         * Called when a dependency needs to be loaded.
         */
        load: function (name, contextName) {
            //Name has format: some/url?param1=value1&callback=?
            //where the last question mark indicates where the jsonp callback
            //function name needs to go.
            var index = name.indexOf("?"),
                url = name.substring(0, index),
                params = name.substring(index + 1, name.length),
                context = require.s.contexts[contextName],
                data = {
                    name: name
                },
                funcName = "f" + (countId++),
                head = require.s.head,
                node = head.ownerDocument.createElement("script");

            //Create JSONP callback function
            require._jsonp[funcName] = function (value) {
                data.value = value;
                context.loaded[name] = true;
                //Use a setTimeout for cleanup because some older IE versions vomit
                //if removing a script node while it is being evaluated.
                setTimeout(function () {
                    head.removeChild(node);
                    delete require._jsonp[funcName];
                }, 15);
            };

            //Hold on to the data for later dependency resolution in orderDeps.
            context.jsonpWaiting.push(data);

            //Build up the full JSONP URL
            url = require.nameToUrl(url, "?", contextName);
            //nameToUrl call may or may not have placed an ending ? on the URL,
            //be sure there is one and add the rest of the params.
            url += (url.indexOf("?") === -1 ? "?" : "") + params.replace("?", "require._jsonp." + funcName);

            context.loaded[name] = false;
            node.type = "text/javascript";
            node.charset = "utf-8";
            node.src = url;

            //Use async so Gecko does not block on executing the script if something
            //like a long-polling comet tag is being run first. Gecko likes
            //to evaluate scripts in DOM order, even for dynamic scripts.
            //It will fetch them async, but only evaluate the contents in DOM
            //order, so a long-polling script tag can delay execution of scripts
            //after it. But telling Gecko we expect async gets us the behavior
            //we want -- execute it whenever it is finished downloading. Only
            //Helps Firefox 3.6+
            node.async = true;

            head.appendChild(node);
        },

        /**
         * Called when the dependencies of a module are checked.
         */
        checkDeps: function (name, deps, context) {
            //No-op, checkDeps never gets these jsonp items, they are always
            //a dependency, see load for the action.
        },

        /**
         * Called to determine if a module is waiting to load.
         */
        isWaiting: function (context) {
            return !!context.jsonpWaiting.length;
        },

        /**
         * Called when all modules have been loaded.
         */
        orderDeps: function (context) {
            //Clear up state since further processing could
            //add more things to fetch.
            var i, dep, waitAry = context.jsonpWaiting;
            context.jsonpWaiting = [];
            for (i = 0; (dep = waitAry[i]); i++) {
                context.defined[dep.name] = dep.value;
            }
        }
    });
}());
