require.def(["red", "blue"], function (red, blue) {
    return {
        name: red.name + blue.name
    };
});
