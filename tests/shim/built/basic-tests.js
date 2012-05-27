
(function (root) {
    root.A = {
        name: 'a'
    };
}(this));

define("a", (function (global) {
    return function () {
        var func = function (){return this.A.name};
        return func.apply(global, arguments);
    }
}(this)));

function D() {
    this.name = 'd';
};

define("d", function(){});

var B = {
    name: 'b',
    aValue: A.name,
    dValue: new D()
};

define("b", function(){});

var C = {
    name: 'c',
    a: A,
    b: B
};

define("c", ["a","b"], (function (global) {
    return function () {
        return global.C;
    }
}(this)));

var e = {
    nested: {
        e: {
            name: 'e'
        }
    }
};

define("e", (function (global) {
    return function () {
        return global.e.nested.e;
    }
}(this)));

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

define("basic-tests", function(){});
