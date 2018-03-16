define('baz@2.0.0/helper',{
    name: 'helper'
});

define('baz@2.0.0/index',['./helper'], function (helper) {
    return {
        name: 'baz',
        helper: helper
    };
});

define('baz@2.0.0', ['baz@2.0.0/index'], function (main) { return main; });

define('@foo/bar@1.0.0/other',{
    name: 'other'
});

define('@foo/bar@1.0.0/index',['./other'], function (other) {
    return {
        name: 'bar',
        other: other
    };
});

define('@foo/bar@1.0.0', ['@foo/bar@1.0.0/index'], function (main) { return main; });

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

define("packagesMultiLevel-tests", function(){});

