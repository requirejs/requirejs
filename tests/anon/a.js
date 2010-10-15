define(function (require, module, exports) {
    var b =  require("sub/b");
    return {
        name: "a",
        bName: b.f()
    };
});
