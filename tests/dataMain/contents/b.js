doh.register(
    'testShouldAlsoNotRun',
    [
        function testShouldNotRun(t){
            t.assertTrue(false);
        }
    ]
);
doh.run();