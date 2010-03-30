/**
 * Converts dojo modules to be requirejs compliant modules. Only works with dojo,
 * dijit and dojox modules, not for custom namespaces.
 *
 * Non-build file changes:
 * * In dojo._base.query, move the provide/require calls to the top
 * * dojo/_base.js convert requireIf to dojo.require("dojo._base.browser");
 * * dojo/_base/_loader/hostenv_browser.js, remove the debugAtAllCosts block and change
 * the isDebug block to be if(dojo.config.isDebug){require(["dojo/_firebug/firebug"]);}
 * * In dijit/_editor/RichText.js, remove the allowXdRichTextSave block, or force it not to doc.write.
 *
 * Usage:
 * java -jar ../lib/rhino/js.jar convertDojo.js path/to/dojo dojorequire
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
    fileList = fileUtil.getFilteredFileList(dojoPath, /\w/, true),
    jsFileRegExp = /\.js$/,
    depRegExp = /dojo\s*\.\s*(provide|require)\s*\(\s*["']([\w-_\.]+)["']\s*\)/g,
    reqRemoveRegExp = /dojo\s*\.\s*require\s*\(\s*["']([\w-_\.]+)["']\s*\)/g,
    localeRegExp = /(^.*\/nls\/)([^\/]+)\/[^\/]+\.js$/,
    rootBundleRegExp = /(^.*\/nls\/)([^\/]+)/,
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
        logger.error("No files to convert in directory: " + dojoPath);
    }
} else {
    for (i = 0; (fileName = fileList[i]); i++) {
        convertedFileName = fileName.replace(dojoPath, savePath);
        //Handle non-i18n JS files.
        if (jsFileRegExp.test(fileName) && fileName.indexOf("/nls/") === -1) {
            fileContents = fileUtil.readFile(fileName);
            fileContents = convert(fileName, fileContents);
            fileUtil.saveUtf8File(convertedFileName, fileContents);
        } else if (fileName.indexOf("/nls/") !== -1) {
            i18nConvert(fileName, convertedFileName, savePath);
        } else {
            //Just copy the file over.
            fileUtil.copyFile(fileName, convertedFileName, true);
        }
    }
}

//Write a baseline dojo.js file. Adjust the baseUrlRegExp to look for dojo.js,
//which should be a sibling of require.js.

fileContents = 'require.baseUrlRegExp = /dojo(\\.xd)?\\.js(\\W|$)/i;' +
               fileUtil.readFile(savePath + "/dojo/_base/_loader/bootstrap.js") +
               fileUtil.readFile(savePath + "/dojo/_base/_loader/loader.js") +
               fileUtil.readFile(savePath + "/dojo/_base/_loader/hostenv_browser.js");

//Do a require.modify call to get dojo/_base defined before other things that need dojo.
fileContents += 'require.def("dojo", function() {return dojo;});' +
                'require.def("dijit", function() {return dijit;});' +
                'require.def("dojox", function() {return dojox;});' +
                'require.modify("dojo", "dojo-base", ["dojo", "dojo/_base"], function(){});';

fileUtil.saveUtf8File(savePath + "/dojo.js", fileContents);

convertTime = ((new Date().getTime() - startTime) / 1000);
logger.info("Convert time: " + convertTime + " seconds");

function writeRequireEnd(prefixProps, contents) {
    var reqString = "", argString = "", i, req, getLocs = [], loc, varName,
        provideName = prefixProps && prefixProps.provide.replace(/\./g, "/");

    if (!prefixProps) {
        return contents;
    } else {
        //Convert dojo.cache references to be text! dependencies.
        contents = contents.replace(/dojo\s*\.\s*cache\s*\(['"]([^'"]+)['"]\s*\,\s*['"]([^'"]+)['"]\s*\)/g, function (match, modName, fileName) {
            var textName = "text!" + modName.replace(/\./g, "/") + "/" + fileName;
            //Make sure to use a bang for file extension part.
            textName = textName.split(".").join("!");

            prefixProps.reqs.push(textName);
            return '_R' + (prefixProps.reqs.length - 1);
        });


        //Convert dojo.requireLocalization calls to be i18n! dependencies.
        contents = contents.replace(/dojo\s*\.\s*requireLocalization\s*\(['"]([^'"]+)['"]\s*\,\s*['"]([^'"]+)['"]\s*\)/g, function(match, prefix, baseName) {
            var i18nName = "i18n!" + prefix.replace(/\./g, "/") + "/nls/" + baseName, varName = '_R';
            prefixProps.reqs.push(i18nName);
            varName += (prefixProps.reqs.length - 1);
            
            //Save off varName for getLocalization call replacements.
            getLocs.push([prefix, baseName, varName]);
            return "";
        });

        //If any getlLocalization calls were found, need to replace the getLocalization calls too.
        if (getLocs.length) {
            for (i = 0; (loc = getLocs[i]); i++) {
                contents = contents.replace(new RegExp('dojo\\.i18n\\.getLocalization\\s*\\(\\s*([^,\\)]+)\\s*,\\s*([^,\\)]+)([^\\)]+)?\\)', 'g'),
                                            function(match, prefix, baseName, thirdArg) {
                                                var name = prefix + ' + "/nls/" + ' + baseName,
                                                    getCall = 'require((' + name + ').replace(/\\./g, "/"))';
                                                if (thirdArg) {
                                                    //trim thirdArg, and remove an starting comma.
                                                    thirdArg = thirdArg.replace(/\s*,\s*(.*)\s*$/, "$1");
                                                    if (thirdArg) {
                                                        return '(' + thirdArg + ' ? require((' + prefix + ' + "/nls/" + ' + thirdArg + ' + "/" + ' + baseName + ').replace(/\\./g, "/")) : ' + getCall + ')';
                                                    } else {
                                                        return getCall;
                                                    }
                                                } else {
                                                    return getCall;
                                                }
                                            });
            }
        }

        //Build up the req string and args string.
        for (i = 0; (req = prefixProps.reqs[i]); i++) {
            reqString += ', "' + req.replace(/\./g, "/") + '"';
            argString += ', _R' + i;
        }

        return 'require.def("' + provideName + '", ["require", "dojo", "dijit", "dojox"' +
                reqString +
                '], function(require, dojo, dijit, dojox' + argString + ') {\n' +
                prefixProps.match +
                contents +
                '\nreturn ' + (prefixProps.provide.indexOf("-") === -1 ? prefixProps.provide : "null") + '; });\n';
    }
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
            context = Packages.org.mozilla.javascript.Context.enter(), match,
            //deps will be an array of objects like {provide: "", requires:[]}
            deps = [],
            currentDep, depName, provideRegExp,
            module, allDeps, reqs = [], prefixProps,
            i, j, removeString = "", removeRegExp,
            markIndex = 0, lastIndex = 0,
            opt = context.setOptimizationLevel(-1),
            script = context.compileString(fileContents, fileName, 1, null),
            //Remove comments
            tempContents = String(context.decompileScript(script, 0));

        depRegExp.lastIndex = 0;
        deps.provides = {};
    
        while ((match = depRegExp.exec(tempContents))) {
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

        if (deps.length) {
            //Work with original file and remove the require calls.
            fileContents = originalContents.replace(reqRemoveRegExp, "");

            //Wrap each section with a dojo.provide with a require block
            markIndex = 0;
            tempContents = "";

            //If dojo.js, inject require.js at the top of the file, then
            //tell require to pause on tracing dependencies until the
            //full file is evaluated.
            if (fileName.match(dojoJsRegExp)) {
                tempContents = fileUtil.readFile("../../require.js");
            }

            if (deps.length > 1) {
                tempContents += 'require.pause();\n';
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
    
                //Write out the current require block (or just first block of text.
                tempContents += writeRequireEnd(prefixProps, fileContents.substring(markIndex, lastIndex));

                //Build up the require dependencies.
                reqs = [];
                for (j = 0; (module = currentDep.requires[j]); j++) {
                    if (!deps.provides[module]) {
                        reqs.push(module);
                    }
                }

                //Save the properties to use for the require() prefix code
                prefixProps = {
                    provide: currentDep.provide,
                    reqs: reqs,
                    match: match
                };

                //Move the file cursor.
                markIndex = provideRegExp.lastIndex;
            }

            //Write out the last of the file with ending segment for require.
            tempContents += writeRequireEnd(prefixProps, fileContents.substring(markIndex, fileContents.length));
        }

        if (deps.length > 1) {
            tempContents += 'require.resume();\n';
        }

        return tempContents;
    } catch (e) {
        logger.error("COULD NOT CONVERT: " + fileName + ", so skipping it. Error was: " + e);
        return originalContents;
    }

    return fileContents;
}

/**
 * Converts i18n bundles. Takes a bit of work since we need to know the locales
 * on the disk.
 */
