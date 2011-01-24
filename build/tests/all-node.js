/**
 * Run the tests in Node:
 * node ../convert/node/r.js all-node.js
 */

/*jslint plusplus: false */
/*global load: false, doh: false, skipDohSetup: true */

"use strict";

//A hack to doh to avoid dojo setup stuff in doh/runner.js
skipDohSetup = true;

require({
    baseUrl: '../jslib/'
})

require(['../../tests/doh/runner.js', '../../tests/doh/_nodeRunner.js',
         './parse'],
function () {

    /*
    Use this to quickly output AST from Uglify:
    var good3 = '(function(){ var object = ""; var foo = { bar: function() { require.def("one", ["two"], function(){}); } };}());',
        ast = uglify.parser.parse(good3);

    console.log(JSON.stringify(ast, null, '  '));
    */
});
