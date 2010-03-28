//A simple build file using the tests directory for requirejs
require({
        baseUrl: "../../tests/text",
        includeRequire: true,
        dir: "buildtext",
        optimize: "none"
    },
    "widget"
);
