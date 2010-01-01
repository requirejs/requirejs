//A simple build file using the circular tests for runjs
run({
        baseUrl: "../../tests",
        runUrl: "../../run.js",
        optimize: "none",
        execModules: false,
        dir: "buildcircular"
    },
    "two"
);

run("funcTwo");

run("funcThree");
