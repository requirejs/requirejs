{
    baseUrl: ".",
    paths: {
        "jquery": "jquery-1.4.3"
    },
    out: "dist/require-jquery.js",
    optimize: "none",

    include: ["jquery"],
    includeRequire: true,
    skipModuleInsertion: true,
    pragmas: {
        jquery: true,
        requireExcludePlugin: true
    }
}
