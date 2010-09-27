require.def(function (require) {
    var foo = require('../foo');
    return {
        name: 'ALPHA' + foo.name
    };
});
