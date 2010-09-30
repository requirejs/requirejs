/**
 * @license RequireJS optional Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 * Adapted by Ruben Daniels / Ajax.org
 */
/*jslint nomen: false, plusplus: false */
/*global require: false, setTimeout: false */
"use strict";

(function () {
    var countId = 0;

    require.plugin({
        prefix: "optional",

        /**
         * This callback is prefix-specific, only gets called for this prefix
         */
        require: function (name, deps, callback, context) {
            //No-op, require never gets these optional items, they are always
            //a dependency, see load for the action.
        },

        /**
         * Called when a new context is defined. Use this to store
         * context-specific info on it.
         */
        newContext: function (context) {
        },

        /**
         * Called when a dependency needs to be loaded.
         */
        load: function (name, contextName) {
        },

        /**
         * Called when the dependencies of a module are checked.
         */
        checkDeps: function (name, deps, context) {
            //No-op, checkDeps never gets these optional items, they are always
            //a dependency, see load for the action.
        },

        /**
         * Called to determine if a module is waiting to load.
         */
        isWaiting: function (context) {
            return false;
        },

        /**
         * Called when all modules have been loaded.
         */
        orderDeps: function (context) {
        }
    });
}());
