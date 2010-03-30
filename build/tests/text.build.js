//A simple build file using the tests directory for requirejs
{
    baseUrl: "../../tests/text",
    dir: "builds/text",
    optimize: "none",

    modules: [
        {
            name: "widget",
            includeRequire: true
        }
    ]
}
