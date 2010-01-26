require.def("file-engine", ["require", "exports", "module", "file", "system"], function(require, exports, module) {

// Tom Robinson
// Kris Kowal

// HACK: use "fs.read" and "fs.isFile" until properly implemented.
// save "fs" here since it will be replaced in "system" later.
var fs = require("system").fs;

var exports = require("file");

exports.SEPARATOR = '/';
exports.ALT_SEPARATOR = undefined;
exports.ROOT = '/';

exports.cwd = function () {
    return system.env['PWD'] || '.';
};

// TODO necessary for package loading
exports.list = function (path) {
    throw Error("list not yet implemented.");
};

// TODO necessary for package loading
exports.canonical = function (path) {
    // does not resolve symlinks
    return exports.absolute(path);
};

exports.exists = function (path) {
    throw Error("exists not yet implemented.");
};

// TODO necessary for lazy module reloading in sandboxes
exports.mtime = function (path) {
    return Date();
};

exports.size = function (path) {
    throw Error("size not yet implemented.");
};

exports.stat = function (path) {
    return {
        mtime: exports.mtime(path),
        size: exports.size(path)
    }
};

// TODO necessary for package loading
exports.isDirectory = function (path) {
    //throw Error("isDirectory not yet implemented.");
    system.log.warn("isDirectory not yet implemented. ("+path+")");
    return false;
};

// TODO necessary for module loading
exports.isFile = function (path) {
    return fs.isFile(path);
};

exports.isLink = function (path) {
    throw Error("isLink not yet implemented.");
};

exports.isReadable = function (path) {
    throw Error("isReadable not yet implemented.");
};

exports.isWritable = function (path) {
    throw Error("isWritable not yet implemented.");
};

exports.rename = function (source, target) {
    throw Error("rename not yet implemented.");
};

exports.move = function (source, target) {
    throw Error("move not yet implemented.");
};

exports.remove = function (path) {
    throw Error("remove not yet implemented.");
};

exports.mkdir = function (path) {
    throw Error("mkdir not yet implemented.");
};

exports.rmdir = function(path) {
    throw Error("rmdir not yet implemented.");
};

exports.touch = function (path, mtime) {
    throw Error("touch not yet implemented.");
};

exports.FileIO = function (path, mode, permissions) {
    mode = exports.mode(mode);
    var read = mode.read,
        write = mode.write,
        append = mode.append,
        update = mode.update;

    if (update) {
        throw new Error("Updating IO not yet implemented.");
    } else if (write || append) {
        throw new Error("Writing IO not yet implemented.");
    } else if (read) {
        // FIXME temporary hack
        return {
            'read': function () {
                return fs.read(path);
            },
            'close': function () {
            }
        };
    } else {
        throw new Error("Files must be opened either for read, write, or update mode.");
    }
};


});
