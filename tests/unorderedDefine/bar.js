// bar.js
define('bar', function(require) {
    var foo = require("./foo");
    return {
      name: 'bar',
      foo: foo
    };
});
define('foo', function () {});

