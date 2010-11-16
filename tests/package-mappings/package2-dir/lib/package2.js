define(function(require, exports, module) {
    
    var PACKAGE1 = require("packageA/package1");
    var PACKAGE3 = require("packageB/package3");
    
    exports.announceNext = function(messages) {
    
        messages.push("package-2");
    
        PACKAGE3.announceNext(messages);
    
    }
    
    exports.announcePrevious = function(messages) {
    
        messages.push("package-2");
    
        PACKAGE1.announcePrevious(messages);
    
    }

});