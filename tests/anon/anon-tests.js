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
        doh.run();
    }
);
