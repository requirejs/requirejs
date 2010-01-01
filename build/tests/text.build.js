//A simple build file using the tests directory for runjs
run({
        baseUrl: "../../tests/text",
        runUrl: "../../run.js",
        includeRun: true,
        dir: "buildtext",
        optimize: "none"
    },
    "widget"
);
