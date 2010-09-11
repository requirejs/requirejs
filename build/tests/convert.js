/*jslint plusplus: false */
/*global load: false, doh: false, parse: false */

"use strict";

//Load the file to test.
load("../jslib/commonJs.js");

doh.register(
    "convert", 
    [
        function commonJsConvert(t) {
            var source1 = 'require.def("fake", {lol: "you guise"});',
                source2 = 'require.def("fake", [],\nfunction(){\nreturn{lol : \'you guise\'};\n});';

            t.is(source1, commonJs.convert('fake', 'fake.js', source1));
            t.is(source2, commonJs.convert('fake', 'fake.js', source2));
        }
    ]
);
doh.run();
