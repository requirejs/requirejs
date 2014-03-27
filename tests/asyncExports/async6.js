/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("async6", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    exports.name = "async6, use exports";

    asyncExports({
        name: "async6"
    });

    module.exports = {
        name: "async6, use module.exports"
    };
});