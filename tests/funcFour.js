run(
    "funcFour",
    ["run", "funcThree"],
    function (run) {
        var four = function (arg) {
            return "FOUR called with " + arg;
        };

        four.suffix = function () {
            return run.get("funcThree").suffix();
        };

        return four;
    }
);
