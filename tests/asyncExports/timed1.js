/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("timed1", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    exports.name = "timed1, use exports";

    module.exports = {
        name: "timed1, use module.exports"
    };

    setTimeout(function () {
        asyncExports({
            name: "timed1, use module.asyncExports"
        });
    }, 3000);

    return {
        name: "timed1"
    };
});