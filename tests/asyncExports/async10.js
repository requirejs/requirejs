/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("async10", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    exports.name = "async10, use exports";

    asyncExports();

    module.exports = {
        name: "async10"
    };
});