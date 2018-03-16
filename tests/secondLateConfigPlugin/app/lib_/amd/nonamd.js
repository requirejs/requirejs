/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company.  All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

/**
 * AMD loader plugin that wraps non-amd scripts as amd modules on the fly.
 * Depends on the standard text! plugin, registered under the module id "text".
 * 
 * Wrapping is the only 100% safe method of ensuring that 
 * a non-amd module that depends on another non-amd module
 * uses the right version of the latter.
 * 
 * The following description shows how it is possible to load an 
 * incorrect version of a dependency if the _native_ shim is used:
 * 
 * 1. A first module, A, is required.
 * 2. Module A depends on the non-amd module, J1.
 * 3. Module J1 is not yet loaded.
 * 4. Module J1 is then loaded and publishes its value in global variable `J` and the loader
 *    reads this value correctly, according to an `exports: "J"` configuration.
 * 5. Module A is loaded and correctly reads the global value exported by module J1, in variable "J".
 * 6. A second module, B, is required.
 * 7. Module B depends on another non-amd module, J2.
 * 8. Module J2 is not yet loaded.
 * 9. Module J2 is then loaded and **also** publishes its value in global variable `J` and the loader
 *    reads this value correctly, according to an `exports: "J"` configuration.
 * 10. Module B is loaded and correctly reads the global value exported by module J2, in variable "J".
 * 11. A third module, C, is required.
 * 12. Module C depends on the non-amd module, J1.
 * 13. Module J1 is **already** loaded.
 * 14. Module C is then loaded and **incorrectly** reads the global value exported by module J2, 
 *     in variable "J", and not that exported by module J1.
 * 
 * In any case, J1 or J2, the AMD loader correctly reads the just published value, 
 * and so real AMD modules depending on these always receive the correct value.
 * 
 * The conclusion is that to be 100% safe,
 * any code depending on non-amd modules 
 * **must** be an amd module!
 * 
 * This plugin makes it easy to turn non-amd modules into amd modules.
 * The downfall is that all modules that depend on non-amd modules 
 * need to use its _special_ module id:
 * 
 * ```javascript
 * define(['amd!jquery.ui'], function($) {
 *    // jquery ui has been loaded, and in the configured jquery instance, for sure, really, really!
 * });
 * ```
 * 
 * The configuration of a module for use with this plugin is as close
 * as possible to a _native_ shim configuration:
 * 
 * ```javascript
 * requirejs.config({
 *   paths: {
 *     "amd": "path to the non-amd plugin" 
 *   },
 *   
 *   config: {
 *     // non-amd plugin configuration section
 *     "amd": {
 *       shim: {
 *         "jquery.ui": {
 *            exports: "$", // re-exports jquery
 *            deps: { // instead of just an array, an object allows defining the define function argument names
 *              "$": "the-module-id-of-the-jquery-I-want"
 *              // other dependencies
 *            }
 *         }
 *       }
 *     }
 *   }
 * });
 * ```
 */

define(["module", "text"], function(module, text) {
  
  var mainConfig = module.config(), // non-amd plugin's own config
      rBuildModuleText = {}; // only used in r.js environment.
  
  return {
    load: function(moduleId, parentRequire, onLoad, config) {

      var moduleUrl    = parentRequire.toUrl(moduleId + ".js"),
          moduleConfig = (mainConfig.shim && mainConfig.shim[moduleId]) || {};
      
      moduleConfig.id  = moduleId;
      moduleConfig.url = moduleUrl;
      
      text.get(moduleUrl, function onLoadSuccess(jsText) {
          
          jsText = compileNonAmd(jsText, moduleConfig, config.isBuild);
          
          if(config.isBuild) rBuildModuleText[moduleId] = jsText;
          
          onLoad.fromText(jsText);
          
        }, onLoad.error);
    },
     
    // Build time, r.js support
    write: function() {
       // TODO
    }
  };
   
  // == COMPILER ==
  
  /**
   * Compiles a non-amd module given its non-amd code and its compilation configuration options.
   * @param {string} jsText The non-amd JavaScript code.
   * @param {object} moduleConfig The non-amd configuration of the module being compiled.
   * @param {string} moduleConfig.id The amd id of the module being compiled.
   * @param {string} moduleConfig.url The url from which the `jsText` was loaded from.
   * @param {string} [moduleConfig.prescript] Arbitrary JavaScript code placed at 
   *    the first line of the module's define function.
   * @param {string} [moduleConfig.postscript] Arbitrary JavaScript code placed at 
   *    the end of the module's define function.
   *    Placed before the return code generated when `exports` is also specified.
   *    If this option already contains a return statement, don't specify the `exports` option.
   * @param {string} [moduleConfig.exports] The name of a variable that the module exports.
   *    When unspecified, the module value must instead be returned by the 
   *    code in the more general `postscript` option.
   * @param {Object.<string, string>} [moduleConfig.deps] A map of dependencies of the module, 
   *    having as keys the module's define function argument names and as values the correposding module ids.
   * @param {boolean} [isBuild=false] Whether running in build mode, under r.js.
   */
  function compileNonAmd(jsText, moduleConfig, isBuild) {
    var moduleUrl = moduleConfig.url, // required
        exports   = moduleConfig.exports,
        prescript = moduleConfig.prescript,
        postscript = moduleConfig.postscript;
    
    jsText = 'define(' + compileHeader(moduleConfig) + 
             '  var define = undefined;\n' + // Avoid 'define' detection and self registration
             (prescript ? ('  ' + prescript + '\n'): '') +
             jsText + '\n' +
             (postscript ? ('  ' + postscript +       '\n') : '') +
             (exports   ? ('  return ' + exports + ';\n') : '') + 
             '});';
    
    // IE with conditional comments on cannot handle the
    // sourceURL trick, so skip it if enabled.
    /*@if (@_jscript) @else @*/
    if(!isBuild) {
      if(typeof document !== "undefined" && moduleUrl.charAt(0) === '/')
        moduleUrl = document.location.protocol + "//" + document.location.host + moduleUrl;
         
      jsText += '\n//# sourceURL=' + moduleUrl;
    }
    /*@end@*/
    
    return jsText;
  }
  
  // The text following "define(", until the opening brace, inclusive.
  function compileHeader(moduleConfig) {
    var moduleToArgMap = moduleConfig.deps;
    if(moduleToArgMap) {
      var depModuleIds = [], depArgNames= [], depModuleIdsFinal = [];
      for(var moduleId in moduleToArgMap) {
        if(moduleToArgMap.hasOwnProperty(moduleId)) {
          var argName = moduleToArgMap[moduleId];
          if(argName) {
            depArgNames.push(argName);
            depModuleIds.push(moduleId);
          } else {
            depModuleIdsFinal.push(moduleId);
          }
        }
      }
      for(var i = 0; i < depModuleIdsFinal.length; i++) {
        depModuleIds.push(depModuleIdsFinal[i]);
      }
      
      // Something like: 
      //  ["foo/bar", "gugu/dada"], function(bar, dada) {\n
      if(depModuleIds.length)
        return '["' + depModuleIds.join('", "') + '"], function(' + depArgNames.join(', ')  + ') {\n';
    }
    
    return 'function() {\n';
  }
});
