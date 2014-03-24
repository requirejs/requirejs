/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("async5", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    exports.name = "async5, use exports";

    module.exports = {
        name: "async5, use module.exports"
    };

    asyncExports({
        name: "async5"
    });
});