/*jslint plusplus: false, strict: false  */
/*global load: false, doh: false, require:false */

define(['require', 'parse'], function (require, parse) {

    doh.register(
        "parseStealCalls",
        [
            function parseStealCalls(t) {
                var good1 = "steal.plugins('foo','bar').views('//abc/init.ejs').then(function(){})",
                    good2 = "steal('one', 'two')";

                t.is('require(["foo","bar","ejs!abc/init.ejs"]);', parse("good1", good1));
                t.is('require(["one","two"]);', parse("good2", good2));
            }
        ]
    );
    doh.run();

});
