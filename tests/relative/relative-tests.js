require({
        baseUrl: require.isBrowser ? "./" : "./relative/"    
    },
    ["require", "foo/bar/one"],
    function(require, one) {
        doh.register(
            "relative", 
            [
                function relative(t){
                    t.is("one", one.name);
                    t.is("two", one.twoName);
                    t.is("three", one.threeName);
                }
            ]
        );
        doh.run();
    }
);
