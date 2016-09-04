define(function (require) {
    //Test a full URL dependency inside simplified wrapper.
    require('https://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js');

    //Test protocol relative URL.
	require('//ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js');

    var s = '<img src="//www.example.com/loading.gif"/>'; var util = require('util');

    var t = '<img src=//www.example.com/loading.gif/>'; var util2 = require('util2');

    //Make sure that this does not match, a string with no semicolon
    //after it, but with a line break before a commented out require.
    var something = 'something'
//require('bad');

	//--------
    //This will match if this comment removed to here: var something = 'something'// require('bad');
	//--------

    function noop() {};

    return {
        isFunction: jQuery.isFunction(noop),
        swfobject: swfobject,
        util: util,
        util2: util2
    };
});
