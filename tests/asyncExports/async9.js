/*jslint browser: true, sloppy: true, unparam: true*/
/*global define*/
define("async9", ["require", "exports", "module"], function (require, exports, module) {

    var asyncExports = module.async();

    exports.name = "async9, use exports";

    module.exports = {
        name: "async9"
    };

    asyncExports();
});