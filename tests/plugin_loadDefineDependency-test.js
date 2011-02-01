var mainRequire = require;
/*
 * Verifies loadDefineDependency plugin API for special define "{plugin name}!" dependency
 * Allows plugin to load a "contextual" dependency when defining modules.
 */
require({
        context: "test context", 
        baseUrl: "./"
    },
    ["require"],
    function(require) {
        doh.register(
           "plugin loadDefineDependency",
           [
              function plugin_loadDefineDependency(t){
                  var mockTestCell = {};

                  // Define mock cell plugin
                  require.def('cell',[],function(){
                     return {
                        loadDefineDependency: function(){
                           return mockTestCell;
                        }
                     }
                  });
                  
                  require.def('test_cell_module',['cell!'],function(cell){
                     t.is(mockTestCell,cell,"'cell' dependency should be the cell with the defining module's name");
                  });
              }
           ]
        );
        
        doh.run();
    }
);
