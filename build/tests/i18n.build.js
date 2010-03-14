//A simple build file using the tests directory for requirejs
require({
        baseUrl: "../../tests/i18n",
        requireUrl: "../../require.js",
        dir: "buildi18n",
        locale: "en-us-surfer",
        optimize: "none"
    },
    "nls/colors"
);
