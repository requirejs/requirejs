run(
    "funcOne",
    Function,
    ["funcTwo"],
    function (two) {
        var one = function (name) {
            this.name = name;
        };
    
        one.prototype.getName = function () {
            var inst = new two("-NESTED");
            return this.name + inst.name;
        };

        return one;
    }
);
