



load("../jslib/fileUtil.js");
load("../jslib/logger.js");

var tempContents = fileUtil.readFile('/Users/jr/Downloads/dojo-release-1.5.0-src-requirejs/dojox/gfx.js');


// /dojo\.loadInit\(function\(\)\{.*\}\)\;\s*dojo\.requireIf

if (tempContents.indexOf("dojo.loadInit(function") !== 0) {
    //Special processing for dojox.gfx. The loadInit call needs to be
    //pulled out as well as the requireIf calls.
    var loadInitBlock = '', modifyBlocks = '';

    //Convert contents to not have line returns to do matching easier, but also need to remove
    //single line comments.
    tempContents = tempContents.replace(/\/\/.*$/mg, "").replace(/[\r\n]/g, "");

    tempContents = tempContents.replace(/dojo\.loadInit\(function\(\)\{.*\}\)\;\s*/, function (match) {
        logger.trace("FOUND MATCH");
        //logger.trace(match);
        loadInitBlock = match.replace(/dojo\.loadInit/, "").replace(/\}\)\;\s*$/, "}());");
        return "";
    });
    
    //Find dojox.gfx requireIf calls and convert them.
    tempContents = tempContents.replace(/dojo\.requireIf\(dojox\.gfx.*\);/g, function (match) {
        match = match.replace(/dojo\.requireIf\(/, "").replace(/\)\;/, "");
        match = match.split(',');
        modifyBlocks += "\nif(" + match[0] + "){require.modify({'dojox/gfx': " + match[1].replace(/\./g, '/') + "});}\n";
        return "";
    });
    
    if (modifyBlocks) {
        tempContents = modifyBlocks + tempContents;
    }
    if (loadInitBlock) {
        tempContents = loadInitBlock + tempContents;
    }
}

logger.trace(tempContents);