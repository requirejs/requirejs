/**
 * Converts dojo modules to be runjs compliant modules. Only works with dojo,
 * dijit and dojox modules, not for custom namespaces.
 *
 * It requires a Dojo build that:
 * * has buildUtil.addGuardsAndBaseRequires not do anything. So it will not work
 * with customDojoBase builds. It also means modifying buildUtil.addGuardsAndBaseRequires
 * to just return instead of doing its work.
 * * Comment out the inclusion of dojoGuardStart.jsfrag and dojoGuardEnd.jsfrag
 * in buildUtil.js.
 * 
 * Usage:
 * java -classpath path/to/rhino/js.jar convertDojo.js path/to/dojo path/to/use/for/converted/files
 *
 */
/*jslint plusplus: false */
/*global load: false, fileUtil: false, logger: false, Packages: false, convert: true */

"use strict";

load("../jslib/fileUtil.js");
load("../jslib/logger.js");

var startTime = (new Date()).getTime(),
    convertTime,
    dojoPath = arguments[0],
    savePath = arguments[1],
    //Get list of files to convert.
    fileList = fileUtil.getFilteredFileList(dojoPath, /\.js$/, true),
    depRegExp = /dojo\s*\.\s*(provide|require)\s*\(\s*["']([\w-_\.]+)["']\s*\)/g,
    reqRemoveRegExp = /dojo\s*\.\s*require\s*\(\s*["']([\w-_\.]+)["']\s*\)/g,
    dojoJsRegExp = /\/dojo\.js(\.uncompressed\.js)?$/,
    fileName, convertedFileName, fileContents,
    i;

//Normalize on front slashes and make sure the paths do not end in a slash.
dojoPath = dojoPath.replace(/\\/g, "/");
savePath = savePath.replace(/\\/g, "/");
if (dojoPath.charAt(dojoPath.length - 1) === "/") {
    dojoPath = dojoPath.substring(0, dojoPath.length - 1);
}
if (savePath.charAt(savePath.length - 1) === "/") {
    savePath = savePath.substring(0, savePath.length - 1);
}

//Cycle through all the JS files and convert them.
if (!fileList || !fileList.length) {
    if (dojoPath === "convert") {
        //A request just to convert one file.
        logger.trace('\n\n' + convert(savePath, fileUtil.readFile(savePath)));
    } else {
        logger.error("No JS files to convert in directory: " + dojoPath);
    }
} else {
    for (i = 0; (fileName = fileList[i]); i++) {
        convertedFileName = fileName.replace(dojoPath, savePath);
        fileContents = fileUtil.readFile(fileName);
        fileContents = convert(fileName, fileContents);
        fileUtil.saveUtf8File(convertedFileName, fileContents);
    }
}

convertTime = ((new Date().getTime() - startTime) / 1000);
logger.info("Convert time: " + convertTime + " seconds");


function writeRunEnd(provideName) {
    return '\nreturn ' + provideName + '; });\n';
}

/**
 * Does the actual file conversion.
 *
 * @param {String} fileName the name of the file.
 * 
 * @param {String} fileContents the contents of a file :)
 */
function convert(fileName, fileContents) {
    //Strip out comments.
    logger.trace("fileName: " + fileName);
    try {
        var originalContents = fileContents,
            context = Packages.org.mozilla.javascript.Context.enter(),
            match, hasMatch = false,
            //deps will be an array of objects like {provide: "", requires:[]}
            deps = [],
            currentDep, depName, provideRegExp, provideName,
            module, allDeps, reqString = "",
            i, j, removeString = "", removeRegExp,
            markIndex = 0, lastIndex = 0,
            opt = context.setOptimizationLevel(-1),
            script = context.compileString(fileContents, fileName, 1, null),
            //Remove comments
            tempContents = String(context.decompileScript(script, 0));

        depRegExp.lastIndex = 0;
        deps.provides = {};
    
        while ((match = depRegExp.exec(tempContents))) {
            hasMatch = true;
            //Find the list of dojo.provide and require calls.
            module = match[2];
            logger.trace("  " + match[1] + " " + module);
            if (module) {
                depName = match[1];
                if (depName === "provide") {
                    currentDep = {
                        provide: module,
                        requires: []
                    };
                    deps.push(currentDep);
                    //Store a quick lookup about what provide modules are available.
                    deps.provides[module] = 1;
                } else if (currentDep) {
                    //If no currentDep, as in dojo.js having the firebug call, skip it.
                    currentDep.requires.push(module);
                }
            }
        }

        if (hasMatch) {
            //Work with original file and remove the require calls.
            fileContents = originalContents.replace(reqRemoveRegExp, "");

            //Wrap each section with a dojo.provide with a run block
            markIndex = 0;
            tempContents = "";

            //If dojo.js, inject run.js at the top of the file, then
            //tell run to pause on tracing dependencies until the
            //full file is evaluated.
            if (fileName.match(dojoJsRegExp)) {
                tempContents = fileUtil.readFile("../run.js");
                tempContents += 'run.pause();\n';
            }

            for (i = 0; (currentDep = deps[i]); i++) {
                 //Find the provide call in the real source, not the temp source
                //that has comments removed.
                provideRegExp = new RegExp('dojo\\s*\\.\\s*provide\\s*\\(\\s*["\']' +
                                            currentDep.provide.replace(/\./g, "\\.") + 
                                           '["\']\\s*\\)', 'g');
                provideRegExp.lastIndex = markIndex;
                match = provideRegExp.exec(fileContents)[0];
                lastIndex = provideRegExp.lastIndex - match.length;
                
                //Write out intervening file contents
                tempContents += fileContents.substring(markIndex, lastIndex);

                //Write out the end of the last provided module, if there is
                //one.
                if (i > 0) {
                    tempContents += writeRunEnd(provideName);
                }

                //Remember the new provide name.
                provideName = currentDep.provide;

                //Build up the run string by getting its dependencies.
                for (j = 0; (module = currentDep.requires[j]); j++) {
                    if (!deps.provides[module]) {
                        reqString += ',"' + module + '"';
                    }
                }
                
                tempContents += 'run("' + currentDep.provide + '", ["dojo", "dijit", "dojox"' +
                                reqString +
                                '], function(dojo, dijit, dojox) {\n' +
                                match;
                
                //Move the file cursor.
                markIndex = provideRegExp.lastIndex;
            }

            //Write out the last of the file with ending segment for run.
            tempContents += fileContents.substring(markIndex, fileContents.length);
            tempContents += writeRunEnd(provideName);
        }

        //If dojo.js, set up the "dojo", "dijit" and "dojox" namespaces.
        if (fileName.match(dojoJsRegExp)) {
            tempContents += 'run("dojo", function(){return dojo;});' +
                            'run("dijit", function(){return dijit;});' +
                            'run("dojox", function(){return dojox;});' +
                            'run.resume();\n';
        }

        return tempContents;
    } catch (e) {
        logger.error("COULD NOT CONVERT: " + fileName + ", so skipping it. Error was: " + e);
        return originalContents;
    }

    return fileContents;
}
