//A simple build file using the tests directory for requirejs
({
    baseUrl: "../../tests/plugins/",
    optimize: "none",
    name: "earth",
    include: ["prime/earth"],
    out: "builds/indexPlugin.js"
})
