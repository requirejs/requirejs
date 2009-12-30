//A build file that builds run in different configurations via pragmas.
run({
        baseUrl: "./dojorun",
        runUrl: "../../run.js",
        includeRun: true,
        optimize: "none",
        dir: "build",
        skipPragmas: false
    },
    "dojo",
    ["dojo._base"]
);

run("dijit.dijit");

run("dijit.dijit-all");
