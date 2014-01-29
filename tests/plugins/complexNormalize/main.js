define(['sub/modA1', 'sub/plugin!modB1'], function (modAName, modBName) {
    doh.register(
        'complexNormalize',
        [
            function complexNormalize(t){
                t.is(true, /normalized/i.test(modAName));
                t.is(true, /normalized/i.test(modBName));
            }
        ]
    );
    doh.run();
});
