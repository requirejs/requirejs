/**
 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint plusplus: false, strict: false */
/*global define: false */

define(function () {
    var lang = {
        backSlashRegExp: /\\/g,
        ostring: Object.prototype.toString,

        isArray: Array.isArray ? Array.isArray : function (it) {
            return lang.ostring.call(it) === "[object Array]";
        },

        /**
         * Simple function to mix in properties from source into target,
         * but only if target does not already have a property of the same name.
         */
        mixin: function (target, source, override) {
            //Use an empty object to avoid other bad JS code that modifies
            //Object.prototype.
            var empty = {}, prop;
            for (prop in source) {
                if (override || !(prop in target)) {
                    target[prop] = source[prop];
                }
            }
        },

        delegate: (function () {
            // boodman/crockford delegation w/ cornford optimization
            function TMP() {}
            return function (obj, props) {
                TMP.prototype = obj;
                var tmp = new TMP();
                TMP.prototype = null;
                if (props) {
                    lang.mixin(tmp, props);
                }
                return tmp; // Object
            };
        }())
    };
    return lang;
});
