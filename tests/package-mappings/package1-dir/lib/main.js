define(function(require, exports, module) {

    var messages = [];
    
    exports.main = function() {
            
        var PACKAGE1 = require("./package1");
        
        PACKAGE1.announceNext(messages);
    
    }
    
    exports.getMessages = function() {
        return messages;
    }

});