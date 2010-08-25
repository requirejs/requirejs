require(['require'], function (require) {

    //Use require.ready to register callbacks with the DOM is ready for access
    require.ready(function () {
        document.getElementsByTagName('body').innerHTML = '<h1>Hello World</h1>';
    });
});
