# RequireJS Testing

This is a list of things to test before doing a RequireJS release.

## Items in tests directory

First build allplugins-require.js in build/require, since one test relies on an up-to-date version.

* All browsers: tests/doh/runner.html?testUrl=../all in all the browsers
* Node: node all-server.js
* Rhino: java -jar ../build/lib/rhino/js.jar all-server.js
* Optional, only do on major refactors: tests/commonjs, run each file in browser.

## Node testing

Go to build/convert/node and run the following:

* java -jar ../../lib/rhino/js.jar dist.js
* node r.js index.js
* Try r.js a larger node project if available.

For this test, use nave, and do the npm installs listed in the JS file:

* node r.js canvasTest.js

Do these tests for each version of Node to support.

Be sure to update the r.js in the build directory.

## Build testing in build/tests

To run automated tests:

* java -classpath ../lib/rhino/js.jar:../lib/closure/compiler.jar org.mozilla.javascript.tools.shell.Main all-rhino.js

Try manual testing:

* ../build.sh indexBuilder.build.js - confirm plugin write calls are done.
* ../build.sh text.build.js - confirm plugin write calls are done.
* ../build.sh i18n.build.js - confirm plugin required the nls/en-us-surfer/colors module.
* ../build.sh order.build.js - confirm one, two, three are in order.
* ../build.sh hasTestModule.build.js - confirm plugin required the nls/en-us-surfer/colors module.

# Sample jQuery project

Test the sample jQuery project, complete with running the optimizer, testing the output.
