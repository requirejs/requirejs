run(
    "funcTwo",
    ["funcOne"],
    function (one) {
        var two = function (name) {
            this.name = name;
            this.one = new one("ONE");
        };
    
        two.prototype.oneName = function () {
            return this.one.getName();
        };

        return two;
    }
);
