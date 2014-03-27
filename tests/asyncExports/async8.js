/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("async8", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    asyncExports({
        name: "async8"
    });

    module.exports = {
        name: "async8, use module.exports"
    };

    exports.name = "async8, use exports";
});