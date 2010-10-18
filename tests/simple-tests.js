require({
        baseUrl: "./"
    },
    ["require", "map", "simple", "dimple", "func"],
    function(require, map, simple, dimple, func) {
        doh.register(
            "simple", 
            [
                function colors(t){
                    t.is("map", map.name);
                    t.is("blue", simple.color);
                    t.is("dimple-blue", dimple.color);
                    t.is("You called a function", func());
                }
            ]
        );
        doh.run();
    }
);
