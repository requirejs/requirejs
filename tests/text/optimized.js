
define("test", ["exports", "text!style1.css", "test2"], function(exports, STYLE1, TEST2) {
    exports.getStyle1 = function() {
        return STYLE1;
    }
    exports.getStyle2 = TEST2.getStyle2;
});

define("test2", ["require", "module", "exports"], function(require, module, exports) {
    exports.getStyle2 = function() {
        return require("text!style2.css");
    }
});

define("text!style1.css", function() {
    return [
        "line 1",
        "line 2"
    ].join("\n");
});
    
define("text!style2.css", function() {
    return [
        "line 3",
        "line 4"
    ].join("\n");
});
    
require(
    ["require", "test"],
    function(require, TEST) {
        require.ready(function() {

            doh.register(
                "text", 
                [
                    function optimized(t){
                        t.is(["line 1", "line 2"].join("\n"), TEST.getStyle1());
                    },
                    function optimized(t){
                        t.is(["line 3", "line 4"].join("\n"), TEST.getStyle2());
                    }
                ]
            );
            doh.run();
        });
    });
