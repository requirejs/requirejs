var mainRequire = require;
/*
 * Verifies when using a non-global-context, require.def defines
 * modules in that context, without affecting other contexts.
 */
require({
        context: "test context", 
        baseUrl: "./"
    },
    ["require"],
    function(require) {
        doh.register(
           "context define",
           [
              function context_define(t){
                 var verifyRequireDefExists = function(){
                     t.isNot(undefined,this.def,"'def' function should exist on context require");
                 }

                 // Prevent silent failures, make sure we actual all  
                 // assertions were tried.
                 var triedAssertCount = 0;
                 
                 // Called after we defined "testmod" in the 2nd context
                 var resumeTest = (function(){
                        return function(){

                           // Verify we get appropriate "testmod" module
                           // from both contexts
                           requireAnotherContext(['testmod'],function(mod){
                              ++triedAssertCount;
                              t.is(testmod2,mod);
                           });
                           require(['testmod'],function(mod){
                              ++triedAssertCount;
                              t.is(testmod,mod);
                           });
                        };
                     })();

                 // Define "testmod" in "test context"
                 var testmod = 'testmod from test context';
                 verifyRequireDefExists.apply(require);
                 require.def('testmod',[],function(){
                    return testmod;
                 });

                 // Define "testmod" in "another context"
                 var requireAnotherContext;
                     testmod2 = "testmod from another context";
                 mainRequire({context: "another context"},["require"],function(require){
                    requireAnotherContext = require;
                    verifyRequireDefExists.apply(require);
                    requireAnotherContext.def('testmod',[],function(){
                       return testmod2;
                    });
                    resumeTest();
                 });

                 // Verify all assertions were tried
                 setTimeout(function(){
                    if(triedAssertCount < 2){
                       t.is(true,false,
                            '"testmod" module was not properly defined in or '+
                            'loaded from either or both test contexts');
                    }
                 },50);
              }
           ]
        );
        
        doh.run();
    }
);
