
(function (root) {
    root.A = {
        name: 'a'
    };
}(this));

define("a", (function (global) {
    return function () {
        var ret, fn;
       fn = function () {
                    window.globalA = this.A.name;
                };
        ret = fn.apply(global, arguments);
        return ret || global.A.name;
    };
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
        var ret, fn;
        return ret || global.C;
    };
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
        var ret, fn;
       fn = function () {
                    return {
                        name: e.nested.e.name + 'Modified'
                    };
                };
        ret = fn.apply(global, arguments);
        return ret || global.e.nested.e;
    };
}(this)));

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
                    t.is('a', window.globalA);
                    t.is('a', c.b.aValue);
                    t.is('b', c.b.name);
                    t.is('c', c.name);
                    t.is('d', c.b.dValue.name);
                    t.is('eModified', e.name);
                }
            ]
        );
        doh.run();
    }
);

define("basic-tests", function(){});
