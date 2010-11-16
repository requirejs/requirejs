require({
    baseUrl: require.isBrowser ? "./" : "./package-mappings/",
    packages: [
        {
            name: 'package2-dir',
            location: 'package2-dir',
            // mappings were re-mapped by server-helper to top-level packages
            mappings: {
                "packageA": "package1-dir",
                "packageB": "package3-dir"
            }
        }
    ]});

define("package!package1-dir/package.json", function() {
    return {
        // name gets ignored
        "name": "package1",
        // mappings were re-mapped by server-helper to top-level packages
        "mappings": {
            "package2": "package2-dir"
        }
    };
});

define("package!package3-dir/package.json", function() {
    return {
        "mappings": {
            "package2": "package2-dir"
        }
    };
});
    
require(
    ["require", "package1-dir/main"],
    function(require, main) {
        require.ready(function() {

            main.main();

            doh.register(
                "package-mappings", 
                [
                    function packages(t){
                        t.is(["package-1", "package-2", "package-3", "package-2", "package-1"], main.getMessages());
                    }
                ]
            );
            doh.run();
        });
    });
