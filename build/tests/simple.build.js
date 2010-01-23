//A simple build file using the tests directory for requirejs
require({
        baseUrl: "../../tests",
        requireUrl: "../../require.js",
        includeRequire: true,
        optimize: "none"
    },
    "one",
    ["dimple"]
);
