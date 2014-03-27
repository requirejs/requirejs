/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("async7", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    asyncExports({
        name: "async7"
    });

    exports.name = "async7, use exports";

    module.exports = {
        name: "async7, use module.exports"
    };
});