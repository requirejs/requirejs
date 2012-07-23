define('a',[], {});

define('text!template.html',[],function () { return 'TEXT';});

define('b',['text!template.html'], function(tmpl) {
    return 'b ' + tmpl;
});

define('c',['text!template.html'], function(tmpl) {
    return 'c ' + tmpl;
});

require(['a'], function (a) {
    require({
        paths: {
            'text': '../../../text/text'
        }
    }, ['b', 'c'], function(b, c) {
        console.log(b === 'b TEXT');
        console.log(c === 'c TEXT');
    });
});