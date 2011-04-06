require({
        baseUrl: require.isBrowser ? "./" : "./exports/"
    },
    ["require", "vanilla", "funcSet", "assign", "assign2", "usethis", "implicitModule"],
    function(require, vanilla, funcSet, assign, assign2, usethis, implicitModule) {
        doh.register(
            "exports",
            [
                function exports(t){
                    t.is("vanilla", vanilla.name);
                    t.is("funcSet", funcSet);
                    t.is("assign", assign);
                    t.is("assign2", assign2);
                    t.is("usethis", usethis.name);
                    t.is("implicitModule", implicitModule());
                }
            ]
        );
        doh.run();
    }
);
