//A simple build file using the circular tests for requirejs
({
    baseUrl: "../../tests",
    optimize: "none",
    dir: "buildcircular",

    modules: [
        {
            name: "two"
        },
        {
            name: "funcTwo"
        },
        {
            name: "funcThree"
        }
    ]
})
