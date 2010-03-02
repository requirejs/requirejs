//A simple build file using the tests directory for requirejs
require({
        appDir: "./css",
        dir: "cssbuild",
        requireUrl: "../../require.js",
        optimize: "none"
    }
);
