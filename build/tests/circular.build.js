//A simple build file using the circular tests for requirejs
require({
        baseUrl: "../../tests",
        requireUrl: "../../require.js",
        optimize: "none",
        execModules: false,
        dir: "buildcircular"
    },
    "two"
);

require("funcTwo");

require("funcThree");
