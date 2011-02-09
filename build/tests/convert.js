/*jslint plusplus: false, strict: false */
/*global doh: false, define: false */

define(['commonJs'], function (commonJs) {
    doh.register(
        "convert",
        [
            function commonJsConvert(t) {
                var source1 = 'require.def("fake", {lol: "you guise"});',
                    source2 = 'require.def("fake", [],\nfunction(){\nreturn{lol : \'you guise\'};\n});';

                t.is(source1, commonJs.convert('fake.js', source1));
                t.is(source2, commonJs.convert('fake.js', source2));
            }
        ]
    );
    doh.run();
});
