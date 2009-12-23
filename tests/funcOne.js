run(
    "funcOne",
    ["run", "funcTwo"],
    function (run) {
        var one = function (name) {
            this.name = name;
        };

        one.prototype.getName = function () {
            var inst = new (run.get("funcTwo"))("-NESTED");
            return this.name + inst.name;
        };

        return one;
    }
);
