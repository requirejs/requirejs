var urlRegistry = [];

require({
        baseUrl: "./",
        onToUrl: function (url) {
            urlRegistry.push(url);
            return url;
        }
    },
    ['a', 'b'],
    function() {
        doh.register(
            "onToUrl",
            [
                function onToUrl(t){
                    t.is(true, /a\.js$/.test(urlRegistry[0]));
                    t.is(true, /b\.js$/.test(urlRegistry[1]));
                    t.is(true, /c\.js$/.test(urlRegistry[2]));
                    t.is(3, urlRegistry.length);
                }
            ]
        );

        doh.run();
    }
);
