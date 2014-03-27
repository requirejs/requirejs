/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/

    // The maps API object to export
var mapsAPI,

    // Callback for the external maps API
    cbMapsAPI = (function () {
        function callback() {
            callback.init(true);
        }

        callback.loaded = false;

        callback.init = function (loaded, asyncExports) {
            if (loaded) {
                callback.loaded = true;
            }
            if (asyncExports) {
                callback.define = function () {
                    // Clear callback
                    callback = null;

                    // Run async exports
                    asyncExports(mapsAPI);
                };
            }
            if (callback.define && callback.loaded) {
                callback.define();
            }
        };

        return callback;
    }());

// External map API like from google don't support AMD.
// The only way to get the ready state is an globally defined callback.
// The name of the callback has to be provide by an url get argument
//
// This module provides the ready callback for the external maps API,
// and it uses asynchronous exports to provide the API object in an AMD way.
define("asyncMaps", ["require", "exports", "module"], function (require, exports, module) {
    // Init callback with the asynchronous exports handle
    cbMapsAPI.init(false, module.async());

    // Load the external maps API
    require(["./externalMapsAPI.js?callback=cbMapsAPI"]);
});