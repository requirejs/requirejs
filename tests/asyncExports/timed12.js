/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("timed12", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    setTimeout(function () {
        asyncExports();
    }, 3000);

    module.exports = {
        name: "timed12"
    };

    exports.name = "timed12, use exports";
});