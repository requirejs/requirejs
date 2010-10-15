//A port of Narwhal's test/runner

/*jslint plusplus: false */
/*global window: false, require: false, console: false */
"use strict";

define("test/runner",
["require", "assert", "util"], function (
  require,   assert,   util) {
    var runner = {
        run: function (callback, module, context) {
            if (!module) {
                throw "Nothing to run";
            } else if (typeof module === "string") {
                require([module], function (mod) {
                    runner(mod);
                });
            }
            
            var localContext = context || { passed : 0, failed : [], error : [], depth : 0 },
                spaces, property, globals, name, backtrace, message;
            localContext.depth++;
            
            for (spaces = ""; spaces.length < localContext.depth * 2; (spaces += "  ")) {
                
            }
            
            for (property in module) {
                if (property.match(/^test/)) {
                    console.log(spaces + "+ Running " + property);
                    if (typeof module[property] === "function") {
                        if (typeof module.setup === "function") {
                            module.setup();
                        }
        
                        globals = {};
                        for (name in window) {
                            if (window.hasOwnProperty(name)) {
                                globals[name] = true;
                            }
                        }
        
                        try {
                            try {
                                module[property]();
                            } finally {
                                if (!module.addsGlobals) {
                                    for (name in window) {
                                        if (!globals[name]) {
                                            delete window[name];
                                            throw new assert.AssertionError("New global introduced: " + util.enquote(name));
                                        }
                                    }
                                }
                            }
        
                            localContext.passed++;
                        } catch (e) {
                            if (e.name === "AssertionError") {
                                localContext.failed.push({
                                    prop: property,
                                    error: e
                                });
                            } else {    
                                localContext.error.push({
                                    prop: property,
                                    error: e
                                });
                            }
                        } finally {
                            if (typeof module.teardown === "function")
                                module.teardown();
                        }
                    } else {
                        runner.run(callback, module[property], localContext);
                    }
                }
            }
            
            localContext.depth--;
        
            callback(localContext);

        }
    };

    return runner;
});