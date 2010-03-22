require({
        appDir: "../",
        baseUrl: "scripts/",
        requireUrl: "../../../../require.js",
        dir: "../../webapp-build",
        //Comment out the optimize line if you want
        //the code minified by Closure Compiler using
        //the "simple" optimizations mode
        optimize: "none",
        inlineText: false
    },
    "app"
);
