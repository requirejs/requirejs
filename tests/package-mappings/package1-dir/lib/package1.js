define(function(require, exports, module) {
    
    var PACKAGE2 = require("package2/package2");
    
    exports.announceNext = function(messages) {
    
        messages.push("package-1");
    
        PACKAGE2.announceNext(messages);
    
    }
    
    exports.announcePrevious = function(messages) {
    
        messages.push("package-1");
    
    }

});