define('d1', {
    name: 'd1'
});
define('d2', {
    name: 'd2'
});
define('d3', {
    name: 'd3'
});

define(['d1', 'd2', 'd3'], function (d1, d2, d3) {
    return {
        name: 'build2',
        d1: d1,
        d2: d2,
        d3: d3
    };
});
