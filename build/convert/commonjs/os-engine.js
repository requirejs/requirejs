require.def("os-engine", ["require", "exports", "module"], function(require, exports, module) {
// Christoph Dorn
exports.exit = function(status) {
    throw new Error("Exiting with status="+status);
}

});
