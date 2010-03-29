//A simple build file using the tests directory for requirejs
{
    baseUrl: "../../tests",
    optimize: "none",
    modules: [
        {
            name: "one",
            include: ["dimple"],
            includeRequire: true
        }
    ]
}
