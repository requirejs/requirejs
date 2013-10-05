doh.register(
    'testShouldNotRun',
    [
        function testShouldNotRun(t){
            t.assertTrue(false);
        }
    ]
);
doh.run();