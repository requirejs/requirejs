require({
        baseUrl: require.isBrowser ? "./" : "./exports/"    
    },
    ["require", "vanilla", "funcSet", "assign"],
    function(require, vanilla, funcSet, assign) {
        doh.register(
            "exports", 
            [
                function exports(t){
                    t.is("vanilla", vanilla.name);
                    t.is("funcSet", funcSet);
                    t.is("assign", assign);
                }
            ]
        );
        doh.run();
    }
);
