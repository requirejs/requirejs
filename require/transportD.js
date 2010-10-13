/**
 * @license RequireJS transportD Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint  */
/*global require: false */
"use strict";

/**
 * An adapter for the CommonJS Transport/D proposal:
 * http://wiki.commonjs.org/wiki/Modules/Transport/D
 * NOTE: this integration does NOT support contexts, so only one version in the page.
 * @param {Object} modules a dictionary of module names with module descriptors
 * @param [Array] dependencies a list of module names that are dependencies for
 * all the modules listed in the modules argument.
 */
require.define = function (modules, dependencies) {
    var moduleName, descriptor;
    for (moduleName in modules) {
        if (modules.hasOwnProperty(moduleName)) {
            descriptor = modules[moduleName];
            require.def(
                moduleName,
                (descriptor.injects || ["require", "exports", "module"]).concat(dependencies || []),
                typeof descriptor === "function" ? descriptor : descriptor.factory
            );
        }
    }
};
