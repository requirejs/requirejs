(function () {
    var n = 'badUse' + (globalCounter += 1);
    console.log(n);

    define(function () {
        return {
            name: n
        };
    });

}());