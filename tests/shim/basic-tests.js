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
            },
            'f': {
                exports: { 'g': 'g', 'h': 'h' }
            }
        }
    },
    ['a', 'c', 'e', 'f'],
    function(a, c, e, f) {
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
                    t.is('g', f.g);
                    t.is('h', f.h);
                }
            ]
        );
        doh.run();
    }
);
