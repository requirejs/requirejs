{
    baseUrl: ".",
    paths: {
        "jquery": "jquery-1.4.4"
    },
    out: "dist/require-jquery.js",
    optimize: "none",

    include: ["jquery"],
    includeRequire: true,
    skipModuleInsertion: true,
    pragmas: {
        jquery: true
    }
}
