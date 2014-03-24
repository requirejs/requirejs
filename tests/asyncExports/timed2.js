/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("timed2", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    exports.name = "timed2, use exports";

    setTimeout(function () {
        asyncExports({
            name: "timed2, use module.asyncExports"
        });
    }, 3000);

    module.exports = {
        name: ", use module.exports"
    };

    return {
        name: "timed2"
    };
});