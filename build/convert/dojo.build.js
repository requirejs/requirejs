//A build file that builds require in different configurations via pragmas.
{
    baseUrl: "./dojorequire",
    //optimize: "none",
    locale: "en-us",
    dir: "dojo-build",
    pragmas: {
        useStrict: false,
        dojoConvert: true
    },

    modules: [
        {
            name: "dojo",
            include: ["require/text", "require/i18n"],
            includeRequire: true
        },
        {
            name: "dijit/dijit"
        },
        {
            name: "dijit/dijit-all"
        }
    ]
    
}
