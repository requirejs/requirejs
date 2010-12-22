//A build file that builds require in different configurations via pragmas.
({
    baseUrl: ".",
    dir: "build",
    optimize: "none",
    skipModuleInsertion: true,

    modules: [
        {
            name: "require",
            create: true,
            includeRequire: true
        },
        {
            name: "allplugins-require",
            create: true,
            include: ["require/i18n", "require/text", "require/order"],
            includeRequire: true
        }

    ]
})
