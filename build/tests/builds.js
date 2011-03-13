/*jslint plusplus: false, nomen: false, strict: false */
/*global define: false, require: false, doh: false */

define(['build', 'env!env/file'], function (build, file) {
    //Remove any old builds
    file.deleteFile("builds");

    function c(fileName) {
        return file.readFile(fileName);
    }

    //Remove line returns to make comparisons easier.
    function nol(contents) {
        return contents.replace(/[\r\n]/g, "");
    }

    //Do a build of require.js to get default pragmas processed.
    build(["..", "name=require", "baseUrl=../..", "out=builds/require.js", "includeRequire=true", "optimize=none"]);

    //Do a build of the text plugin to get any pragmas processed.
    build(["..", "name=text", "baseUrl=../..", "out=builds/text.js", "optimize=none"]);

    //Reset build state for next run.
    require._buildReset();

    var requirejs = c("builds/require.js"),
        requireTextContents = c("builds/text.js"),
        oneResult = [
            requirejs,
            c("../../tests/two.js"),
            c("../../tests/one.js"),
            c("../../tests/dimple.js")
        ].join("");

    doh.register("buildOneCssFile",
        [
            function buildOneCssFile(t) {
                build(["..", "cssIn=css/sub/sub1.css", "out=builds/sub1.css"]);

                t.is(nol(c("cssTestCompare.css")), nol(c("builds/sub1.css")));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildOneJsFile",
        [
            function buildOneJsFile(t) {
                build(["..", "name=one", "include=dimple", "out=builds/outSingle.js",
                       "baseUrl=../../tests", "includeRequire=true", "optimize=none"]);

                t.is(nol(oneResult), nol(c("builds/outSingle.js")));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildSimple",
        [
            function buildSimple(t) {
                //Do the build
                build(["..", "simple.build.js"]);

                t.is(nol(oneResult), nol(c("builds/simple/one.js")));

                //Reset require internal state for the contexts so future
                //builds in these tests will work correctly.
                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildExcludeShallow",
        [
            function buildExcludeShallow(t) {
                build(["..", "name=uno", "excludeShallow=dos", "out=builds/unoExcludeShallow.js",
                       "baseUrl=../../tests", "optimize=none"]);
                t.is(nol(c("../../tests/tres.js") +
                     c("../../tests/uno.js")), nol(c("builds/unoExcludeShallow.js")));
                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildExclude",
        [
            function buildExclude(t) {
                build(["..", "name=uno", "exclude=dos", "out=builds/unoExclude.js",
                       "baseUrl=../../tests", "optimize=none"]);

                t.is(nol(c("../../tests/uno.js")), nol(c("builds/unoExclude.js")));
                require._buildReset();
            }
        ]
    );
    doh.run();

    doh.register("buildTextPluginIncluded",
        [
            function buildTextPluginIncluded(t) {
                build(["..", "name=one", "include=text", "out=builds/oneText.js",
                       "baseUrl=../../tests", "paths.text=../text", "optimize=none"]);

                t.is(nol(nol(c("../../tests/two.js") +
                         c("../../tests/one.js")) +
                         requireTextContents), nol(c("builds/oneText.js")));
                require._buildReset();
            }

        ]
    );
    doh.run();

    doh.register("buildPluginAsModule",
        [
            function buildPluginAsModule(t) {
                build(["..", "name=refine!a", "out=builds/refineATest.js",
                       "baseUrl=../../tests/plugins/fromText",
                       "exclude=text,refine",
                       "paths.text=../../../text", "optimize=none"]);

                t.is(nol(nol(c("../../tests/plugins/fromText/a.refine")
                             .replace(/refine/g, 'define')))
                             .replace(/define\(\{/, "define('refine!a',{"),
                         nol(c("builds/refineATest.js")));

                require._buildReset();
            }

        ]
    );
    doh.run();
});
