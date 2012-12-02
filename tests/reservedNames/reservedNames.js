require(["hasOwnProperty", "properModule"], function(hasOwnProperty, myModule) {
        
        doh.register(
            "reservedNamesTests",
            [
                function hasOwnPropertyTests(t){
                    t.is("object", typeof hasOwnProperty);      // bad it's overwritten
                    t.is(true, hasOwnProperty.herpderp);        
                    t.is(false, myModule.herpderp)
                }
            ]
        );
    }
);
require(["constructor", "valueOf"], function() {
        doh.register(
            "reservedNamesTests",
            [
                function constructorTests(t){
                    t.is("function", typeof constructor);       // safe
                    t.is("function", typeof valueOf);           // safe
                }
            ]
        );
    }
);
require(["constructor", "valueOf"], function(constructor, valueOf) {
        doh.register(
            "reservedNamesTests",
            [
                function valueOfTests(t){
                    t.is("function", typeof hasOwnProperty);        // safe
                    t.is("object", typeof constructor);             // bad it's overwritten
                    t.is(true, constructor.herpderp);
                    t.is("object", typeof valueOf);                 // bad it's overwritten
                    t.is(true, valueOf.herpderp)
                }
            ]
        );
        doh.run();
    }
);