require(['baz@2.0.0', '@foo/bar@1.0.0'], function (baz, bar) {

    doh.register(
        'packagesMultiLevel',
        [
            function packagesMultiLevel(t){
                t.is('baz', baz.name);
                t.is('helper', baz.helper.name);
                t.is('bar', bar.name);
                t.is('other', bar.other.name);
            }
        ]
    );
    doh.run();
});
