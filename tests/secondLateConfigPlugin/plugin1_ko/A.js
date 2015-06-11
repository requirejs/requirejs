// 2nd config
require.config({
    config: {
        // "wrap" amd plugin options
        wrap: {
            shim: {
                // How to wrap the ~jquery.bar~ module
                "plugin1/jquery.bar": {
                    deps: {
                        // Module "app/lib/jquery" goes to parameter "jQuery"
                        "app/lib/jquery": "jQuery"
                    },
                    exports: "jQuery"
                }
            }
        }
    }
});

define(["wrap!plugin1/jquery.bar"], function(jQuery) {
    console.log("jquery.bar: " + (jQuery && jQuery.bar));
    return "A loaded!";
});