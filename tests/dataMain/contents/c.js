doh.register(
    'testShouldRun',
    [
        function testShouldRun(t){
            t.assertTrue(true);
        }
    ]
);
doh.run();