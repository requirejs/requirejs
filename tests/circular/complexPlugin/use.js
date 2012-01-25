/* RequireJS Use Plugin v0.1.0
 * Copyright 2012, Tim Branyen (@tbranyen)
 * use.js may be freely distributed under the MIT license.
 */
define({
  version: "0.1.0",

  // Invoked by the AMD builder, passed the path to resolve, the require
  // function, done callback, and the configuration options.
  //
  // Configuration format
  // --------------------------------------------------------------------------
  //
  // The string property used in attach will resolve to window[stringProp]
  // Functions are evaluated in the scope of the window and passed all
  // arguments.
  //
  // require.config({
  //   use: {
  //     "libs/underscore": {
  //       attach: "_"
  //     },
  //  
  //     "libs/backbone": {
  //       deps: ["use!underscore", "jquery"],
  //       attach: function(_, $) {
  //         return this.Backbone.noConflict();
  //       }
  //     }
  //   }
  // });
  //
  load: function(name, req, load, config) {
    var module = config.use && config.use[name];

    // No module to load so return early.
    if (!module) {
      return load();
    }

    // Read the current module configuration for any dependencies that are
    // required to run this particular non-AMD module.
    req(module.deps || [], function() {
      // Require this module
      req([name], function() {
        // Attach property
        var attach = config.use[name].attach;

        // If doing a build don't care about loading
        if (config.isBuild) { 
          return load();
        }

        // Return the correct attached object
        if (typeof attach == "function") {
          return load(attach.apply(window, arguments));
        }

        // Use window for now (maybe this?)
        return load(window[attach]);
      });
    });
  }
});
