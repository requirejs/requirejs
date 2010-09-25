require.def(['bar', 'foo'], function (bar, foo) {
    return {
        name: 'baz',
        barDepVersion: bar.version,
        fooName: foo.name
    };
});
