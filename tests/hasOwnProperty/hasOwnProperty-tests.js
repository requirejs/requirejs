require(["toString", "hasOwnProperty"], function(toString, hop) {
        doh.register(
            "hasOwnPropertyTests",
            [
                function hasOwnPropertyTests(t){
                    t.is("toString", toString.name);
                    t.is("hasOwnProperty", hop.name)
                }
            ]
        );
        doh.run();
    }
);
