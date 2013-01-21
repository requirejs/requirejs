define('c1', {
    name: 'c1'
});
define('c2', {
    name: 'c2'
});
define('c3', {
    name: 'c3'
});

define(['c1', 'c2', 'c3'], function (c1, c2, c3) {
    return {
        name: 'build1',
        c1: c1,
        c2: c2,
        c3: c3
    };
});
