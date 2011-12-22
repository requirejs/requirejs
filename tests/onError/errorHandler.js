/*jslint strict: false */
/*global define, doh */
define(function (require) {

    function onError(err) {
        //If the err is a timeout then that means we should
        //try a different require call.
        if (err.requireType === 'timeout') {
            var moduleId = err.requireModules[0].replace(/-typo/, '');
            require([moduleId], function (value) {

               //Run the test
                doh.register(
                    "retryOnError",
                    [
                        function retryOnError(t) {
                            t.is("target", value.name);
                        }
                    ]
                );

                doh.run();
            });
        } else {
            throw err;
        }
    }

    return onError;
});
