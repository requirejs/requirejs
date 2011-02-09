/**
 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint plusplus: false, strict: false */
/*global define: false */

define(['uglifyjs/index'], function (uglify) {
    var parser = uglify.parser,
        processor = uglify.uglify,
        ostring = Object.prototype.toString,
        isArray;

    if (Array.isArray) {
        isArray = Array.isArray;
    } else {
        isArray = function (it) {
            return ostring.call(it) === "[object Array]";
        };
    }

    /**
     * Determines if the AST node is an array literal
     */
    function isArrayLiteral(node) {
        return node[0] === 'array';
    }

    /**
     * Determines if the AST node is an object literal
     */
    function isObjectLiteral(node) {
        return node[0] === 'object';
    }

    /**
     * Validates a node as being an object literal (like for i18n bundles)
     * or an array literal with just string members.
     * This function does not need to worry about comments, they are not
     * present in this AST.
     */
    function validateDeps(node) {
        var arrayArgs, i, dep;

        if (isObjectLiteral(node) || node[0] === 'function') {
            return true;
        }

        //Dependencies can be an object literal or an array.
        if (!isArrayLiteral(node)) {
            return false;
        }

        arrayArgs = node[1];

        for (i = 0; i < arrayArgs.length; i++) {
            dep = arrayArgs[i];
            if (dep[0] !== 'string') {
                return false;
            }
        }
        return true;
    }

    /**
     * Main parse function. Returns a string of any valid require or define/require.def
     * calls as part of one JavaScript source string.
     * @param {String} fileName
     * @param {String} fileContents
     * @returns {String} JS source string or null, if no require or define/require.def
     * calls are found.
     */
    function parse(fileName, fileContents) {
        //Set up source input
        var matches = [], result = null,
            astRoot = parser.parse(fileContents);

        parse.recurse(astRoot, matches);

        if (matches.length) {
            result = matches.join("\n");
        }

        return result;
    }

    //Add some private methods to object for use in derived objects.
    parse.isArray = isArray;
    parse.isObjectLiteral = isObjectLiteral;
    parse.isArrayLiteral = isArrayLiteral;

    /**
     * Handles parsing a file recursively for require calls.
     * @param {Array} parentNode the AST node to start with.
     * @param {Array} matches where to store the string matches
     */
    parse.recurse = function (parentNode, matches) {
        var i, node, parsed;
        if (isArray(parentNode)) {
            for (i = 0; i < parentNode.length; i++) {
                node = parentNode[i];
                if (isArray(node)) {
                    parsed = this.parseNode(node);
                    if (parsed) {
                        matches.push(parsed);
                    }
                    this.recurse(node, matches);
                }
            }
        }
    };

    /**
     * Determines if the file defines require().
     * @param {String} fileName
     * @param {String} fileContents
     * @returns {Boolean}
     */
    parse.definesRequire = function (fileName, fileContents) {
        var astRoot = parser.parse(fileContents);
        return this.nodeHasRequire(astRoot);
    };

    /**
     * Finds require("") calls inside a CommonJS anonymous module wrapped in a
     * define/require.def(function(require, exports, module){}) wrapper. These dependencies
     * will be added to a modified define() call that lists the dependencies
     * on the outside of the function.
     * @param {String} fileName
     * @param {String} fileContents
     * @returns {Array} an array of module names that are dependencies. Always
     * returns an array, but could be of length zero.
     */
    parse.getAnonDeps = function (fileName, fileContents) {
        var astRoot = parser.parse(fileContents),
            deps = [],
            defFunc = this.findAnonRequireDefCallback(astRoot);

        //Now look inside the def call's function for require calls.
        if (defFunc) {
            this.findRequireDepNames(defFunc, deps);

            //If no deps, still add the standard CommonJS require, exports, module,
            //in that order, to the deps.
            deps = ["require", "exports", "module"].concat(deps);
        }

        return deps;
    };

    /**
     * Finds the function in require.def or define(function (require, exports, module){});
     * @param {Array} node
     * @returns {Boolean}
     */
    parse.findAnonRequireDefCallback = function (node) {
        var callback, i, n, call, args;

        if (isArray(node)) {
            if (node[0] === 'call') {
                call = node[1];
                args = node[2];
                if ((call[0] === 'name' && call[1] === 'define') ||
                           (call[0] === 'dot' && call[1][1] === 'require' && call[2] === 'def')) {

                    //There should only be one argument and it should be a function.
                    if (args.length === 1 && args[0][0] === 'function') {
                        return args[0];
                    }

                }
            }

            //Check child nodes
            for (i = 0; i < node.length; i++) {
                n = node[i];
                if ((callback = this.findAnonRequireDefCallback(n))) {
                    return callback;
                }
            }
        }

        return null;
    };

    parse.findRequireDepNames = function (node, deps) {
        var moduleName, i, n, call, args;

        if (isArray(node)) {
            if (node[0] === 'call') {
                call = node[1];
                args = node[2];

                if (call[0] === 'name' && call[1] === 'require') {
                    moduleName = args[0];
                    if (moduleName[0] === 'string') {
                        deps.push(moduleName[1]);
                    }
                }


            }

            //Check child nodes
            for (i = 0; i < node.length; i++) {
                n = node[i];
                this.findRequireDepNames(n, deps);
            }
        }
    };

    /**
     * Determines if a given node contains a require() definition.
     * @param {Array} node
     * @returns {Boolean}
     */
    parse.nodeHasRequire = function (node) {
        if (this.isRequireNode(node)) {
            return true;
        }

        if (isArray(node)) {
            for (var i = 0, n; i < node.length; i++) {
                n = node[i];
                if (this.nodeHasRequire(n)) {
                    return true;
                }
            }
        }

        return false;
    };

    /**
     * Is the given node the actual definition of require()
     * @param {Array} node
     * @returns {Boolean}
     */
    parse.isRequireNode = function (node) {
        //Actually look for the require.s = assignment, since
        //that is more indicative of RequireJS vs a plain require definition.
        var assign;
        if (!node) {
            return null;
        }

        if (node[0] === 'assign' && node[1] === true) {
            assign = node[2];
            if (assign[0] === 'dot' && assign[1][0] === 'name' &&
                assign[1][1] === 'require' && assign[2] === 's') {
                return true;
            }
        }
        return false;
    };

    function optionalString(node) {
        var str = null;
        if (node) {
            str = parse.nodeToString(node);
        }
        return str;
    }

    /**
     * Convert a require/require.def/define call to a string if it is a valid
     * call via static analysis of dependencies.
     * @param {String} callName the name of call (require or define)
     * @param {Array} the config node inside the call
     * @param {Array} the name node inside the call
     * @param {Array} the deps node inside the call
     */
    parse.callToString = function (callName, config, name, deps) {
        //If name is an array, it means it is an anonymous module,
        //so adjust args appropriately. An anonymous module could
        //have a FUNCTION as the name type, but just ignore those
        //since we just want to find dependencies.
        var configString, nameString, depString;
        if (name && isArrayLiteral(name)) {
            deps = name;
            name = null;
        }

        if (deps && !validateDeps(deps)) {
            return null;
        }

        //Only serialize the call name, config, module name and dependencies,
        //otherwise could get local variable names for module value.
        configString = config && isObjectLiteral(config) && optionalString(config);
        nameString = optionalString(name);
        depString = optionalString(deps);

        return callName + "(" +
            (configString ? configString : "") +
            (nameString ? (configString ? "," : "") + nameString : "") +
            (depString ? (configString || nameString ? "," : "") + depString : "") +
            ");";
    };

    /**
     * Determines if a specific node is a valid require or define/require.def call.
     * @param {Array} node
     *
     * @returns {String} a JS source string with the valid require/define call.
     * Otherwise null.
     */
    parse.parseNode = function (node) {
        var call, name, config, deps, args;

        if (!isArray(node)) {
            return null;
        }

        if (node[0] === 'call') {
            call = node[1];
            args = node[2];

            if (call[0] === 'name' && call[1] === 'require') {

                //It is a plain require() call.
                config = args[0];
                deps = args[1];
                if (isArrayLiteral(config)) {
                    deps = config;
                    config = null;
                }

                if (!deps || !validateDeps(deps)) {
                    return null;
                }

                return this.callToString("require", null, null, deps);

            } else if ((call[0] === 'name' && call[1] === 'define') ||
                       (call[0] === 'dot' && call[1][1] === 'require' && call[2] === 'def')) {

                //A define or require.def call
                name = args[0];
                deps = args[1];
                return this.callToString("define", null, name, deps);
            }
        }

        return null;
    };

    /**
     * Converts an AST node into a JS source string. Does not maintain formatting
     * or even comments from original source, just returns valid JS source.
     * @param {Array} node
     * @returns {String} a JS source string.
     */
    parse.nodeToString = function (node) {
        return processor.gen_code(node, true);
    };

    return parse;
});
