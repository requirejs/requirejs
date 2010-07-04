require.def("three", {
    name: "three"
});

require.def("four", ["three"], function (three) {
    return {
        name: "four",
        threeName: "three"
    };
});
