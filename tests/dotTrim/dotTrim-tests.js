require(["spell"], function(spell) {
    doh.register(
        "dotTrim",
        [
            function dotTrim(t){
                t.is('spell', spell.name);
                t.is('ext', spell.ext.name);
                t.is('./util/helper', spell.ext.helperPath);
                t.is('helper', spell.ext.helper.name);
            }
        ]
    );

    doh.run();
});
