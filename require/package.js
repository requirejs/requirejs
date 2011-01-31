/**
 * @license RequireJS order Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint nomen: false, plusplus: false */
/*global require: false, window: false, document: false, setTimeout: false */
"use strict";

(function () {

    require.plugin({
        prefix: "package",

        /**
         * This callback is prefix-specific, only gets called for this prefix
         */
        require: function (name, deps, callback, context) {

            var m = name.match(/^([^\/]*)\/package.json$/);

            if (!m) {
                // no a package.json file
            }

            // get package.json object
            var descriptor = callback();
            
            var libDir = descriptor && descriptor.directories && descriptor.directories.lib;
            if(typeof libDir != "string"){
                libDir = "lib";
            }

            context.config.packages[m[1]] = {
                "name": m[1],
                "main": "main",
                "lib": libDir,
                "location": m[1],
                "mappings": descriptor.mappings
            };
        },

        normalizeName: function (name, baseName, context) {

            // remove and keep plugin handy
            var pluginInfo = name.match(/^(\w+)!(.+?)$/);
            if(pluginInfo && pluginInfo[1]) {
                name = pluginInfo[2];
            }

            // if there is no baseName we are not interested
            if(!baseName) {
                return false;
            }

            // if relative id we don't need to do anything differently
            if (name.charAt(0) === ".") {
                return false;
            }
 
            var nameParts = name.split("/");
            // if id does not have at least two terms we are not interested
            if (nameParts.length==1) {
                return false;
            }

            var baseParts = baseName.split("/");

            // we are not interested if:
            //  * caller's first term is not a registered package
            //  * package does not have any mappigs
            //  * no mapping defined for name's first term
            if (typeof context.config.packages == "undefined" ||
                typeof context.config.packages[baseParts[0]] == "undefined" ||
                typeof context.config.packages[baseParts[0]].mappings == "undefined" ||
                typeof context.config.packages[baseParts[0]].mappings[nameParts[0]] == "undefined") {
                return false;
            }

            return ((pluginInfo && pluginInfo[1])?pluginInfo[1]+"!":"") +
                   context.config.packages[baseParts[0]].mappings[nameParts[0]] + "/" +
                   nameParts.splice(1, nameParts.length).join("/");
        }        
    
    });
}());
