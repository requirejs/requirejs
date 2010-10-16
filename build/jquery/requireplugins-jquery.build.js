{
    baseUrl: ".",
    paths: {
        "jquery": "jquery-1.4.3"
    },
    out: "dist/requireplugins-jquery.js",
    optimize: "none",

    include: ["require/i18n", "require/text", "require/jsonp", "require/order", "jquery"],
    includeRequire: true,
    skipModuleInsertion: true,
    pragmas: {
        jquery: true
    }
}
