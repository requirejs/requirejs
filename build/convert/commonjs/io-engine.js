require.def("io-engine", ["require", "exports", "module"], function(require, exports, module) {

// IO: default
// Tom Robinson

var IO = exports.IO = function(inputStream, outputStream) {
    this.inputStream = inputStream;
    this.outputStream = outputStream;
}

IO.prototype.read = function(length) {
    return this.inputStream(length);
}

IO.prototype.write = function(object) {
    this.outputStream(object);
    return this;
}

IO.prototype.flush = function() {
    return this;
}

IO.prototype.close = function() {
}

exports.TextIOWrapper = function (raw, mode, lineBuffering, buffering, charset, options) {
    return raw;
}

});
