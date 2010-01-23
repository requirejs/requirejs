//A simple build file using the tests directory for requirejs
require({
        baseUrl: "../../tests/text",
        requireUrl: "../../require.js",
        includeRequire: true,
        dir: "buildtext",
        optimize: "none"
    },
    "widget"
);
