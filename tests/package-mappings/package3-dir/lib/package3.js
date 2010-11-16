define(function(require, exports, module) {

    var PACKAGE2 = require("package2/package2");

    exports.announceNext = function(messages) {
    
        messages.push("package-3");
    
        PACKAGE2.announcePrevious(messages);
    
    }

});