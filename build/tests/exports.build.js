//A simple build file using the tests directory for requirejs
{
    baseUrl: "../../tests/exports",
    inlineText: false,
    dir: "builds/exports",
    optimize: "none",
    modules: [
        {
            name: "simpleReturn"
        }
    ]
}
