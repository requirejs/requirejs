//A simple build file using the tests directory for requirejs
{
    baseUrl: "../../tests/text",
    paths: {
        text: "../../text"
    },
    dir: "builds/text",
    optimize: "none",

    modules: [
        {
            name: "widget"
        }
    ]
}
