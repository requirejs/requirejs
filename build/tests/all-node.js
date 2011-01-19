/**
 * Run the tests in Rhino via this command:
 * java -classpath ../lib/rhino/js.jar:../lib/closure/compiler.jar org.mozilla.javascript.tools.shell.Main all-rhino.js
 *
 * To run with debugger:
 * java -classpath ../lib/rhino/js.jar:../lib/closure/compiler.jar org.mozilla.javascript.tools.debugger.Main all-rhino.js
 */

/*jslint plusplus: false */
/*global load: false, doh: false, skipDohSetup: true */

"use strict";

//A hack to doh to avoid dojo setup stuff in doh/runner.js
skipDohSetup = true;

require({
    baseUrl: '../jslib/',
    paths: {
        'uglify': 'uglifyjs/index'
    }
})

require(
['../../tests/doh/runner.js', '../../tests/doh/_nodeRunner.js', './parse'], function (r, nr, parseTests) {


    /*
    Use this to quickly output AST from Uglify:
    var good3 = '(function(){ var object = ""; var foo = { bar: function() { require.def("one", ["two"], function(){}); } };}());',
        ast = uglify.parser.parse(good3);

    console.log(JSON.stringify(ast, null, '  '));
    */
});
