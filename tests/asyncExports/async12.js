/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("async12", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    asyncExports();

    module.exports = {
        name: "async12"
    };

    exports.name = "async12, use exports";
});