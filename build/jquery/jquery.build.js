//A build file that builds run in different configurations via pragmas.
run({
        baseUrl: ".",
        runUrl: "../../run.js",
        includeRun: true,
        dir: "dist",
        optimize: "none",
        inlineText: false,
        pragmas: {
            jquery: true,
            runExcludeModify: true,
            runExcludePlugin: true,
            runExcludePageLoad: true,
            runExcludeContext: true
        }
    },
    "jquery-run"
);
