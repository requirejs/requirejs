/* 
 * 
 *  @overview 
 *  @author Daniel Goberitz <dalgo86@gmail.com>
 * 
 */

define('module', {
	parseName: function(name){
		if(name.indexOf('modules/') === -1){
			// module!projects -> modules/projects/controllers/projectsController.js
			return 'modules/' + name + '/controllers/' + name + 'Controller.js';
		}else{
			return name;
		}
	},
	normalize: function(name, normalize){
		return normalize(name);
	},
	load: function (name, req, onload, config) {
		var toLoad = req.toUrl(this.parseName(name));
		require([toLoad], function (value) {
			onload(value);
		});
	}
});
