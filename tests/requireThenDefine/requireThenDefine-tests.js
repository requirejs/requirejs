var globals = {};
var master = new doh.Deferred();
var master2 = new doh.Deferred();

//Register the test
doh.register(
    "requireInDefine",
    [
        {
            name: "requireInDefineImplicit",
            timeout: 5000,
            runTest: function () {
                return master;
            }
        },
        {
            name: "requireInDefineExplicit",
            timeout: 5000,
            runTest: function () {
                return master2;
            }
        }
    ]
);
doh.run();


require({
        baseUrl: './'
    },
    ['./lib/a'],
    function(a) {
        doh.is('I am a', a.value);
        doh.is('I am b', a.b.value);
        doh.is('I am c', a.c.value);
        master2.callback(true);
    }
);


require({
        baseUrl: './'
    },
    ['./lib/d'],
    function(d) {
        doh.is('I am d', d.value);
        doh.is('I am b', d.b.value);
        doh.is('I am c', d.c.value);
        master2.callback(true);
    }
);
