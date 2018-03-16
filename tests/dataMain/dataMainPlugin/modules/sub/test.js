define(['./a'], function (a) {
    doh.register(
        "dataMainPlugin",
        [
            function dataMainPlugin(t){
                t.is("a", a.name);
            }
        ]
    );
    doh.run();
});
