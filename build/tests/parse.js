/*jslint plusplus: false */
/*global load: false, doh: false, parse: false */

"use strict";

//Load the file to test.
load("../jslib/parse.js");

doh.register(
    "parse", 
    [
        function require(t) {
            var good1 = "require(['one', 'two'], function(){});",
                bad1 = "require([foo, 'me'], function() {});";

            t.is('require(["one","two"],function(){});', parse("good1", good1));
            t.is(null, parse("bad1", bad1));
        },

        function requireDef(t) {
            var good1 = "require.def('one', ['two', 'three'], function(){});",
                good2 = "require.def('one', function(){});",
                bad1 = "require.def('one', [foo, 'me'], function() {});",
                bad2 = "require.def('one', somevar)";

            t.is('require.def("one",["two","three"],function(){});', parse("good1", good1));
            t.is('require.def("one",function(){});', parse("good2", good2));
            t.is(null, parse("bad1", bad1));
            t.is(null, parse("bad2", bad2));
        },

        function requireModify(t) {
            var good1 = "require.modify('one', 'one-mod', ['two', 'three'], function(){});",
                bad1 = "require.modify('one', 'one-mod', [foo, 'me'], function() {});";

            t.is('require.modify("one","one-mod",["two","three"],function(){});', parse("good1", good1));
            t.is(null, parse("bad1", bad1));   
        },

        function hasRequire(t) {
            var good1 = "var require; function(){ require = function(){}; s = require.s = {};}",
                bad1 = "var require; function(){ var require = function(){}; }";

            t.is(true, parse.definesRequire("good1", good1));
            t.is(false, parse.definesRequire("bad1", bad1));   

        }
    ]
);
doh.run();
