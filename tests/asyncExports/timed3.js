/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("timed3", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    setTimeout(function () {
        asyncExports({
            name: "timed3, use module.asyncExports"
        });
    }, 3000);

    exports.name = "timed3, use exports";

    module.exports = {
        name: "timed3, use module.exports"
    };

    return {
        name: "timed3"
    };
});