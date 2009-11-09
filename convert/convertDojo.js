/**
 * Converts dojo modules to be runjs compliant modules. Only works with dojo,
 * dijit and dojox modules, not for custom namespaces.
 *
 * Usage:
 * java -classpath path/to/rhino/js.jar dojo.js path/to/dojo path/to/use/for/converted/files
 *
 */
load("../jslib/fileUtil.js");
load("../jslib/logger.js");

var startTime = (new Date()).getTime(),
    convertTime,
    dojoPath = arguments[0],
    savePath = arguments[1],
    //Get list of files to convert.
    fileList = fileUtil.getFilteredFileList(dojoPath, /\.js$/, true),
    depRegExp = /dojo\s*\.\s*(provide|require)\s*\(\s*["']([\w-\.]+)["']\s*\)/g,
    dojoJsRegExp = /\/dojo.js$/,
    fileName, convertedFileName, fileContents,
    i;

//Normalize on front slashes and make sure the paths do not end in a slash.
dojoPath = dojoPath.replace(/\\/g, "/");
savePath = savePath.replace(/\\/g, "/");
if (dojoPath.charAt(dojoPath.length -1) == "/") {
  dojoPath = dojoPath.substring(0, dojoPath.length - 1);
}
if (savePath.charAt(savePath.length -1) == "/") {
  savePath = savePath.substring(0, savePath.length - 1);
}


//Cycle through all the JS files and convert them.
if(!fileList) {
  logger.error("No JS files to convert in directory: " + dojoPath);
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
        script, tempContents,
        match, hasMatch = false,
        deps = {
          provide: [],
          require: []
        },
        module, allDeps, reqString = "",
        i, removeString = "", removeRegExp;

    context.setOptimizationLevel(-1);
    script = context.compileString(fileContents, fileName, 1, null),
    tempContents = new String(context.decompileScript(script, 0)),

    depRegExp.lastIndex = 0;

    while((match = depRegExp.exec(tempContents))) {
      hasMatch = true;
      //Find the list of dojo.provide and require calls.
      var module = match[2];
      logger.trace("  found: " + module);
      if (module) {
        deps[match[1]].push(module);
        //Store a quick lookup about what provide modules are available.
        if (match[1] == "provide") {
          deps.provide[module] = 1;
        }
      }
    }

    if (hasMatch) {
      //Build up a regexp that can remove the require calls.
      //Keep provide calls so the nested objects get defined correctly.
      for (i = 0; (module = deps.require[i]); i++) {
        if (removeString) {
          removeString += "|";
        }
        removeString += "dojo\\s*.\\s*require\\s*\\(\\s*[\"']" + module + "[\"']\\s*\\)(;)?";
      }
      removeRegExp = new RegExp(removeString, "g");
  
      //Work with original file and remove the provide and require calls.
      fileContents = fileContents.replace(removeRegExp, "");
      
      //Wrap the whole file in a file wrapper.
      for (i = 0; module = deps.require[i]; i++) {
        if (!deps.provide[module]) {
          reqString += ',"' + module + '"';
        }
      }

      fileContents = 'run("' + deps.provide[0] + '", ["dojo", "dijit", "dojox"' +
                      reqString +
                      '], function(dojo, dijit, dojox) {\n' +
                      fileContents +
                      
                      'return ' + deps.provide[0] + ';\n});';
      //Add in any additional dojo.provide calls.
      if (deps.provide.length > 1) {
        for (i = 1; module = deps.provide[i]; i++) {
          fileContents += 'run("' + module + '", { return ' + module + ';});';
        }
      }
    }

    //If dojo.js, set up the "dojo", "dijit" and "dojox" namespaces.
    if (fileName.match(dojoJsRegExp)) {
      fileContents += 'run("dojo", function(){return dojo;}); \
                       run("dijit", function(){return dijit;}); \
                       run("dojox", function(){return dojox;});';
    }
  } catch(e) {
    logger.trace("COULD NOT CONVERT: " + fileName + ", so skipping it. Error was: " + e);
    return originalContents;
  }

  return fileContents;
}
