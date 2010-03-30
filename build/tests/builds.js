/*jslint plusplus: false */
/*global load: false, doh: false, parse: false, fileUtil: false, build: false */

"use strict";

//Load the file to test.
load("../jslib/build.js");
load("../jslib/fileUtil.js");

//Remove any old builds
fileUtil.deleteFile("builds");

(function () {
    function c(file) {
        return fileUtil.readFile(file);
    }
    
    //Remove line returns to make comparisons easier.
    function nol(contents) {
        return contents.replace(/[\r\n]/g, "");
    }

    //Do a build of require.js to get default pragmas processed.
    build(["..", "name=require", "baseUrl=../..", "out=builds/require.js", "includeRequire=true", "optimize=none"]);

    var requirejs = c("builds/require.js");

    doh.register(
        "builds", 
        [
            function simple(t) {
                //Do the build
                build(["..", "simple.build.js"]);
    
                //Result should be 
                var result = [
                    requirejs,
                    "require.pause();\n",
                    c("../../tests/two.js"),
                    c("../../tests/one.js"),
                    c("../../tests/dimple.js"),
                    "\nrequire.resume();\n"
                ].join("");

                t.is(nol(result), nol(fileUtil.readFile("builds/simple/one.js")));
            }
        ]
    );
    doh.run();
}());
