(function (global) {
    // Store local setTimeout reference for monkey-patching DOH
    var localSetTimeout = global.setTimeout;

    // Clobber setTimeout to ensure that the below require() still works...
    global.setTimeout = null;

    // ...but ensure doh.setTimeout does not get broken
    doh.setTimeout = function (fn, delay) {
    	return localSetTimeout.call(global, fn, delay);
    };

    require({ baseUrl: "./" }, ["simple"], function(simple) {
        doh.register(
            "setTimeout",
            [
                function checkSetTimeout(t){
                    t.is("blue", simple.color);
                }
            ]
        );

        doh.run();
    });
})(this);
