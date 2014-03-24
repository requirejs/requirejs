/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("timed5", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    exports.name = "timed5, use exports";

    module.exports = {
        name: "timed5, use module.exports"
    };

    setTimeout(function () {
        asyncExports({
            name: "timed5"
        });
    }, 3000);
});