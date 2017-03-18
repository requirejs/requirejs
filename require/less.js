/**
 * @license RequireJS text Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 *
 * @author	Diogo Resende <dresende@thinkdigital.pt>
 *
 * Load .less files asynchronously as stylesheets
 */
/*jslint regexp: false, nomen: false, plusplus: false */
/*global require: false, XMLHttpRequest: false, ActiveXObject: false */
"use strict";

(function () {
	require.plugin({
		"prefix": "less",
		
		"load": function (fileName, contextName) {
			var url = require.nameToUrl(fileName, ".less", contextName);
			var style = document.createElement("link");

			style.rel = "stylesheet";
			style.type = "text/css";
			style.href = url;

			document.getElementsByTagName("head")[0].appendChild(style);
		},
		"isWaiting": function (context) {
			return false;
		}
	});
}());
