require({
        baseUrl: require.isBrowser ? "./" : "./anon/"
    },
    ["require", "red", "blue", "green", "yellow"],
    function(require, red, blue, green, yellow) {
        doh.register(
            "anonSimple", 
            [
                function colors(t){
                    t.is("red", red.name);
                    t.is("blue", blue.name);
                    t.is("green", green.name);
                    t.is("yellow", yellow.name);
                }
            ]
        );

        //Also try a require call after initial page
        //load that uses already loaded modules,
        //to be sure the require callback is called.
        var onReady = function () {
            require(["blue", "red"], function (blue, red) {
                doh.register(
                    "anonSimpleCached",
                    [
                        function colorsCached(t){
                            t.is("red", red.name);
                            t.is("blue", blue.name);
                        }
                    ]
                );
                doh.run();
            });
        }
        if (require.isBrowser) {
            require.ready(function () {
                setTimeout(onReady, 100);
            })
        } else {
            onReady();
        }
    }
);
