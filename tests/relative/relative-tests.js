require({
        baseUrl: require.isBrowser ? "./" : "./relative/",
        paths: {
            require: "../../require"
        }
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
                    t.is("hello world", one.message);
                }
            ]
        );
        doh.run();
    }
);
