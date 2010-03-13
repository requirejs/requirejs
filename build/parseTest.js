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
        fileContents = readFile(fileName),
        rhino = Packages.com.google.javascript.rhino,
        jscomp = Packages.com.google.javascript.jscomp,
        
        EXPR_RESULT = 130,
        CALL = 37,
        GETPROP = 33,
        NAME = 38,

        //Set up source input
        jsSourceFile = closurefromCode(String(fileName), String(fileContents)),
        compiler = new jscomp.Compiler(),
        astRoot = compiler.parse(jsSourceFile),
        i, node, call, require, def;

    //Only look at top level calls to require() and require.def()?
    for (i = 0; (node = astRoot.getChildAtIndex(i)); i++) {
        if (node.getType() === EXPR_RESULT &&
            node.getFirstChild().getType() === CALL &&
            node.getFirstChild().getFirstChild().getType() === GETPROP &&
            node.getFirstChild().getFirstChild().getFirstChild().getType() === NAME &&
            node.getFirstChild().getFirstChild().getFirstChild().getString() + "" === "require") {
            
            //call.getChildAt(1) should give first arg to the call.
            call = node.getFirstChild();
            require = call.getFirstChild().getChildAtIndex(0);
            def = call.getFirstChild().getChildAtIndex(1);

            if (!def) {
                //It is a plain require() call.
                logger.trace("found a require(), first arg is: " + call.getChildAtIndex(1));
            } else if (def.getString() + "" === "def") {
                //A require.def call
                logger.trace("found a def, first arg is: " + call.getChildAtIndex(1));
            } else {
                //Some other require call, like require.pause, require.ready
                //that we do not want to track.
                continue;
            }
        }
    }

}(arguments));