function i18nConvert(fileName, convertedFileName, srcDir) {
    var i, baseName, prefixName, matches, name, fileNames, locale, locales = "", text,
        contents = fileUtil.readFile(fileName).replace(/^.*\(\{/m, "{").replace(/\)\s*$/, ""),
        modName = convertedFileName.replace(srcDir, "").replace(/\.js$/, "");

    if (modName.charAt(0) === "/") {
        modName = modName.substring(1, modName.length);
    }

    if (localeRegExp.test(fileName)) {
        //A locale-specific bundle. Easier to handle.
        text = 'require.def("i18n!' + modName + '",\n' + contents + ');';
    } else {
        //A root bundle. A bit more work. First, get the basic name
        matches = rootBundleRegExp.exec(modName);
        prefixName = matches[1];
        baseName = matches[2];
        
        //Find all files in that directory with same base name, so we can get
        //the locales.
        fileNames = fileUtil.getFilteredFileList(srcDir + "/" + prefixName, new RegExp(baseName + "\\.js$"), true);
        for (i = 0; (name = fileNames[i]); i++) {
            if ((matches = localeRegExp.exec(name))) {
                locale = matches[2];
                locales += ',\n"' + locale + '": true';
            }
        }

        text = 'require.def("i18n!' + prefixName + baseName + '",\n{ "root": ' + contents + locales + '\n});';
    }
    
    fileUtil.saveUtf8File(convertedFileName, text);
}
