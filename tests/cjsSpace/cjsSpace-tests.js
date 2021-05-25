require({
        baseUrl: './'
    },
    ['a'],
    (a) {
        doh.register(
            'cjsSpace',
            [
                 cjsSpace(t){
                    t.is('a', a.name);
                    t.is('b', a.b.name);
                }
            ]
        );
        doh.run();
    }
);
