//A build file that builds run in different configurations via pragmas.
run({
        baseUrl: ".",
        runUrl: "../../run.js",
        includeRun: true,
        dir: "build",
        //optimize: "none",
        pragmas: {
            run: {
                excludeModify: true,
                excludePlugin: true,
                excludePageLoad: true,
                excludeContext: true
            }
        }
    },
    "run-nomodifypluginspagecontext"
);

run({
        includeRun: true,
        override: {
            pragmas: {
                run: {
                    excludeModify: true,
                    excludePlugin: true,
                    excludePageLoad: true
                }
            }
        }
    },
    "run-nomodifypluginspage"
);

run({
        includeRun: true,
        override: {
            pragmas: {
                run: {
                    excludeModify: true,
                    excludePlugin: true,
                    excludeContext: true
                }
            }
        }
    },
    "run-nomodifypluginscontext"
);

run({
        includeRun: true,
        override: {
            pragmas: {
                run: {
                    excludeModify: true,
                    excludePlugin: true
                }
            }
        }
    },
    "run-nomodifyplugins"
);

run({
        includeRun: true,
        override: {
            pragmas: {
                run: {
                    excludeModify: true
                }
            }
        }
    },
    "run-nomodify"
);

run({
        includeRun: true,
        override: {
            pragmas: {
                run: {
                    excludePlugin: true
                }
            }
        }
    },
    "run-noplugins"
);

run({
        includeRun: true,
        override: {
            pragmas: {
                run: {
                }
            }
        }
    },
    "run-all"
);

run({
        includeRun: true,
        override: {
            pragmas: {
                run: {
                }
            }
        }
    },
    "run-allplugins",
    ["run/i18n", "run/text"]
);
