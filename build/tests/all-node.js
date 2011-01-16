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

require(['../../tests/doh/runner.js', '../../tests/doh/_nodeRunner.js'], function () {

    doh.register(
    "test1",
    [
        function test1(t) {
            t.is('ok', 'ok2');
        }
    ]);

    doh.run();
});
