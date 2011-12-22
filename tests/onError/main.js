//Get to the timeout case quicker than the default 7 seconds
requirejs.config({
    waitSeconds: 3
});

require(['errorHandler'], function (errorHandler) {
    require.onError = errorHandler;
});

require(['target-typo'], function (shouldFail) {

});
