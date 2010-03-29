//A build file that builds require in different configurations via pragmas.
{
    baseUrl: ".",
    dir: "dist",
    optimize: "none",
    inlineText: false,

    modules: [
        {
            name: "jquery-require",
            includeRequire: true,
            override: {
                pragmas: {
                    jquery: true,
                    requireExcludeModify: true,
                    requireExcludePlugin: true,
                    requireExcludePageLoad: true,
                    requireExcludeContext: true
                }
            }
        },
        {
            name: "jquery-allplugins-require",
            include: ["require/i18n", "require/text"],
            includeRequire: true,
            override: {
                pragmas: {
                    jquery: true,
                    requireExcludeModify: true,
                    requireExcludePageLoad: true,
                    requireExcludeContext: true
                }
            }
        }
    ]
}
