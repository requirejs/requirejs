doh.register(
    "additionalContextHandlers",
    [
        function additionalContextHandlers(t){
            var algebra = {},
                mathContextRequire = require.config({
                    context: "Math",
                    baseUrl: "./additionalContextHandlers",
                    handlers: {
                        PI: function () { return Math.PI; },
                        algebra: function () { return algebra; }
                    }
                });

            mathContextRequire([ 'someMath' ], function (someMath) {
                t.is(Infinity, algebra.Infinity);
                t.is(Math.PI, someMath.PI);
            });
        }
    ]
);

doh.run();
