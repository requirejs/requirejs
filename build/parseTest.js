/**
 * @license Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
 * Java 6 is required.
 */

/*jslint plusplus: false */
/*global load: false, print: false, quit: false, logger: false,
  java: false, Packages: false, readFile: false */

"use strict";
var require;

load("jslib/logger.js");

//Oh Java, you rascal.
var JSSourceFilefromCode = java.lang.Class.forName('com.google.javascript.jscomp.JSSourceFile').getMethod('fromCode', [java.lang.String, java.lang.String]);

//Helper for closureOptimize, because of weird Java-JavaScript interactions.
function closurefromCode(filename, content) {
    return JSSourceFilefromCode.invoke(null, [filename, content]);
}

(function (args) {
    var buildHome = args[0],
        fileName = args[1],
        //fileContents = 'require.def("foo", ["one", \n//This is a comment\n"two",\n/*Another comment*/"three"], {});',
        //fileContents = 'require.def("foo", {one: "two"});',
        fileContents = readFile(fileName),
        rhino = Packages.com.google.javascript.rhino,
        jscomp = Packages.com.google.javascript.jscomp,

        //Values taken from com.google.javascript.rhino.Token,
        //but duplicated here to avoid weird Java-to-JS transforms.
        GETPROP = 33,
        CALL = 37,
        NAME = 38,
        STRING = 40,
        ARRAYLIT = 63,
        OBJECTLIT = 64,
        EXPR_RESULT = 130,

        //Set up source input
        jsSourceFile = closurefromCode(String(fileName), String(fileContents)),
        compiler = new jscomp.Compiler(),
        astRoot = compiler.parse(jsSourceFile),
        i, node, call, require, def, name, deps;

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

        if (type === OBJECTLIT) {
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

    //Only look at top level calls to require() and require.def()?
    for (i = 0; (node = astRoot.getChildAtIndex(i)); i++) {
        if (node.getType() === EXPR_RESULT &&
            node.getFirstChild().getType() === CALL &&
            node.getFirstChild().getFirstChild().getType() === GETPROP &&
            node.getFirstChild().getFirstChild().getFirstChild().getType() === NAME &&
            nodeString(node.getFirstChild().getFirstChild().getFirstChild()) === "require") {

            //call.getChildAt(1) should give first arg to the call.
            call = node.getFirstChild();
            require = call.getFirstChild().getChildAtIndex(0);
            def = call.getFirstChild().getChildAtIndex(1);

            if (!def) {
                //It is a plain require() call.
                logger.trace("found a require(), first arg is: " + call.getChildAtIndex(1));
                deps = call.getChildAtIndex(1);
                if (!validateDeps(deps)) {
                    continue;
                }

            } else if (nodeString(def) === "def") {
                //A require.def call
                name = call.getChildAtIndex(1);
                deps = call.getChildAtIndex(2);
                logger.trace("found a def, first arg is: " + call.getChildAtIndex(1));

                //Validate def name as a string
                if (name.getType() !== STRING) {
                    continue;
                }
                if (!validateDeps(deps)) {
                    continue;
                }
                logger.trace("VALID DEF, first arg is: " + call.getChildAtIndex(1));

                
            } else {
                //Some other require call, like require.pause, require.ready
                //that we do not want to track.
                continue;
            }
        }
    }

}(arguments));