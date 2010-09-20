require.def(['../foo'], function (foo) {
    return {
        name: 'ALPHA' + foo.name
    };
});
