/*
 * Verifies error callback when using require([deps],cb,errorCallback).
 */
require({ 
      baseUrl: "./" 
   },
   ['require'],
   function(require){
      require(
         ['func','doesNotExist'],
         function(){
            doh.register('errorCallback',[
               function errorCallback(t){
                  t.is(true,false,'Should not successfully load a non-existant module');
               }
            ]);
            doh.run();
         },   
         function(loaded,errored){ 
            doh.register("errorCallback", [
                 function errorCallback(t){
                     t.is(true,"func" in loaded, "Should pass 'loaded' map with successfully loaded modules");
                     t.is(true,"doesNotExist" in errored,"Should pass 'errored' map with modules that could not be loaded"); 
                 }
            ]);
            doh.run();
         }
      );
   }
);
