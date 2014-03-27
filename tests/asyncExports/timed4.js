/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("timed4", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    setTimeout(function () {
        asyncExports({
            name: "timed4, use module.asyncExports"
        });
    }, 3000);

    module.exports = {
        name: "timed4, use module.exports"
    };

    exports.name = "timed4, use exports";

    return {
        name: "timed4"
    };
});