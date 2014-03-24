/*jslint browser: true, sloppy: true, unparam: true*/
/*global require, requirejs, doh, shim1*/
require.config({
    baseUrl: requirejs.isBrowser ? "./" : "./asyncExports/",
    shim: {
        "shim1": {
            deps: ['require', 'exports', 'module'],
            init: function (require, exports, module) {
                var asyncExports = module.async();

                setTimeout(function () {
                    asyncExports(shim1);
                }, 5000);
            }
        }
    }
});

require(
    [
        "async1",
        "async2",
        "async3",
        "async4",
        "async5",
        "async6",
        "async7",
        "async8",
        "async9",
        "async10",
        "async11",
        "async12",
        "async13",

        "timed1",
        "timed2",
        "timed3",
        "timed4",
        "timed5",
        "timed6",
        "timed7",
        "timed8",
        "timed9",
        "timed10",
        "timed11",
        "timed12",
        "timed13",

        "shim1"
    ],
    function (
        async1,
        async2,
        async3,
        async4,
        async5,
        async6,
        async7,
        async8,
        async9,
        async10,
        async11,
        async12,
        async13,

        timed1,
        timed2,
        timed3,
        timed4,
        timed5,
        timed6,
        timed7,
        timed8,
        timed9,
        timed10,
        timed11,
        timed12,
        timed13,

        shim1
    ) {

        doh.register("asyncExports", [
            function (t) {
                t.is("async1", async1.name);
                t.is("async2", async2.name);
                t.is("async3", async3.name);
                t.is("async4", async4.name);
                t.is("async5", async5.name);
                t.is("async6", async6.name);
                t.is("async7", async7.name);
                t.is("async8", async8.name);
                t.is("async9", async9.name);
                t.is("async10", async10.name);
                t.is("async11", async11.name);
                t.is("async12", async12.name);
                t.is("async13", async13.name);
            },
            function (t) {
                t.is("timed1", timed1.name);
                t.is("timed2", timed2.name);
                t.is("timed3", timed3.name);
                t.is("timed4", timed4.name);
                t.is("timed5", timed5.name);
                t.is("timed6", timed6.name);
                t.is("timed7", timed7.name);
                t.is("timed8", timed8.name);
                t.is("timed9", timed9.name);
                t.is("timed10", timed10.name);
                t.is("timed11", timed11.name);
                t.is("timed12", timed12.name);
                t.is("timed13", timed13.name);
            },
            function (t) {
                t.is("shim1", shim1.name);
            }
        ]);

        doh.run();
    }
);