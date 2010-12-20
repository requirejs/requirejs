//A simple build file using the tests directory for requirejs
{
    baseUrl: "../../tests/order",
    dir: "builds/order",
    optimize: "none",

    modules: [
        {
            name: "foo",
        }
    ]
}
