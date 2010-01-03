//A build file that builds run in different configurations via pragmas.
run({
        baseUrl: "./dojorun",
        runUrl: "../../run.js",
        includeRun: true,
        optimize: "none",
        dir: "build",
        skipPragmas: true
    },
    "dojo",
    ["run/text", "run/i18n", "dojo/_base"]
);

run("dijit/dijit");

run("dijit/dijit-all");
