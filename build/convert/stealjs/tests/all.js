/**
 * Run the tests in Node:
 * ../../../../bin/x all-node.js
 */

/*jslint plusplus: false, strict: false */
/*global load: false, doh: false, skipDohSetup: true */

//A hack to doh to avoid dojo setup stuff in doh/runner.js
skipDohSetup = true;

require({
    baseUrl: '../../../jslib/',
    paths: {
        parse: '../convert/stealjs/parse'
    }
}, [
    '../../../../tests/doh/runner.js',
    'env!../../../../tests/doh/_{env}Runner.js',
    './parse'
], function () {
   doh.run();
});
