require({
        baseUrl: './',
        shim: {
            a: {
                exports: function () {
                    return this.A.name;
                }
            },
            'b': ['a', 'd'],
            'c': {
                deps: ['a', 'b'],
                exports: 'C'
            }
        }
    },
    ['a', 'c'],
    function(a, c) {
        doh.register(
            'shimBasic',
            [
                function shimBasic(t){
                    t.is('a', a);
                    t.is('a', c.b.aValue);
                    t.is('b', c.b.name);
                    t.is('c', c.name);
                    t.is('d', c.b.dValue.name);
                }
            ]
        );
        doh.run();
    }
);
