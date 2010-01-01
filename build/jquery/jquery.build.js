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
            run: {
                jquery: true,
                excludeModify: true,
                excludePlugin: true,
                excludePageLoad: true,
                excludeContext: true
            }
        }
    },
    "jquery-run"
);
