//Example layer file.

"use strict";
/*global run: false */

run.pause();

run(
    "alpha",
    ["beta", "gamma"],
    function (beta, gamma) {
        return {
            name: "alpha",
            betaName: beta.name
        };
    }
);

run(
    "beta",
    ["gamma"],
    function (gamma) {
        return {
            name: "beta",
            gammaName: gamma.name
        };
    }
);

run(
    "gamma",
    ["epsilon"],
    function (epsilon) {
        return {
            name: "gamma",
            epsilonName: epsilon.name
        };
    }
);

run.resume();
