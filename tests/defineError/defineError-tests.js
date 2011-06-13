require.onError = function (err) {
    var isDefineError = err.toString().indexOf('#defineerror') !== -1;

    doh.register(
        "defineError",
        [
            function defineError(t){
                t.is(true, isDefineError);
            }
        ]
    );

    doh.run();
};

require({
        baseUrl: "./"
    },
    ["main"],
    function(main) {
        doh.register(
            "defineError2",
            [
                function defineError2(t){
                    t.is(undefined, main && main.errorName);
                }
            ]
        );

        doh.run();
    }
);
