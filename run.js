/*
  Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
  Available via the new BSD license.
  see: http://code.google.com/p/runjs/ for details
*/

(function() {
  //Change this version number for each release.
  var version = [0, 0, 1, ""];

  //Check for an existing version of run.
  //Only overwrite if there is a version of run and it is less
  //than this version.
  if (typeof run != "undefined") {
    if (!run.version) {
      return;
    } else {
      for (var i = 0; i < 2; i++) {
        if (run.version[i] >= version[i]) {
          return;
        }
      }
    }
  }

  //regexp for matching nls (i18n) module names.
  var nlsRegExp = /(^.*(^|\.)nls(\.|$))([^\.]*)\.?([^\.]*)/;

  /**
   * The function that loads modules or executes code that has dependencies
   * on other modules.
   */
  run = function(name, deps, callback, contextName) {
    var config = null;

    //Normalize the arguments.
    if (typeof name == "string") {
      //Defining a module.
      //First check if there are no dependencies, and adjust args.
      if (!(deps instanceof Array) && typeof deps != "array") {
        contextName = callback;
        callback = deps;
        deps = [];
      }

      contextName = contextName || run._currContextName;

      //If module already defined for context, leave.
      var context = run._contexts[contextName];
      if (context && context.specified && context.specified[name]) {
        return run;
      }
    } else if (name instanceof Array || typeof name == "array") {
      //Just some code that has dependencies. Adjust args accordingly.
      contextName = callback;
      callback = deps;
      deps = name;
      name = null;
    } else if (typeof name == "function" || name instanceof Function) {
      //Just a function that does not define a module and
      //does not have dependencies. Not sure if this is useful.
      callback = name;
      contextName = deps;
      name = null;
      deps = [];
    } else {
      //name is a config object.
      config = name;
      name = null;
      //Adjust args if no dependencies.
      if (typeof deps == "function" || deps instanceof Function) {
        contextName = callback;
        callback = deps;
        deps = [];
      }

      contextName = contextName || config.context || run._currContextName;
    }

    contextName = contextName || run._currContextName;

    if (contextName != run._currContextName) {
      //If nothing is waiting on being loaded in the current context,
      //then switch run._currContextName to current contextName.
      var loaded = run._contexts[run._currContextName] && run._contexts[run._currContextName].loaded,
          empty = {},
          canSetContext = true;
      if (loaded) {
        for (var prop in loaded) {
          if (!(prop in empty)) {
            if (!loaded[prop]) {
              canSetContext = false;
              break;
            }
          }
        }
      }
      if (canSetContext) {
        run._currContextName = contextName;
      }
    }

    //Grab the context, or create a new one for the given context name.
    context = run._contexts[contextName] || (run._contexts[contextName] = {
      waiting: [],
      nlsWaiting: {},
      baseUrl: run.baseUrl || "./",
      locale: typeof navigator == "undefined"? "root" :
                (navigator.language || navigator.userLanguage || "root").toLowerCase(),
      paths: {},
      waitSeconds: 7,
      specified: {
        "run": true
      },
      loaded: {
        "run": true
      },
      defined: {
        "run": function() {
          //A version of run that uses the current context.
          //If last arg is a string, then it is a context.
          //If last arg is not a string, then add context to it.
          var args = [].concat(Array.prototype.slice.call(arguments, 0));
          if (typeof arguments[arguments.length - 1] != "string") {
            args.push(contextName);
          }
          return run.apply(window, args);
        }
      },
      nls: {}
    });

    //If have a config object, update the context object with
    //the config values.
    if (config) {
      if ("waitSeconds" in config) {
        context.waitSeconds = config.waitSeconds;
      }

      if (config.baseUrl) {
        var baseUrl = config.baseUrl;
        //Make sure the baseUrl ends in a slash.
        if (baseUrl.charAt(baseUrl.length - 1) != "/") {
          baseUrl += "/";
        }
        context.baseUrl = baseUrl;
      }

      if (config.paths) {
        empty = {};
        for (prop in config.paths) {
          if (!(prop in empty)) {
            context.paths[prop] = config.paths[prop];
          }
        }
      }
      
      if (config.locale) {
        context.locale = config.locale.toLowerCase();
      }
    }

    //Store the module for later evaluation.
    var newLength = context.waiting.push({
      name: name,
      deps: deps,
      callback: callback
    });

    //Store index of insertion for quick lookup
    if (name) {
      context.waiting[name] = newLength - 1;
    }

    //Mark the module as specified: not loaded yet, but in the process,
    //so no need to fetch it again.
    if (name) {
      context.specified[name] = true;
    }

    //If the callback is not an actual function, it means it already
    //has the definition of the module as a literal value.
    if (callback && typeof callback  != "function" && !(callback instanceof Function)) {
      context.defined[name] = callback;
    }


    //See if the modules is an nls module and handle it special.
    var match = nlsRegExp.exec(name);
    if (match) {
      //Reconstruct the master bundle name from parts of the regexp match
      //nlsRegExp.exec("foo.bar.baz.nls.en-ca.foo") gives:
      //["foo.bar.baz.nls.en-ca.foo", "foo.bar.baz.nls.", ".", ".", "en-ca", "foo"]
      //nlsRegExp.exec("foo.bar.baz.nls.foo") gives:
      //["foo.bar.baz.nls.foo", "foo.bar.baz.nls.", ".", ".", "foo", ""]
      //so, if match[5] is blank, it means this is the top bundle definition,
      //so it does not have to be handled. Only deal with ones that have a locale
      //(a match[4] value but no match[5])
      if (match[5]) {
        var master = match[1] + match[5];

        //Track what locale bundle need to be generated once all the modules load.
        var nlsw = (context.nlsWaiting[master] || (context.nlsWaiting[master] = {}));
        nlsw[match[4]] = 1;

        var bundle = context.nls[master];
        if (!bundle) {
          //No master bundle yet, ask for it.
          context.defined.run([master]);
          bundle = context.nls[master] = {};
        }
        //For nls modules, the callback is just a regular object,
        //so save it off in the bundle now.
        bundle[match[4]] = callback;
      }
    }

    //Figure out if all the modules are loaded. If the module is not
    //being loaded or already loaded, add it to the "to load" list,
    //and request it to be loaded.
    var needLoad = false;
    for (var i = 0, dep; dep = deps[i]; i++) {
      //If it is a string, then a plain dependency
      if (typeof dep == "string") {
        if (!(dep in context.loaded)) {
          context.loaded[dep] = false;
          run.load(dep, contextName);
          needLoad = true;
        }
      } else {
        //dep is an object, so it is an i18n nls thing.
        //Track it in the nls section of the context.
        //It may have already been created via a specific locale
        //request, so just mixin values in that case, to preserve
        //the specific locale bundle object.
        bundle = context.nls[name];
        if (bundle) {
          run.mixin(bundle, dep);
        } else {
          context.nls[name] = dep;
        }

        //Break apart the locale to get the parts.
        var parts = context.locale.split("-");
        
        //Now see what bundles exist for each country/locale.
        //Want to walk up the chain, so if locale is en-us-foo,
        //look for en-us-foo, en-us, en, then root.
        var toLoad = [];
        var longestMatch = null;
        nlsw = context.nlsWaiting[name] || (context.nlsWaiting[name] = {});
        for (var j = parts.length; j > -1; j--) {
          var loc = j == 0 ? "root" : parts.slice(0, j).join("-");
          var val = dep[loc];
          if (val) {
            //Store which bundle to use for the default bundle definition.
            if (!nlsw.__match) {
              nlsw.__match = loc;
            }

            //Track that the locale needs to be resolved with its parts.
            nlsw[loc] = 1;

            //If locale value is a string, it means it is a resource that
            //needs to be loaded. Track it to load if it has not already
            //been asked for.
            if (typeof val == "string"
                && !context.specified[val]
                && !(val in context.loaded)) {
              toLoad.push(val);
            }
          }
        }

        //Load any bundles that are still needed.
        if (toLoad.length) {
          context.defined.run(toLoad);
        }
      }
    }

    //See if all is loaded.
    run.checkLoaded(contextName);

    return run;
  }
  run.version = version;

  //Set up storage for modules that is partitioned by context. Create a
  //default context too.
  var defContextName = "_runDefault";
  run._currContextName = defContextName;
  run._contexts = {};
  var contextLoads = [];

  //Set state for page loading.
  var isBrowser = typeof window != "undefined";

  //Set up page load detection for the browser case.
  if (isBrowser) {    
    //Figure out baseUrl. Get it from the script tag with run.js in it.
    var scripts = document.getElementsByTagName("script");
    var rePkg = /run\.js(\W|$)/i;
    for (i = scripts.length - 1, script; script = scripts[i]; i--) {
      var src = script.getAttribute("src");
      if (src) {
        var m = src.match(rePkg);
        if (m) {
          run.baseUrl = src.substring(0, m.index);
        }
        break;
      }
    }
  }

  /**
   * Makes the request to load a module. May be an async load depending on
   * the environment and the circumstance of the load call.
   */
  run.load = function(moduleName, contextName) {
    if (contextName != run._currContextName) {
      //Not in the right context now, hold on to it until
      //the current context finishes all its loading.
      contextLoads.push(arguments);

    } else {
      //First derive the path name for the module.
      var url = run.convertNameToPath(moduleName, contextName);
      run.attach(url, contextName, moduleName);
      run._contexts[contextName].startTime = (new Date()).getTime();
    }
  }

  run.jsExtRegExp = /\.js$/;

  /**
   * Converts a module name to a file path.
   */
  run.convertNameToPath = function(moduleName, contextName) {
    if (run.jsExtRegExp.test(moduleName)) {
      //Just a plain path, not module name lookup, so just return it.
      return moduleName;
    } else {
      //A module that needs to be converted to a path.
      var paths = run._contexts[contextName].paths;
      var syms = moduleName.split(".");
      for (var i = syms.length; i > 0; i--) {
        var parentModule = syms.slice(0, i).join(".");
        if (i != 1 || !!(paths[parentModule])) {
          var parentModulePath = paths[parentModule] || parentModule;
          if (parentModulePath != parentModule) {
            syms.splice(0, i, parentModulePath);
            break;
          }
        }
      }

      //Join the path parts together, then figure out if baseUrl is needed.
      var url = syms.join("/") + ".js";
      return ((url.charAt(0) == '/' || url.match(/^\w+:/)) ? "" : run._contexts[contextName].baseUrl) + url;
    }
  }

  /**
   * Checks if all modules for a context are loaded, and if so, evaluates the
   * new ones in right dependency order.
   */
  run.checkLoaded = function(contextName) {
    var context = run._contexts[contextName || run._currContextName];
    var waitInterval = context.waitSeconds * 1000;
    //It is possible to disable the wait interval by using waitSeconds of 0.
    var expired = waitInterval && (context.startTime + waitInterval) < (new Date()).getTime();

    //See if anything is still in flight.
    var loaded = context.loaded,
        empty = {},
        noLoads = "",
        hasLoadedProp = false;
    for (var prop in loaded) {
      hasLoadedProp = true;
      if (!(prop in empty)) {
        if (!loaded[prop]) {
          if (expired) {
            noLoads += prop + " ";
          } else {
            //Something is still waiting to load.
            setTimeout(function() {
              run.checkLoaded(contextName);
            }, 50);
            return;
          }
        }
      }
    }

    //If the loaded object had no items, then the rest of
    //the work below does not need to be done.
    if (!hasLoadedProp) {
      return;
    }

    //If wait time expired, throw error of unloaded modules.
    if (expired) {
      throw new Error("run.js load timeout for modules: " + noLoads);
    }
    
    //Resolve dependencies. First clean up state because the evaluation
    //of modules might create new loading tasks, so need to reset.
    var waiting = context.waiting;
    var nlsWaiting = context.nlsWaiting;
    context.waiting = [];
    context.nlsWaiting = {};
    context.loaded = {};

    //First, properly mix in any nls bundles waiting to happen.
    //Use an empty object to detect other bad JS code that modifies
    //Object.prototype.
    empty = {};
    for (prop in nlsWaiting) {
      if (!(prop in empty)) {
        //Each property is a master bundle name.
        var master = prop;
        var msWaiting = nlsWaiting[prop];
        var bundle = context.nls[master];
        var defLoc = null;

        //Create the module name parts from the master name. So, if master
        //is foo.nls.bar, then the parts should be prefix: "foo.nls",
        // suffix: "bar", and the final locale's module  name will be foo.nls.locale.bar        
        var parts = master.split(".");
        var modulePrefix = parts.slice(0, parts.length - 1).join(".");
        var moduleSuffix = parts[parts.length - 1];
        //Cycle through the locale props on the waiting object and combine
        //the locales together.
        for (var loc in msWaiting) {
          if (!(loc in empty)) {
            if (loc == "__match") {
              //Found default locale to use for the top-level bundle name.
              defLoc = msWaiting[loc];
            } else {
              //Mix in the properties of this locale together.
              //Split the locale into pieces.
              var mixed = {};
              parts = loc.split("-");
              for (var i = parts.length; i > 0; i--) {
                var locPart = parts.slice(0, i).join("-");
                if (locPart !== "root" && bundle[locPart]) {
                  run.mixin(mixed, bundle[locPart]);
                }
              }
              if (bundle["root"]) {
                run.mixin(mixed, bundle["root"]);
              }

              context.defined[modulePrefix + "." + loc + "." + moduleSuffix] = mixed;
            }
          }
        }

        //Finally define the default locale. Wait to the end of the property
        //loop above so that the default locale bundle has been properly mixed
        //together.
        context.defined[master] = context.defined[modulePrefix + "." + defLoc + "." + moduleSuffix];
      }
    }

    //Walk the dependencies, doing a depth first search.
    var orderedModules = [];
    for (i = 0, module; module = waiting[i]; i++) {
      var moduleChain = [module];
      if (module.name) {
        moduleChain[module.name] = true;
      }

      run.traceDeps(moduleChain, orderedModules, waiting, context.defined);
    }
    
    //Call the module callbacks in order.
    for (i = 0; module = orderedModules[i]; i++) {
      //Get objects for the dependencies.
      var name = module.name;
      var deps = module.deps;
      var args = [];
      for (var j = 0, dep; dep = deps[j]; j++) {
        //Get dependent module. If it does not exist, because of a circular
        //dependency, create a placeholder object.
        var depModule = context.defined[dep] || (context.defined[dep] = {});
        args.push(depModule);
      }

      //Call the callback to define the module, if necessary.
      var cb = module.callback;
      if (cb && (typeof cb  == "function" || cb instanceof Function)) {
        var ret = cb.apply(window, args);
        if (name) {
          var modDef = context.defined[name];
          if (modDef && ret) {
            //Mix in the contents of the ret object. This is done for
            //cases where we passed the placeholder module to a circular
            //dependency.
            run.mixin(modDef, ret);
          } else {
            context.defined[name] = ret;
          }
        }
      }
    }

    //Check for other contexts that need to load things.
    if (contextLoads.length) {
      //First, make sure current context has no more things to
      //load. After defining the modules above, new run calls
      //could have been made.   
      loaded = context.loaded;
      empty = {};
      var allDone = true;
      for (prop in loaded) {
        if (!(prop in empty)) {
          if (!loaded[prop]) {
            allDone = false;
            break;
          }
        }
      }

      if (allDone) {
        run._currContextName = contextLoads[0][1];
        var loads = contextLoads;
        //Reset contextLoads in case some of the waiting loads
        //are for yet another context.
        contextLoads = [];
        var loadArgs;
        for (i = 0, loadArgs; loadArgs = loads[i]; i++) {
          run.load.apply(run, loadArgs);
        }
      }
    } else {
      //Make sure we reset to default context.
      run._currContextName = defContextName;
    }
  }

  /**
   * Figures out the right sequence to call module callbacks.
   */
  run.traceDeps = function(moduleChain, orderedModules, waiting, defined) {
    while (moduleChain.length > 0) {
      var module = moduleChain[moduleChain.length - 1];
      if (module && !module.isOrdered) {
        module.isOrdered = true;

        //Trace down any dependencies for this resource.
        var deps = module.deps;
        if (deps && deps.length > 0) {
          for (var i = 0, nextDep; nextDep = deps[i]; i++) {
            var nextModule = waiting[waiting[nextDep]];
            if (nextModule && !nextModule.isOrdered && !defined[nextDep]) {
              //New dependency. Follow it down.
              moduleChain.push(nextModule);
              if (nextModule.name) {
                moduleChain[nextModule.name] = true;
              }
              run.traceDeps(moduleChain, orderedModules, waiting, defined);
            }
          }
        }

        //Add the current module to the ordered list.
        orderedModules.push(module);
      }

      //Done with that require. Remove it and go to the next one.
      moduleChain.pop();
    }
  }

  var readyRegExp = /complete|loaded/;

  /**
   * callback for script loads, used to check status of loading.
   *
   * @param {Event} evt the event from the browser for the script
   * that was loaded.
   */
  run.onScriptLoad = function(evt) {
    var node = evt.target || evt.srcElement;
    if (evt.type == "load" || readyRegExp.test(node.readyState)) {
      //Pull out the name of the module and the context.
      var contextName = node.getAttribute("data-runcontext");
      var moduleName = node.getAttribute("data-runmodule");

      //Mark the module loaded.
      run._contexts[contextName].loaded[moduleName] = true;

      run.checkLoaded(contextName);

      //Clean up script binding.
      if (node.removeEventListener) {
        node.removeEventListener("load", run.onScriptLoad, false);
      } else {
        //Probably IE.
        node.detachEvent("onreadystatechange", run.onScriptLoad);
      }
    }
  }

  /**
   * Attaches the script represented by the URL to the current
   * environment. Right now only supports browser loading,
   * but can be redefined in other environments to do the right thing.
   */
  run.attach = function(url, contextName, moduleName, doc){
    if (isBrowser) {
      doc = doc || document;
      var node = doc.createElement("script");
      node.src = url;
      node.type = "text/javascript";
      node.charset = "utf-8";
      node.setAttribute("data-runcontext", contextName);
      node.setAttribute("data-runmodule", moduleName);
  
      //Set up load listener.
      if (node.addEventListener) {
        node.addEventListener("load", run.onScriptLoad, false);
      } else {
        //Probably IE.
        node.attachEvent("onreadystatechange", run.onScriptLoad);
      }

      return doc.getElementsByTagName("head")[0].appendChild(node);
    }
    return null;
  }

  /**
   * Simple function to mix in properties from source into target,
   * but only if target does not already have a property of the same name.
   */
  run.mixin = function(target, source) {
    //Use an empty object to avoid other bad JS code that modifies
    //Object.prototype.
    var empty = {};
    for (var prop in source) {
      if (!(prop in target)) {
        target[prop] = source[prop];
      }
    }
    return run;
  }

  //****** START page load functionality ****************
  //Set up page on load callbacks. May separate this out.
  var isPageLoaded = !isBrowser;
   /**
   * Sets the page as loaded and triggers check for all modules loaded.
   */
  run.pageLoaded = function() {
    if (!isPageLoaded) {
      isPageLoaded = true;
      if (run._loadInterval) {
        clearInterval(run._loadInterval);
      }
      run._callReady();
    }
  }

  run._pageCallbacks = [];

  run._callReady = function() {
    var callbacks = run._pageCallbacks;
    run._pageCallbacks = [];
    for (var i = 0, callback; callback = callbacks[i]; i++) {
      callback();
    }
  }

  /**
   * Registers functions to call when the page is loaded
   */
  run.ready = function(callback) {
    if (isPageLoaded) {
      callback();
    } else {
      run._pageCallbacks.push(callback);
    }
    return run;
  }

  if (isBrowser) {
    if (window.addEventListener) {
      //Standards. Hooray! Assumption here that if standards based,
      //it knows about DOMContentLoaded.
      document.addEventListener("DOMContentLoaded", run.pageLoaded, false);
      window.addEventListener("load", run.pageLoaded, false);
    } else if (window.attachEvent) {
      window.attachEvent("onload", run.pageLoaded);
    }

    //Set up a polling check in every case, in case the above DOMContentLoaded
    //is not supported, or if it is something like IE. The load registrations above
    //should be the final catch, but see if we get lucky beforehand.
    var pageLoadRegExp = /loaded|complete/;
    run._loadInterval = setInterval(function() {
      //Check for document.readystate.
      if(pageLoadRegExp.test(document.readyState)){
        run.pageLoaded();
      }
    }, 10);
  }
  //****** END page load functionality ****************
})();
