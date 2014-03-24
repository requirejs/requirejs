/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("timed7", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    setTimeout(function () {
        asyncExports({
            name: "timed7"
        });
    }, 3000);

    exports.name = "timed7, use exports";

    module.exports = {
        name: "timed7, use module.exports"
    };
});