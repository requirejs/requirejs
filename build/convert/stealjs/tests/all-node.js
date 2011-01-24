/**
 * Run the tests in Node:
 * node ../../node/r.js all-node.js
 */

/*jslint plusplus: false */
/*global load: false, doh: false, skipDohSetup: true */

"use strict";

//A hack to doh to avoid dojo setup stuff in doh/runner.js
skipDohSetup = true;

require({
    baseUrl: '../../../jslib/',
    paths: {
        parse: '../convert/stealjs/parse'
    }
})

require(['../../../../tests/doh/runner.js', '../../../../tests/doh/_nodeRunner.js',
         './parse'],
function () {
});
