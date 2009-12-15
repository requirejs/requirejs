run(
    "funcFour",
    Function,
    ["funcThree"],
    function (three) {
        var four = function (arg) {
            return "FOUR called with " + arg;
        };

        four.suffix = function () {
            return three.suffix();
        };
        
        return four;
    }
);
