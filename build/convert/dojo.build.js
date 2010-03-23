//A build file that builds require in different configurations via pragmas.
require({
        baseUrl: "./dojorequire",
        requireUrl: "../../require.js",
        includeRequire: true,
        //optimize: "none",
        dir: "build",
        pragmas: {
            useStrict: false,
            dojoConvert: true
        }
    },
    "dojo",
    ["require/text", "require/i18n", "dojo/_base"]
);

require("dijit/dijit");

require("dijit/dijit-all");
