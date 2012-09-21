
define('refine',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});
define('plain',{
    name: 'plain'
});

define('text',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});
define('text!b.txt',[],function () { return 'b.txt';});

define('refine!b',['!plain', 'text!b.txt'], function (plain, text) {
    return {
        name: 'b',
        plain: plain,
        text: text
    }
});

define('refine!c',['b'], function (b) {
    return {
        name: 'c',
        b: b
    };
});

define('text!a.txt',[],function () { return 'a.txt';});

//The refine plugin changes the word refine into define.
define('refine!a',['refine!b', 'c', '!plain', 'text!a.txt'],
function (b, c, plain, text) {
    return {
        name: 'a',
        b: b,
        c: c,
        plain: plain,
        text: text
    };
});

require({
        baseUrl: './',
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

define("defaultPrefix-tests", function(){});
