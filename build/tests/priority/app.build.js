{
    appDir: "webapp",
    baseUrl: "scripts",
    dir: "webapp-build",
    optimize: "none",
    paths: {
        "jquery": "require-jquery"
    },
    modules: [
        {
            name: "appcommon",
            create: true,
            exclude: ["jquery"],
            include: ["object", "event", "widget", "Dialog"]
        },
        {
            name: "page1",
            exclude: ["jquery", "appcommon"]
        },
        {
            name: "page2",
            exclude: ["jquery", "appcommon"]
        }
    ]
}
