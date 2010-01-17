run.def("funcTwo",
    ["funcOne"],
    function () {
        var two = function (name) {
            this.name = name;
            this.one = new (run.get("funcOne"))("ONE");
        };
    
        two.prototype.oneName = function () {
            return this.one.getName();
        };

        return two;
    }
);
