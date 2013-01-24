require({
        baseUrl: './',
        shim: {
            a: {
                exports: 'A.name',
                init: function () {
                    window.globalA = this.A.name;
                }
            },
            'b': ['a', 'd'],
            'c': {
                deps: ['a', 'b'],
                exports: 'C'
            },
            'e': {
                exports: 'e.nested.e',
                init: function () {
                    return {
                        name: e.nested.e.name + 'Modified'
                    };
                }
            },
            'f': {
                deps: ['a'],
                init: function (a) {
                    return {
                        name: FCAP.name,
                        globalA: FCAP.globalA,
                        a: a
                    };
                }
            },
            'namespace/*aa' : ['g'],
            'namespace/*' : ['g']
        }
    },
    ['a', 'c', 'e', 'f', 'namespace/aaa', 'namespace/a'],
    function(a, c, e, f) {
        doh.register(
            'shimBasic',
            [
                function shimBasic(t){
                    t.is('a', a);
                    t.is('a', window.globalA);
                    t.is('a', c.b.aValue);
                    t.is('b', c.b.name);
                    t.is('c', c.name);
                    t.is('d', c.b.dValue.name);
                    t.is('eModified', e.name);
                    t.is('FCAP', f.name);
                    t.is('a', f.globalA.name);
                    t.is('a', f.a);
                    t.is('namespaced.a', namespace.a.name);
                    t.is('g', namespace.a.g.name);
                    t.is('g', namespace.aaa.g.name);
                }
            ]
        );
        doh.run();
    }
);
