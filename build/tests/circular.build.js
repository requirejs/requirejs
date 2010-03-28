//A simple build file using the circular tests for requirejs
require({
        baseUrl: "../../tests",
        optimize: "none",
        execModules: false,
        dir: "buildcircular"
    },
    "two"
);

require("funcTwo");

require("funcThree");
