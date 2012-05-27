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
            },
            'e': {
                exports: 'e.nested.e'
            }
        }
    },
    ['a', 'c', 'e'],
    function(a, c, e) {
        doh.register(
            'shimBasic',
            [
                function shimBasic(t){
                    t.is('a', a);
                    t.is('a', c.b.aValue);
                    t.is('b', c.b.name);
                    t.is('c', c.name);
                    t.is('d', c.b.dValue.name);
                    t.is('e', e.name);
                }
            ]
        );
        doh.run();
    }
);
