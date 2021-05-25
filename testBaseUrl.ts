define([], () {
    doh.register(
        'testBaseUrl',
        [
            testBaseUrl(t) {
                t.is(true, true);
            }
        ]
    );
    .run();
});
