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
                good2 = "require({baseUrl: './'}, ['one', 'two']);",
                bad1 = "require([foo, 'me'], function() {});";

            t.is('require(["one","two"]);', parse("good1", good1));
            t.is('require(["one","two"]);', parse("good2", good2));
            t.is(null, parse("bad1", bad1));
        },

        function requireDef(t) {
            var good1 = "require.def('one', ['two', 'three'], function(){});",
                good2 = "require.def('one', function(){});",
                good3 = 'function(){ var foo = { bar: function() { require.def("one", ["two"], function(){}); } };}',
                good4 = '(function (require) { require.def("one", function(){}); }(myGlobalRequire))',
                bad1 = "require.def('one', [foo, 'me'], function() {});",
                bad2 = "require.def('one', somevar)",
                goodAnon1 = "require.def(function(){ var foo = require('foo'); });",
                goodAnon2 = "require.def(function () { if (true) { callback(function () { require(\"bar\"); })}});",
                emptyAnon1 = "require.def(function() { exports.name = 'empty'; });";

            t.is('define("one",["two","three"]);', parse("good1", good1));
            t.is('define("one",function(){});', parse("good2", good2));
            t.is('define("one",["two"]);', parse("good3", good3));
            t.is('define("one",function(){});', parse("good4", good4));
            t.is(null, parse("bad1", bad1));
            t.is(null, parse("bad2", bad2));
            t.is(['require', 'exports', 'module', 'foo'], parse.getAnonDeps("goodAnon1", goodAnon1));
            t.is(['require', 'exports', 'module', 'bar'], parse.getAnonDeps("goodAnon2", goodAnon2));
            t.is(3, parse.getAnonDeps("emptyAnon1", emptyAnon1).length);
        },

        function defineCall(t) {
            var good1 = "define('one', ['two', 'three'], function(){});",
                good2 = "define('one', function(){});",
                good3 = 'function(){ var foo = { bar: function() { define("one", ["two"], function(){}); } };}',
                good4 = '(function (define) { define("one", function(){}); }(myGlobalDefine))',
                nested1 = "(function () {\nvar foo = {\nbar: 'baz'\n}\n\n define('foo', [], foo); \n }());",
                bad1 = "define('one', [foo, 'me'], function() {});",
                bad2 = "define('one', somevar)",
                goodAnon1 = "define(function(){ var foo = require('foo'); });",
                goodAnon2 = "define(function () { if (true) { callback(function () { require(\"bar\"); })}});",
                emptyAnon1 = "define(function() { exports.name = 'empty'; });";

            t.is('define("one",["two","three"]);', parse("good1", good1));
            t.is('define("one",function(){});', parse("good2", good2));
            t.is('define("one",["two"]);', parse("good3", good3));
            t.is('define("one",function(){});', parse("good4", good4));
            t.is('define("foo",[]);', parse("nested1", nested1));
            t.is(null, parse("bad1", bad1));
            t.is(null, parse("bad2", bad2));

            t.is(['require', 'exports', 'module', 'foo'], parse.getAnonDeps("goodAnon1", goodAnon1));
            t.is(['require', 'exports', 'module', 'bar'], parse.getAnonDeps("goodAnon2", goodAnon2));
            t.is(3, parse.getAnonDeps("emptyAnon1", emptyAnon1).length);
        },

        function requireModify(t) {
            var good1 = "require.modify('one', 'one-mod', ['two', 'three'], function(){});",
                bad1 = "require.modify('one', 'one-mod', [foo, 'me'], function() {});";

            t.is('require.modify("one","one-mod",["two","three"],function(){});', parse("good1", good1));
            t.is(null, parse("bad1", bad1));
        },

        function hasRequire(t) {
            var good1 = "var require; function(){ require = function(){}; s = require.s = {};}",
                good2 = "var myGlobalRequire = (function () { var require = {}; function(){ require = function(){}; s = require.s = {};} }());",
                bad1 = "var require; function(){ var require = function(){}; }",
                bad2 = "(function(require) { require(); }(myvar));";

            t.is(true, parse.definesRequire("good1", good1));
            t.is(true, parse.definesRequire("good2", good2));
            t.is(false, parse.definesRequire("bad1", bad1));
            t.is(false, parse.definesRequire("bad2", bad2));
        }
    ]
);
doh.run();
