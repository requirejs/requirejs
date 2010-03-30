//A simple build file using the tests directory for requirejs
{
    baseUrl: "../../tests",
    optimize: "none",
    dir: "builds/simple",
    modules: [
        {
            name: "one",
            include: ["dimple"],
            includeRequire: true
        }
    ]
}
