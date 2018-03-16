require({
        baseUrl: requirejs.isBrowser ? "./" : "./remoteUrls/"
    },
    ["require", "jqwrap"],
    function(require, jqwrap) {
        doh.register(
            "remoteUrls",
            [
                function remoteUrls(t){
                    t.is(true, jqwrap.isFunction);
                    t.is(true, !!jqwrap.swfobject);
                    t.is('util', jqwrap.util.name);
                    t.is('util2', jqwrap.util2.name);
                }
            ]
        );

        doh.run();
    }
);
