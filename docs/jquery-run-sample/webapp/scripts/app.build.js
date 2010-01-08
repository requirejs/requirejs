run({
        appDir: "../",
        baseUrl: "scripts/",
        runUrl: "../../../../run.js",
        dir: "../../webapp-build",
        //Comment out the optimize line if you want
        //the code minified by Closure Compiler using
        //the "simple" optimizations mode
        optimize: "none",
        inlineText: false,
        execModules: false
    },
    "app"
);
