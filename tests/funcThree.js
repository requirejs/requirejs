run.def("funcThree",
    ["funcFour"],
    function (four) {
        var three = function (arg) {
            return arg + "-" + run.get("funcFour").suffix();
        };

        three.suffix = function () {
            return "THREE_SUFFIX";
        };
        
        return three;
    }
);
