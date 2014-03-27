/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("timed6", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    exports.name = "timed6, use exports";

    setTimeout(function () {
        asyncExports({
            name: "timed6"
        });
    }, 3000);

    module.exports = {
        name: "timed6, use module.exports"
    };
});