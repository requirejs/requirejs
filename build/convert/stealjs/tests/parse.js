/*jslint plusplus: false */
/*global load: false, doh: false, require:false */

"use strict";

require(['require', 'parse'], function (require, parse) {

debugger;

    doh.register(
        "parse-stealjs",
        [
            function stealCalls(t) {
                var good1 = "steal.plugins('foo','bar').views('//abc/init.ejs').then(function(){})";


//Try: steal('one, 'two') also?

                t.is('require(["foo","bar","ejs!abc/init.ejs"]);', parse("good1", good1));
            }
        ]
    );
    doh.run();

});