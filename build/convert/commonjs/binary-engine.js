require.def("binary-engine", ["require", "exports", "module"], function(require, exports, module) {

// Tom Robinson

exports.B_LENGTH = function(bytes) {
    return bytes.length;
}

exports.B_ALLOC = function(length) {
    var bytes = new Array(length);
    for (var i = 0; i < length; i++)
        bytes[i] = 0;
    return bytes;
}

exports.B_FILL = function(bytes, from, to, value) {
    for (var i = from; i < to; i++)
        bytes[i] = value;
}

exports.B_COPY = function(src, srcOffset, dst, dstOffset, length) {
    for (var i = 0; i < length; i++)
        dst[dstOffset+i] = src[srcOffset+i];
}

exports.B_GET = function(bytes, index) {
    return bytes[index];
}   

exports.B_SET = function(bytes, index, value) {
    return bytes[index] = value;
}

var DEFAULT_ENCODING = "UTF-8";

exports.B_DECODE = function(bytes, offset, length, codec) {
    var newBytes = exports.B_TRANSCODE(bytes, offset, length, codec, DEFAULT_ENCODING);
    return exports.B_DECODE_DEFAULT(newBytes, 0, exports.B_LENGTH(newBytes));
}

exports.B_DECODE_DEFAULT = function(bytes, offset, length) {
    throw "NYI";
}

exports.B_ENCODE = function(string, codec) {
    var bytes = exports.B_ENCODE_DEFAULT(string);
    return exports.B_TRANSCODE(bytes, 0, exports.B_LENGTH(bytes), DEFAULT_ENCODING, codec);
}

exports.B_ENCODE_DEFAULT = function(string) {
    throw "NYI";
}

exports.B_TRANSCODE = function(bytes, offset, length, sourceCodec, targetCodec) {
    throw "NYI";
}


});
