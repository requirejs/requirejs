//A build file that builds run in different configurations via pragmas.
run({
        baseUrl: ".",
        runUrl: "../../run.js",
        includeRun: true,
        dir: "build",
        //optimize: "none",
        pragmas: {
            runExcludeModify: true,
            runExcludePlugin: true,
            runExcludePageLoad: true,
            runExcludeContext: true
        }
    },
    "nomodifypluginspagecontext-run"
);

run({
        includeRun: true,
        override: {
            pragmas: {
                runExcludeModify: true,
                runExcludePlugin: true,
                runExcludePageLoad: true
            }
        }
    },
    "nomodifypluginspage-run"
);

run({
        includeRun: true,
        override: {
            pragmas: {
                runExcludeModify: true,
                runExcludePlugin: true,
                runExcludeContext: true
            }
        }
    },
    "nomodifypluginscontext-run"
);

run({
        includeRun: true,
        override: {
            pragmas: {
                runExcludeModify: true,
                runExcludePlugin: true
            }
        }
    },
    "nomodifyplugins-run"
);

run({
        includeRun: true,
        override: {
            pragmas: {
                runExcludeModify: true
            }
        }
    },
    "nomodify-run"
);

run({
        includeRun: true,
        override: {
            pragmas: {
                runExcludePlugin: true
            }
        }
    },
    "noplugins-run"
);

run({
        includeRun: true,
        override: {
            pragmas: {
            }
        }
    },
    "run"
);

run({
        includeRun: true,
        override: {
            pragmas: {
            }
        }
    },
    "allplugins-run",
    ["run/i18n", "run/text"]
);
