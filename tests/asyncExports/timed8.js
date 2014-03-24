/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("timed8", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    setTimeout(function () {
        asyncExports({
            name: "timed8"
        });
    }, 3000);

    module.exports = {
        name: "timed8, use module.exports"
    };

    exports.name = "timed8, use exports";
});