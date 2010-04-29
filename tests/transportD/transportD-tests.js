require({
    baseUrl: require.isBrowser ? "./" : "./transportD/"
});

require.define({
    "foo/bar/one": {
        factory: function (require, exports, module) {
            exports.name = "one";
            exports.twoName = require("foo/bar/two").name;
            exports.threeName = require("foo/three").name;
        }
    }
}, ["foo/bar/two", "foo/three"]);


require(["foo/bar/one"], function (one) {
    doh.register(
        "transportD", 
        [
            function relative(t){
                t.is("one", one.name);
                t.is("two", one.twoName);
                t.is("three", one.threeName);
            }
        ]
    );
    doh.run();
});
