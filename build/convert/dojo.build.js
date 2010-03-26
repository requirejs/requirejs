//A build file that builds require in different configurations via pragmas.
require({
        baseUrl: "./dojorequire",
        requireUrl: "../../require.js",
        includeRequire: true,
        //optimize: "none",
        locale: "en-us",
        dir: "dojo-build",
        pragmas: {
            useStrict: false,
            dojoConvert: true
        }
    },
    "dojo",
    ["require/text", "require/i18n"]
);

require("dijit/dijit");

require("dijit/dijit-all");
