//A simple build file using the tests directory for requirejs
{
    baseUrl: "../../tests/text",
    paths: {
        text: "../../text"
    },
    dir: "builds/textExclude",
    optimize: "none",

    modules: [
        {
            name: "widget",
            exclude: ['text!subwidget2.html']
        }
    ]
}
