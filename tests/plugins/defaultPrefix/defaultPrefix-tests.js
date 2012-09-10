require({
        baseUrl: requirejs.isBrowser ? './' : './plugins/defaultPrefix',
        paths: {
            'text': '../../../../text/text'
        },
},      ['refine!a'],
function (a) {

    doh.register(
        'pluginDefaultPrefix',
        [
            function pluginDefaultPrefix(t){
                t.is('a', a.name);
                t.is('b', a.b.name);
                t.is('c', a.c.name);
                t.is('plain', a.plain.name);
                t.is(true, a.text.indexOf('a.txt') === 0);

                t.is('plain', a.b.plain.name);
                t.is(true, a.b.text.indexOf('b.txt') === 0);

                t.is('b', a.c.b.name);
                t.is('plain', a.c.b.plain.name);
                t.is(true, a.c.b.text.indexOf('b.txt') === 0);

             }
        ]
    );
    doh.run();
});
