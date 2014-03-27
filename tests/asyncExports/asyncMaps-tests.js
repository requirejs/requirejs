/*jslint browser: true, sloppy: true, unparam: true*/
/*global require, requirejs, doh*/
require.config({
    baseUrl: requirejs.isBrowser ? "./" : "./asyncExports/"
});

require(
    [
        "asyncMaps"
    ],
    function (
        asyncMaps
    ) {

        doh.register("example", [
            function (t) {
                t.is("externalMapsAPI", asyncMaps.name);
                t.is("Done", asyncMaps.locale.Done);
                t.is("Ok", asyncMaps.locale.Ok);
            }
        ]);

        doh.run();
    }
);