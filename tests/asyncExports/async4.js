/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("async4", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    asyncExports({
        name: "async4, use module.asyncExports"
    });

    module.exports = {
        name: "async4, use module.exports"
    };

    exports.name = "async4, use exports";

    return {
        name: "async4"
    };
});