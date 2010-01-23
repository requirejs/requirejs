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
