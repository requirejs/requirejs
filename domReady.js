/**
 * @license RequireJS domReady 0.1.0 Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint strict: false, plusplus: false */
/*global require: false, define: false, window: false, clearInterval: false,
  document: false, self: false, setInterval: false */

(function () {
    define(function () {
        var isBrowser = typeof window !== "undefined" && window.document,
            isPageLoaded = !isBrowser,
            doc = isBrowser ? document : null,
            readyCalls = [],
            readyLoaderCalls = [],
            //Old on to the old resourcesReady/domReady: there could be multiple
            //domReady listeners, one per requirejs context.
            oldResourcesReady = require.resourcesReady,
            oldDomReady = require.domReady;

        function runCallbacks(callbacks) {
            for (var i = 0, callback; (callback = callbacks[i]); i++) {
                callback(doc);
            }
        }

        /**
         * Internal function that calls back any ready functions. If you are
         * integrating RequireJS with another library without require.ready support,
         * you can define this method to call your page ready code instead.
         */
        function callReady() {
            var callbacks = readyCalls,
                loaderCallbacks = readyLoaderCalls;

            if (isPageLoaded) {
                //Call the DOM ready callbacks
                if (callbacks.length) {
                    readyCalls = [];
                    runCallbacks(callbacks);
                }

                //Now handle DOM ready + loader ready callbacks.
                if (require.resourcesLoaded && loaderCallbacks.length) {
                    readyLoaderCalls = [];
                    runCallbacks(loaderCallbacks);
                }
            }
        }

        /** START OF PUBLIC API **/

        /**
         * Registers a callback for DOM ready. If DOM is already ready, the
         * callback is called immediately.
         * @param {Function} callback
         */
        function domReady(callback) {
            if (isPageLoaded) {
                callback();
            } else {
                readyCalls.push(callback);
            }
            return domReady;
        }

        /**
         * Callback that waits for DOM ready as well as any outstanding
         * loader resources. Useful when there are implicit dependencies.
         * This method should be avoided, and always use explicit
         * dependency resolution, with just regular DOM ready callbacks.
         * The callback passed to this method will be called immediately
         * if the DOM and loader are already ready.
         * @param {Function} callback
         */
        domReady.waitForResources = function (callback) {
            if (isPageLoaded && require.resourcesLoaded) {
                callback();
            } else {
                readyLoaderCalls.push(callback);
            }
            return domReady;
        };

        /**
         * Add a method to require to get callbacks if there are loader resources still
         * being loaded. If so, then hold off calling "waitForResources" callbacks.
         *
         * @param {Boolean} isReady: pass true if all resources have been loaded.
         */
        if ('resourcesReady' in require) {
            require.resourcesReady = function (isReady) {
                //Call the old function if it is around.
                if (oldResourcesReady) {
                    oldResourcesReady(isReady);
                }

                if (isReady) {
                    callReady();
                }
            };
        }

        if (require.resourcesLoaded) {
            require.resourcesReady(true);
        }

        if ('domReady' in require) {
            require.domReady = function () {
                if (oldDomReady) {
                    oldDomReady();
                }

                isPageLoaded = true;
                callReady();
            };
        }

        //If DOMContentLoaded has already been reached by the loader,
        //then update internal state.
        if (require.domLoaded) {
            require.domReady();
        }

        domReady.version = '0.1.0';

        /**
         * Loader Plugin API method
         */
        domReady.load = function (name, req, onLoad, config) {
            if (config.isBuild) {
                onLoad(null);
            } else {
                domReady(onLoad);
            }
        };

        /** END OF PUBLIC API **/


        return domReady;
    });
}());
