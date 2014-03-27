/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("async1", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    exports.name = "async1, use exports";

    module.exports = {
        name: "async1, use module.exports"
    };

    asyncExports({
        name: "async1, use module.asyncExports"
    });

    return {
        name: "async1"
    };
});