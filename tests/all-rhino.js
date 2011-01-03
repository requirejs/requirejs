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
load("exports/exports-tests.js");
load("anon/anon-tests.js");
load("packages/packages-tests.js");
load("plugins/sync-tests.js");

//Hmm, odd, need to call doh.run 3 times to see the summary result, even though
//each test runs doh.run()?
doh.run();
doh.run();
doh.run();
doh.run();