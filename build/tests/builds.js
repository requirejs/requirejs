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

    function cPragma(file) {
        var contents = c(file);
        //buildBaseConfig comes from jslib/build.js and pragma is defined
        //in jslib/pragma.js, both loaded by the build process.
        return pragma.process(file, contents, buildBaseConfig);
    }
    //Remove line returns to make comparisons easier.
    function nol(contents) {
        return contents.replace(/[\r\n]/g, "");
    }

    //Do a build of require.js to get default pragmas processed.
    build(["..", "name=require", "baseUrl=../..", "out=builds/require.js", "includeRequire=true", "optimize=none"]);

    var requirejs = c("builds/require.js"),
        oneResult = [
                    requirejs,
                    c("../../tests/two.js"),
                    c("../../tests/one.js"),
                    c("../../tests/dimple.js")
                ].join("");

    doh.register(
        "builds",
        [
            function onCssFile(t) {
                build(["..", "cssIn=css/sub/sub1.css", "out=builds/sub1.css"]);

                t.is(nol(c("cssTestCompare.css")), nol(c("builds/sub1.css")));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                delete require.s.contexts._;
            },

            function oneJsFile(t) {
                build(["..", "name=one", "include=dimple", "out=builds/outSingle.js",
                       "baseUrl=../../tests", "includeRequire=true", "optimize=none"]);

                t.is(nol(oneResult), nol(c("builds/outSingle.js")));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                delete require.s.contexts._;
            },

            function simple(t) {
                //Do the build
                build(["..", "simple.build.js"]);

                t.is(nol(oneResult), nol(c("builds/simple/one.js")));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                delete require.s.contexts._;
            },

            function excludeShallow(t) {
                build(["..", "name=uno", "excludeShallow=dos", "out=builds/unoExcludeShallow.js",
                       "baseUrl=../../tests", "optimize=none"]);
                t.is(nol(c("../../tests/tres.js") +
                     c("../../tests/uno.js")), nol(c("builds/unoExcludeShallow.js")));
                delete require.s.contexts._;
            },

            function exclude(t) {
                build(["..", "name=uno", "exclude=dos", "out=builds/unoExclude.js",
                       "baseUrl=../../tests", "optimize=none"]);

                t.is(nol(c("../../tests/uno.js")), nol(c("builds/unoExclude.js")));
                delete require.s.contexts._;
            },

            function textPluginIncluded(t) {
                build(["..", "name=one", "include=require/text", "out=builds/oneText.js",
                       "baseUrl=../../tests", "optimize=none"]);

                t.is(nol(nol(c("../../tests/two.js") +
                         c("../../tests/one.js")) +
                         cPragma("../../require/text.js")), nol(c("builds/oneText.js")));
                delete require.s.contexts._;
            }

        ]
    );
    doh.run();
}());
