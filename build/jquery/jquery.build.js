//A build file that builds require in different configurations via pragmas.
require({
        baseUrl: ".",
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
        includeRequire: true,
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
