/* 
 * 
 *  @overview 
 *  @author Daniel Goberitz <dalgo86@gmail.com>
 * 
 */

(function(){
	
	var req = require.config({
		baseUrl: '/requirejs/tests/pathsNrelative/app/',
		paths: {
			'relativeModule': 'relative/relativeThing/'
		}
	});
	
	req(['relativeModule'], function(testee){
		doh.register(
            "pathsNrelative",
            [
                function pathsNrelative(t){
                    t.is("relativeThing", testee.testName);
                    t.is("TheHelper", testee.TheHelper.testName);
                }
            ]
        );
		doh.run();
	});
	
}());
