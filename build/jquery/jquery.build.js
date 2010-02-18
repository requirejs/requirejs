//A build file that builds require in different configurations via pragmas.
require({
        baseUrl: ".",
        requireUrl: "../../require.js",
        includeRequire: true,
        dir: "dist",
        optimize: "none",
        inlineText: false,
        pragmas: {
            jquery: true,
            requireExcludeModify: true,
            requireExcludePlugin: true,
            requireExcludePageLoad: true,
            requireExcludeContext: true
        }
    },
    "jquery-require"
);

require({
        includerequire: true,
        override: {
            pragmas: {
                jquery: true,
                requireExcludeModify: true,
                requireExcludePageLoad: true,
                requireExcludeContext: true
            }
        }
    },
    "jquery-plugin-require"
);

require({
        includerequire: true,
        override: {
            pragmas: {
                jquery: true,
                requireExcludeModify: true,
                requireExcludePageLoad: true,
                requireExcludeContext: true
            }
        }
    },
    "jquery-allplugins-require",
    ["require/i18n", "require/text"]
);
