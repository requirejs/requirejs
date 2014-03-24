/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("timed9", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    exports.name = "timed9, use exports";

    module.exports = {
        name: "timed9"
    };

    setTimeout(function () {
        asyncExports();
    }, 3000);
});