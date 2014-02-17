/* 
 * 
 *  @overview 
 *  @author Daniel Goberitz <dalgo86@gmail.com>
 * 
 */

(function(){
	
	var req = require.config({
		baseUrl: '/requirejs/tests/pluginStrategyNrelative/app/',
		paths: {
			'strategyPlugin': '../../plugins/strategy/strategyLoader'
		}
	});
	
	req(['strategyPlugin'], function(){
		req(['module!TheModule'], function(testee){
			doh.register(
				"pathsNrelative",
				[
					function pathsNrelative(t){
						t.is("TheController", testee.testName);
						t.is("TheModel", testee.TheModel.testName);
					}
				]
			);
			doh.run();
		});
	});
	
}());
