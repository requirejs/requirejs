//A simple build file using the tests directory for requirejs
{
    appDir: "../../",
    baseUrl: "tests/i18n",
    inlineText: false,
    dir: "builds/i18n",
    locale: "en-us-surfer",
    optimize: "none",
    modules: [
        {
            name: "testModule"
        }
    ]
}
