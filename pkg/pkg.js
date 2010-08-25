/**
 * @license Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint regexp: false, nomen: false, plusplus: false */
/*global  */

"use strict";

(function (args) {
    var requireBuildPath = args[0];
    if (requireBuildPath.charAt(requireBuildPath.length - 1) !== "/") {
        requireBuildPath += "/";
    }
    load(requireBuildPath + "jslib/pkg.js");
    pkg(args);

}(Array.prototype.slice.call(arguments)));
