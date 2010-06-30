/**
 * @license RequireJS order Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint nomen: false, plusplus: false */
/*global require: false, window: false, document: false, setTimeout: false */

//>>includeStart("useStrict", pragmas.useStrict);
"use strict";
//>>includeEnd("useStrict");

(function () {
    //Sadly necessary browser inference due to differences in the way
    //that browsers load and execute dynamically inserted javascript
    //and whether the script/cache method works.
    //Currently, Gecko and Opera do not load/fire onload for scripts with
    //type="script/cache" but they execute injected scripts in order
    //unless the 'async' flag is present.
    var supportsInOrderExecution = ((window.opera && Object.prototype.toString.call(window.opera) === "[object Opera]") ||
                               //If Firefox 2 does not have to be supported, then
                               //a better check may be:
                               //('mozIsLocallyAvailable' in window.navigator)
                               ("MozAppearance" in document.documentElement.style)),
        readyRegExp = /^(complete|loaded)$/;

    //Callback used by the type="script/cache" callback that indicates a script
    //has finished downloading.
    function scriptCacheCallback(evt) {
        var node = evt.currentTarget || evt.srcElement,
            context, contextName, moduleName, waiting;

        if (evt.type === "load" || readyRegExp.test(node.readyState)) {
            //Pull out the name of the module and the context.
            contextName = node.getAttribute("data-requirecontext");
            moduleName = node.getAttribute("data-requiremodule");
            context = require.s.contexts[contextName];

            //Mark this cache request as loaded
            context.orderCount -= 1;

            //If no other order cache items are in the queue, evaluate them
            //all now as normal required modules, and reset waiting state.
            if (!context.orderCount) {
                waiting = context.orderWaiting;
                context.orderWaiting = [];
                require(waiting, contextName);
            }

            //Remove this script tag from the DOM
            //Use a setTimeout for cleanup because some older IE versions vomit
            //if removing a script node while it is being evaluated.
            setTimeout(function () {
                node.parentNode.removeChild(node);
            }, 15);
        }
    }

    require.plugin({
        prefix: "order",

        /**
         * This callback is prefix-specific, only gets called for this prefix
         */
        require: function (name, deps, callback, context) {
            //No-op, require never gets these order items, they are always
            //a dependency, see load for the action.
        },

        /**
         * Called when a new context is defined. Use this to store
         * context-specific info on it.
         */
        newContext: function (context) {
            require.mixin(context, {
                orderWaiting: [],
                orderCount: 0
            });
        },

        /**
         * Called when a dependency needs to be loaded.
         */
        load: function (name, contextName) {
            var context = require.s.contexts[contextName],
                url = require.nameToUrl(name, null, contextName);

            //Make sure the async attribute is not set for any pathway involving
            //this script.
            require.s.skipAsync[url] = true;
            if (supportsInOrderExecution) {
                //Just a normal script tag append, but without async attribute
                //on the script.
                require([name], contextName);
            } else {
                //Credits to Steve Souders (in EFWS) and Kyle Simpson (in LABJS)
                //for finding that scripts with type="script/cache" allow scripts
                //to be downloaded into browser cache but not executed. Use that
                //so that subsequent addition of a real type="text/javascript"
                //tag will cause the scripts to be executed immediately in the
                //correct order.
                context.orderWaiting.push(name);
                context.orderCount += 1;
                context.loaded[name] = false;
                require.attach(url, contextName, name, scriptCacheCallback, "script/cache");
            }
        },

        /**
         * Called when the dependencies of a module are checked.
         */
        checkDeps: function (name, deps, context) {
            //No-op, checkDeps never gets these order items, they are always
            //a dependency, see load for the action.
        },

        /**
         * Called to determine if a module is waiting to load.
         */
        isWaiting: function (context) {
            return !!context.orderWaiting.length;
        },

        /**
         * Called when all modules have been loaded. Not needed for this plugin.
         * State is reset as part of scriptCacheCallback. 
         */
        orderDeps: function (context) {
        }
    });
}());
