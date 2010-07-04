require.def("one", {
    name: "one"
});

require.def("two", ["one"], function (one) {
    return {
        name: "two",
        oneName: "one"
    };
});
