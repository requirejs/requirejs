/* Copied from Firebug open source under BSD license */

/*
 * This file allows the requirejs tests from Firebug's FBTest to run in a web page.
 */


var FBTest =
{
    progress: function(msg) {
        console.log("progress: "+msg);
    },
    getRequire: function() {
        return require;
    },
    sysout: function(msg) {
        console.log(msg);
    },
    compare: function(expected, actual, what) {
        var ok = (expected === actual) ? "PASS" : "FAIL";
        console.log(what+": "+ok, {expected:expected, actual: actual});
    }
};

var myURL = window.location + "";
var segments = myURL.split('/');
segments.splice(segments.length - 1, 1);
var baseLocalPath = segments.join('/');

console.log("baseLocalPath ", baseLocalPath);

window.addEventListener('load', function doOnLoad(){
    window.runTest();
}, false);
