/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("timed10", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    exports.name = "timed10, use exports";

    setTimeout(function () {
        asyncExports();
    }, 3000);

    module.exports = {
        name: "timed10"
    };
});