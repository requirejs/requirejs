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
    "nomodifypluginspagecontext-run"
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
    "nomodifypluginspage-run"
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
    "nomodifypluginscontext-run"
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
    "nomodifyplugins-run"
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
    "nomodify-run"
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
    "noplugins-run"
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
    "run"
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
    "allplugins-run",
    ["run/i18n", "run/text"]
);
