/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("timed13", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    setTimeout(function () {
        asyncExports();
    }, 3000);

    exports.name = "timed13";
});