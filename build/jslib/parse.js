/**
 * @license Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
 * Java 6 is required.
 */

/*jslint plusplus: false */
/*global java: false, Packages: false, load: false */

"use strict";

var parse;
(function () {
    //fileContents = 'require.def("foo", ["one", \n//This is a comment\n"two",\n/*Another comment*/"three"], {});',
    //fileContents = 'require.def("foo", {one: "two"});',
    var jscomp = Packages.com.google.javascript.jscomp,
        compiler = new jscomp.Compiler(),

        //Values taken from com.google.javascript.rhino.Token,
        //but duplicated here to avoid weird Java-to-JS transforms.
        GETPROP = 33,
        CALL = 37,
        NAME = 38,
        STRING = 40,
        ARRAYLIT = 63,
        OBJECTLIT = 64,
        ASSIGN = 86,
        FUNCTION = 105,
        EXPR_RESULT = 130,

        //Oh Java, you rascal.
        JSSourceFilefromCode = java.lang.Class.forName('com.google.javascript.jscomp.JSSourceFile').getMethod('fromCode', [java.lang.String, java.lang.String]);

    //Helper for closureOptimize, because of weird Java-JavaScript interactions.
    function closurefromCode(filename, content) {
        return JSSourceFilefromCode.invoke(null, [filename, content]);
    }

    /**
     * Calls node.getString() but makes sure a JS string is returned
     */
    function nodeString(node) {
        return String(node.getString());
    }

    /**
     * Validates a node as being an object literal (like for i18n bundles)
     * or an array literal with just string members.
     * This function does not need to worry about comments, they are not
     * present in this AST.
     */
    function validateDeps(node) {
        var type = node.getType(), i, dep;

        if (type === OBJECTLIT || type === FUNCTION) {
            return true;
        }

        //Dependencies can be an object literal or an array. 
        if (type !== ARRAYLIT) {
            return false;
        }

        for (i = 0; (dep = node.getChildAtIndex(i)); i++) {
            if (dep.getType() !== STRING) {
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
    parse = function (fileName, fileContents) {
        //Set up source input
        var matches = [], result = null,
        jsSourceFile = closurefromCode(String(fileName), String(fileContents)),
        astRoot = compiler.parse(jsSourceFile);

        parse.recurse(astRoot, matches);

        if (matches.length) {
            result = matches.join("\n");
        }

        return result;
    };

    /**
     * Handles parsing a file recursively for require calls.
     * @param {Packages.com.google.javascript.rhino.Node} node
     * @param {Array} matches where to store the string matches
     */
    parse.recurse = function (parentNode, matches) {
        var i, node, parsed;
        for (i = 0; (node = parentNode.getChildAtIndex(i)); i++) {
            parsed = parse.parseNode(node);
            if (parsed) {
                matches.push(parsed);
            }
            parse.recurse(node, matches);
        }        
    };

    /**
     * Determines if the file defines require().
     * @param {String} fileName
     * @param {String} fileContents
     * @returns {Boolean}
     */
    parse.definesRequire = function (fileName, fileContents) {
        var jsSourceFile = closurefromCode(String(fileName), String(fileContents)),
            astRoot = compiler.parse(jsSourceFile);

        return parse.nodeHasRequire(astRoot);
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
        var jsSourceFile = closurefromCode(String(fileName), String(fileContents)),
            astRoot = compiler.parse(jsSourceFile),
            deps = [],
            defFunc = parse.findAnonRequireDefCallback(astRoot);
        
        //Now look inside the def call's function for require calls.
        if (defFunc) {
            parse.findRequireDepNames(defFunc, deps);

            //If no deps, still add the standard CommonJS require, exports, module,
            //in that order, to the deps.
            deps = ["require", "exports", "module"].concat(deps);
        }

        return deps;
    };

    /**
     * Finds the function in require.def(function (require, exports, module){});
     * @param {Packages.com.google.javascript.rhino.Node} node
     * @returns {Boolean}
     */

    parse.findAnonRequireDefCallback = function (node) {
        var methodName, func, callback, i, n;

        if (node.getType() === GETPROP &&
            node.getFirstChild().getType() === NAME &&
            nodeString(node.getFirstChild()) === "require") {

            methodName = nodeString(node.getChildAtIndex(1));
            if (methodName === "def") {
                func = node.getLastSibling();
                if (func.getType() === FUNCTION) {
                    //Bingo.
                    return func;
                }
            }
        } else if (node.getType() === EXPR_RESULT &&
            node.getFirstChild().getType() === CALL &&
            node.getFirstChild().getFirstChild().getType() === NAME &&
            nodeString(node.getFirstChild().getFirstChild()) === "define") {

            func = node.getFirstChild().getFirstChild().getLastSibling();
            if (func.getType() === FUNCTION) {
                //Bingo.
                return func;
            }
        }

        //Check child nodes
        for (i = 0; (n = node.getChildAtIndex(i)); i++) {
            if ((callback = parse.findAnonRequireDefCallback(n))) {
                return callback;
            }
        }

        return null;
    };

    parse.findRequireDepNames = function (node, deps) {
        var moduleName, i, n;

        if (node.getType() === CALL) {
            if (node.getFirstChild().getType() === NAME &&
                nodeString(node.getFirstChild()) === "require") {

                //It is a plain require() call.
                moduleName = node.getChildAtIndex(1);
                if (moduleName.getType() === STRING) {
                    deps.push(nodeString(moduleName));
                }
            }
        }

        //Check child nodes
        for (i = 0; (n = node.getChildAtIndex(i)); i++) {
            parse.findRequireDepNames(n, deps);
        }
    };

    /**
     * Determines if a given node contains a require() definition.
     * @param {Packages.com.google.javascript.rhino.Node} node
     * @returns {Boolean}
     */
    parse.nodeHasRequire = function (node) {
        if (parse.isRequireNode(node)) {
            return true;
        }

        for (var i = 0, n; (n = node.getChildAtIndex(i)); i++) {
            if (parse.nodeHasRequire(n)) {
                return true;
            }
        }

        return false;
    };

    /**
     * Is the given node the actual definition of require()
     * @param {Packages.com.google.javascript.rhino.Node} node
     * @returns {Boolean}
     */
    parse.isRequireNode = function (node) {
        //Actually look for the require.s = assignment, since
        //that is more indicative of RequireJS vs a plain require definition.
        var prop, name, s;
        if (node.getType() === ASSIGN) {
            prop = node.getFirstChild();
            if (prop.getType() === GETPROP) {
                name = prop.getFirstChild();
                if (name.getType() === NAME) {
                    if (nodeString(name) === "require") {
                        s = prop.getChildAtIndex(1);
                        if (s && s.getType() === STRING &&
                            nodeString(s) === "s") {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    };

    /**
     * Convert a require/require.def/define call to a string if it is a valid
     * call via static analysis of dependencies.
     * @param {Packages.com.google.javascript.rhino.Node} the call node
     * @param {Packages.com.google.javascript.rhino.Node} the name node inside the call
     * @param {Packages.com.google.javascript.rhino.Node} the deps node inside the call
     */
    parse.callToString = function (call, name, deps) {
        //If name is an array, it means it is an anonymous module,
        //so adjust args appropriately. An anonymous module could
        //have a FUNCTION as the name type, but just ignore those
        //since we just want to find dependencies.
        //TODO: CHANGE THIS if/when support using a tostring
        //on function to find CommonJS dependencies.
        if (name.getType() === ARRAYLIT) {
            deps = name;
        }

        if (deps && !validateDeps(deps)) {
            return null;
        }

        return parse.nodeToString(call);
    };

    /**
     * Determines if a specific node is a valid require or define/require.def call.
     * @param {Packages.com.google.javascript.rhino.Node} node
     * 
     * @returns {String} a JS source string with the valid require/define call.
     * Otherwise null.
     */
    parse.parseNode = function (node) {
        var call, methodName, targetName, name, deps, callChildCount;

        if (node.getType() === EXPR_RESULT && node.getFirstChild().getType() === CALL) {
            call = node.getFirstChild();
            
            if (call.getFirstChild().getType() === NAME &&
                nodeString(call.getFirstChild()) === "require") {

                //It is a plain require() call.
                deps = call.getChildAtIndex(1);
                if (!validateDeps(deps)) {
                    return null;
                }
                return parse.nodeToString(call);

            } else if (call.getType() === CALL &&
                call.getFirstChild().getType() === NAME &&
                nodeString(call.getFirstChild()) === "define") {

                //A define call
                name = call.getChildAtIndex(1);
                deps = call.getChildAtIndex(2);
                return parse.callToString(call, name, deps);

            } else if (call.getFirstChild().getType() === GETPROP &&
                call.getFirstChild().getFirstChild().getType() === NAME &&
                nodeString(call.getFirstChild().getFirstChild()) === "require") {

                //Possibly a require.def/require.modify call

                methodName = nodeString(call.getChildAtIndex(0).getChildAtIndex(1));
                if (methodName === "def") {

                    //A require.def() call
                    name = call.getChildAtIndex(1);
                    deps = call.getChildAtIndex(2);

                    return parse.callToString(call, name, deps);
                } else if (methodName === "modify") {

                    //A require.modify() call
                    callChildCount = call.getChildCount();
                    if (callChildCount > 0) {
                        targetName = call.getChildAtIndex(1);
                    }
                    if (callChildCount > 1) {
                        name = call.getChildAtIndex(2);
                    }
                    if (callChildCount > 2) {
                        deps = call.getChildAtIndex(3);
                    }

                    //Validate def name as a string
                    if (!targetName || targetName.getType() !== STRING || !name || name.getType() !== STRING) {
                        return null;
                    }
                    if (!validateDeps(deps)) {
                        return null;
                    }

                    return parse.nodeToString(call);

                }
            }
        }

        return null;
    };

    /**
     * Converts an AST node into a JS source string. Does not maintain formatting
     * or even comments from original source, just returns valid JS source.
     * @param {Packages.com.google.javascript.rhino.Node} node
     * @returns {String} a JS source string.
     */
    parse.nodeToString = function (node) {
        var codeBuilder = new jscomp.Compiler.CodeBuilder();
        compiler.toSource(codeBuilder, 1, node);
        return String(codeBuilder.toString());
    };
}());
