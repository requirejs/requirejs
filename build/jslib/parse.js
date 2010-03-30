/**
 * @license Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
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
    var rhino = Packages.com.google.javascript.rhino,
        jscomp = Packages.com.google.javascript.jscomp,
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
     * Main parse function. Returns a string of any valid require or require.def
     * calls as part of one JavaScript source string.
     * @param {String} fileName
     * @param {String} fileContents
     * @returns {String} JS source string or null, if no require or require.def
     * calls are found.
     */
    parse = function (fileName, fileContents) {
        //Set up source input
        var i, node, result = null, parsed,
        jsSourceFile = closurefromCode(String(fileName), String(fileContents)),
        astRoot = compiler.parse(jsSourceFile);

        //Only look at top level calls to require() and require.def()?
        //May need to expand this a bit to look inside like anon function
        //closures that can contain require calls.
        for (i = 0; (node = astRoot.getChildAtIndex(i)); i++) {
            parsed = parse.parseNode(node);
            if (parsed) {
                if (result) {
                    result += "\n" + parsed;
                } else {
                    result = parsed;
                }
            }
        }
        return result;
    };


    /**
     * Determines if the file defines require().
     * @param {String} fileName
     * @param {String} fileContents
     * @returns {Boolean}
     */
    parse.definesRequire = function (fileName, fileContents) {
        var i, node, result = null, parsed,
        jsSourceFile = closurefromCode(String(fileName), String(fileContents)),
        astRoot = compiler.parse(jsSourceFile);

        return parse.nodeHasRequire(astRoot);
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
     * Determines if a specific node is a valid require or require.def call.
     * @param {Packages.com.google.javascript.rhino.Node} node
     * 
     * @returns {String} a JS source string with the valid require call.
     * Otherwise null.
     */
    parse.parseNode = function (node) {
        var call, methodName, targetName, name, deps;

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

            } else if (call.getFirstChild().getType() === GETPROP &&
                call.getFirstChild().getFirstChild().getType() === NAME &&
                nodeString(call.getFirstChild().getFirstChild()) === "require") {

                //Possibly a require.def/require.modify call

                methodName = nodeString(call.getChildAtIndex(0).getChildAtIndex(1));
                if (methodName === "def") {

                    //A require.def() call
                    name = call.getChildAtIndex(1);
                    deps = call.getChildAtIndex(2);
    
                    //Validate def name as a string
                    if (name.getType() !== STRING) {
                        return null;
                    }
                    if (!validateDeps(deps)) {
                        return null;
                    }
    
                    return parse.nodeToString(call);
                } else if (methodName === "modify") {

                    //A require.modify() call
                    targetName = call.getChildAtIndex(1);
                    name = call.getChildAtIndex(2);
                    deps = call.getChildAtIndex(3);

                    //Validate def name as a string
                    if (targetName.getType() !== STRING && name.getType() !== STRING) {
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
