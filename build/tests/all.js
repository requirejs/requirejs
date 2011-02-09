/**
 * @license RequireJS Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/**
 * Run the tests in Node with this command:
 * ../../bin/x all.js
 */

/*jslint plusplus: false, strict: false */
/*global require: false, doh: false, skipDohSetup: true */

//A hack to doh to avoid dojo setup stuff in doh/runner.js
skipDohSetup = true;

//Set baseUrl for default context, but use a different context
//to run the tests, since at least one test run clears out the
//default context between each run.
require({
    baseUrl: '../jslib/'
});

//Run the tests in a different context.
require({
    baseUrl: '../jslib/',
    context: 'test'
}, [
    '../../tests/doh/runner.js',
    'env!../../tests/doh/_{env}Runner.js',
    './convert',
    './parse',

    //Build tests should be last in case they alter the environment
    //in a weird way.
    './builds'
]);

//Show final report. Do this outside the require call, not
//in a require callback because the builds will modify require.js
//to not call callbacks.
doh.run();