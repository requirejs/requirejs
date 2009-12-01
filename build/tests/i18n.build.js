//A simple build file using the tests directory for runjs
run({
        baseUrl: "../../tests/i18n",
        runUrl: "../../run.js",
        dir: "buildi18n",
        locale: "en-us-surfer"
    },
    "nls.colors"
);
