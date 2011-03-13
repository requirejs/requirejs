({
    appDir: "../",
    baseUrl: "scripts",
    dir: "../../webapp-build",
    //Comment out the optimize line if you want
    //the code minified by UglifyJS
    optimize: "none",

    modules: [
        {
            //If you have multiple pages in your app, you may
            //want jQuery cached separately from the optimized
            //main module. In that case, uncomment the exclude
            //directive below.
            //exclude: ["jquery"],
            name: "main"
        }
    ]
})
