/*jslint strict: false */
/*global require: false, doh: false */

requirejs.config({
    baseUrl: require.isBrowser ? './' : './plugins/dynamic'
});

requirejs(['pillow', 'sub/blanket'],
function (pillow,   blanket) {

    pillow.delayed(function (resource) {
        doh.register(
            'pluginsDynamic',
            [
                function pluginsDynamic(t) {
                    //Make sure the resource names do not match for the
                    //three kinds of pillow-related resources.
                    t.is(false, resource === pillow.resource);
                    t.is(false, blanket.pillowResource === pillow.resource);
                    t.is(false, resource === blanket.pillowResource);

                    //Make sure the paths after the counter ID are not relative.
                    t.is(true, resource.split(':')[1].indexOf('./pillow') === -1);
                    t.is(true, pillow.resource.split(':')[1].indexOf('./pillow') === -1);
                    t.is(true, blanket.pillowResource.split(':')[1].indexOf('../pillow') === -1);
                    t.is(true, blanket.resource.split(':')[1].indexOf('./blanket') === -1);
                }
            ]
        );
        doh.run();
    });

});
