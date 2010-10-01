require({
        baseUrl: require.isBrowser ? "./" : "./exports/"    
    },
    ["require", "vanilla", "funcSet", "assign", "assign2"],
    function(require, vanilla, funcSet, assign, assign2) {
        doh.register(
            "exports", 
            [
                function exports(t){
                    t.is("vanilla", vanilla.name);
                    t.is("funcSet", funcSet);
                    t.is("assign", assign);
                    t.is("assign2", assign2);
                }
            ]
        );
        doh.run();
    }
);
