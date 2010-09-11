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

//Load test framework
load("../../tests/doh/runner.js");
load("../../tests/doh/_rhinoRunner.js");

//Load the tests.
load("parse.js");
load("builds.js");
load("convert.js");

//Hmm, this is an odd requirement, call doh.run() for each test listed above?
//May be because the tests above call doh.run() in a callback sometimes?
for (var i = 0; i < 9; i++) {
    doh.run();
}
