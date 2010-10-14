require.def('req/bootstrap', [
	'req/begin',
	'req/config',
	'req/utils/utils'
	], function() {
		ip.bootstrap = 'bootstrap';
	});


/*
//begin module defines a global
var begin = {};
require.def('begin', function () {
    begin.name = 'begin';
});

//appConfig defines a global.
var appConfig = {};
require.def('appConfig', ['begin'], function () {
    appConfig.state = 'alpha';
});

require.def('bootstrap', ['begin', 'appConfig'], function () {
    appConfig.bootstrap = 'bootstrap';
});
*/
