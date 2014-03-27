/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("async11", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    asyncExports();

    exports.name = "async11, use exports";

    module.exports = {
        name: "async11"
    };
});