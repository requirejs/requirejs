//A build file that builds require in different configurations via pragmas.
require({
        baseUrl: ".",
        requireUrl: "../../require.js",
        includeRequire: true,
        dir: "build",
        optimize: "none",
        pragmas: {
            requireExcludeModify: true,
            requireExcludePlugin: true,
            requireExcludePageLoad: true,
            requireExcludeContext: true
        }
    },
    "nomodifypluginspagecontext-require"
);

require({
        includerequire: true,
        override: {
            pragmas: {
                requireExcludeModify: true,
                requireExcludePlugin: true,
                requireExcludePageLoad: true
            }
        }
    },
    "nomodifypluginspage-require"
);

require({
        includerequire: true,
        override: {
            pragmas: {
                requireExcludeModify: true,
                requireExcludePlugin: true,
                requireExcludeContext: true
            }
        }
    },
    "nomodifypluginscontext-require"
);

require({
        includeRequire: true,
        override: {
            pragmas: {
                requireExcludeModify: true,
                requireExcludePlugin: true
            }
        }
    },
    "nomodifyplugins-require"
);

require({
        includeRequire: true,
        override: {
            pragmas: {
                requireExcludeModify: true
            }
        }
    },
    "nomodify-require"
);

require({
        includeRequire: true,
        override: {
            pragmas: {
                requireExcludePlugin: true
            }
        }
    },
    "noplugins-require"
);

require({
        includeRequire: true,
        override: {
            pragmas: {
            }
        }
    },
    "require"
);

require({
        includeRequire: true,
        override: {
            pragmas: {
            }
        }
    },
    "allplugins-require",
    ["require/i18n", "require/text"]
);
