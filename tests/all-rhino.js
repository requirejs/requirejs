/**
 * Run the tests in Rhino via this command:
 * java -jar ../build/lib/rhino/js.jar all-rhino.js
 *
 * To run with debugger:
 * java -classpath ../build/lib/rhino/js.jar org.mozilla.javascript.tools.debugger.Main all-rhino.js
 */

//A hack to doh to avoid dojo setup stuff in doh/runner.js
skipDohSetup = true;

//Load test framework
load("doh/runner.js");
load("doh/_rhinoRunner.js");

//Load require with rhino extension
load("../require.js");
load("../require/rhino.js");

//Load the tests.
load("simple-tests.js");
load("circular-tests.js");
load("relative/relative-tests.js");

//Hmm, this is an odd requirement, call doh.run() for each test listed above?
//May be because the tests above call doh.run() in a callback sometimes?
doh.run();
doh.run();
