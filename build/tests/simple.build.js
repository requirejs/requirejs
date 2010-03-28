//A simple build file using the tests directory for requirejs
require({
        baseUrl: "../../tests",
        includeRequire: true,
        optimize: "none"
    },
    "one",
    ["dimple"]
);
