require.def("system", ["require", "exports", "module", "io","file","logger"], function(require, exports, module) {

// Tom Robinson
// Kris Kowal

var IO = require("io").IO;

exports.print = function () {
    exports.stdout.write(Array.prototype.join.call(arguments, ' ') + "\n").flush();
};

exports.stdin  = new IO(function(){}, null);
exports.stdout = new IO(null, function(string) { exports.print(String(string).replace(/\n$/,"")); });
exports.stderr = new IO(null, function(string) { exports.print(String(string).replace(/\n$/,"")); });

exports.args = global.arguments || [];

exports.env = {};

exports.fs = require("file");

// default logger
var Logger = require("logger").Logger;
exports.log = new Logger(exports.stderr);

});
