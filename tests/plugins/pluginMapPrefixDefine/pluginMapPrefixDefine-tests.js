require({
    map: {
        "*": {
            example: "mapped/example"
        }
    }
});

define("mapped/example", [], function() {
    return {
        // run only if not already defined or in registry
        load: function(name, req, load, config) {
            // prevent timeout error in this test
            config.waitSeconds = 0;

            doh.debug("INFO \"" + name + "\" is not defined or not in regisrty");
        }
    };
});

define("example!A", [], function() {
    doh.debug("INFO \"example!A\" is defined");
    return "MODULE A";
});

define("mapped/example!B", [], function() {
    doh.debug("INFO \"mapped/example!B\" is defined");
    return "MODULE B";
});

require(["example!A", "mapped/example!A", "example!B", "mapped/example!B"], function(exampleA, mappedExampleA, exampleB, mappedExampleB){
    doh.register(
        'pluginMapPrefixDefine',
        [
            function pluginMapPrefixDefine(t){
                t.is('MODULE A', exampleA);
                t.is('MODULE A', mappedExampleA);
                t.is('MODULE B', exampleB);
                t.is('MODULE B', mappedExampleB);
            }
        ]
    );
    doh.run();
});