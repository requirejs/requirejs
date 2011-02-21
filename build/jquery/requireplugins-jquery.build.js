{
    baseUrl: ".",
    paths: {
        "jquery": "jquery-1.4.4",
        text: "../../text",
        i18n: "../../i18n",
        order: "../../order"
    },
    out: "dist/requireplugins-jquery.js",
    optimize: "none",

    include: ["i18n", "text", "order", "jquery"],
    includeRequire: true,
    skipModuleInsertion: true,
    pragmas: {
        jquery: true
    }
}
