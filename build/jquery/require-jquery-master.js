{
    baseUrl: ".",
    out: "dist/require-jquery-master.js",
    optimize: "none",

    paths: {
        "jquery": "jquery-master"
    },
    include: ["jquery"],
    includeRequire: true,
    skipModuleInsertion: true,
    pragmas: {
        jquery: true,
        requireExcludePlugin: true
    }
}
