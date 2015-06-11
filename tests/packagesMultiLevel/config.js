requirejs.config({
    packages: [{
        name: '@foo/bar@1.0.0',
        main: 'index',
        location: '@foo/bar@1.0.0'
    }, {
        name: 'baz@2.0.0',
        main: 'index',
        location: 'baz@2.0.0'
    }]
});
