/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("async2", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    exports.name = "async2, use exports";

    asyncExports({
        name: "async2, use module.asyncExports"
    });

    module.exports = {
        name: ", use module.exports"
    };

    return {
        name: "async2"
    };
});