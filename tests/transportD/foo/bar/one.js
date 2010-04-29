require.def("foo/bar/one",
            ["require", "./two", "../three"],
            function (require, two, three) {
    return {
        name: "one",
        twoName: two.name,
        threeName: three.name
    };
});
