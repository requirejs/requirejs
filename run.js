/*
  Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
  Available via the new BSD license.
  see: http://code.google.com/p/runjs/ for details
*/

;(function() {
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

  /**
   * The function that loads modules or executes code that has dependencies
   * on other modules.
   *
   * @param {Object} args the argument object that defines the code.
   *
   * 
   */
  run = function(name, deps, callback, contextName) {
    var config = null;

    //Normalize the arguments.
    if (typeof name == "string") {
      //Defining a module.
      //First check if there are no dependencies, and adjust args.
      if (typeof deps == "function" || deps instanceof Function) {
        contextName = callback;
        callback = deps;
        deps = [];
      }

      contextName = contextName || currContextName;

      //If module already defined for context, leave.
      var context = contexts[contextName];
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
      var config = name;
      name = null;
      //Adjust args if no dependencies.
      if (typeof deps == "function" || deps instanceof Function) {
        contextName = callback;
        callback = deps;
        deps = [];
      }

      contextName = contextName || config.context || currContextName;
    }

    contextName = contextName || currContextName;

    if (contextName != "currContextName") {
      //If nothing is waiting on being loaded in the current context,
      //then switch currContextName to current contextName.
      var loaded = contexts[currContextName] && contexts[currContextName].loaded,
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
        currContextName = contextName;
      }
    }

    //Grab the context, or create a new one for the given context name.
    var context = contexts[contextName] || (contexts[contextName] = {
      waiting: [],
      baseUrl: run.baseUrl || "./",
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
      }
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
        var empty = {};
        for (var prop in config.paths) {
          if (!(prop in empty)) {
            context.paths[prop] = config.paths[prop];
          }
        }
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

    //Figure out if all the modules are loaded. If the module is not
    //being loaded or already loaded, add it to the "to load" list,
    //and request it to be loaded.
    var needLoad = false;
    for (var i = 0, dep; dep = deps[i]; i++) {
      if (!(dep in context.loaded)) {
        context.loaded[dep] = false;
        run.load(dep, contextName);
        needLoad = true;
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
  var currContextName = defContextName;
  var contexts = {};
  var contextLoads = [];

  //Set state for page loading.
  var isBrowser = typeof window != "undefined";

  //Set up page load detection for the browser case.
  if (isBrowser) {    
    //Figure out baseUrl. Get it from the script tag with run.js in it.
    var scripts = document.getElementsByTagName("script");
    var rePkg = /run\.js(\W|$)/i;
    for (var i = scripts.length - 1, script; script = scripts[i]; i--) {
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
    if (contextName != currContextName) {
      //Not in the right context now, hold on to it until
      //the current context finishes all its loading.
      contextLoads.push(arguments);

    } else {
      //First derive the path name for the module.
      var url = run.convertNameToPath(moduleName, contextName);
      run.attach(url, contextName, moduleName);
      contexts[contextName].startTime = (new Date()).getTime();
    }

    //BIG TODO: if it is a different contextName from currContextName,
    //then wait to load ones for contextName until ones for currContextName
    //have finished loading.
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
      var paths = contexts[contextName].paths;
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
      return ((url.charAt(0) == '/' || url.match(/^\w+:/)) ? "" : contexts[contextName].baseUrl) + url;
    }
  }

  /**
   * Checks if all modules for a context are loaded, and if so, evaluates the
   * new ones in right dependency order.
   */
  run.checkLoaded = function(contextName) {
    var context = contexts[contextName || currContextName];
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
    context.waiting = [];
    context.loaded = {};
    
    //Walk the dependencies, doing a depth first search.
    var orderedModules = [];
    for (var i = 0, module; module = waiting[i]; i++) {
      var moduleChain = [module];
      if (module.name) {
        moduleChain[module.name] = true;
      }

      run.traceDeps(moduleChain, orderedModules, waiting, context.defined);
    }
    
    //Call the module callbacks in order.
    for (var i = 0, module; module = orderedModules[i]; i++) {
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
      if (module.callback) {
        var ret = module.callback.apply(window, args);
        if (name) {
          var modDef = context.defined[name];
          if (modDef && ret) {
            //Mix in the contents of the ret object. This is done for
            //cases where we passed the placeholder module to a circular
            //dependency.
            //Use an empty placeholder object to avoid bad JS code that
            //adds things to Object.prototype.
            var empty = {};
            for (var prop in ret) {
              if (!(ret in empty)) {
                modDef[prop] = ret[prop];
              }
            }
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
      for (var prop in loaded) {
        if (!(prop in empty)) {
          if (!loaded[prop]) {
            allDone = false;
            break;
          }
        }
      }

      if (allDone) {
        currContextName = contextLoads[0][1];
        var loads = contextLoads;
        //Reset contextLoads in case some of the waiting loads
        //are for yet another context.
        contextLoads = [];
        for (var i = 0, loadArgs; loadArgs = loads[i]; i++) {
          run.load.apply(run, loadArgs);
        }
      }
    } else {
      //Make sure we reset to default context.
      currContextName = defContextName;
    }
  }

  run.traceDeps = function(moduleChain, orderedModules, waiting, defined) {
    while (moduleChain.length > 0) {
      var module = moduleChain[moduleChain.length - 1];
      var deps, nextDep;
      if (module && !module.isOrdered) {
        module.isOrdered = true;

        //Trace down any dependencies for this resource.
        deps = module.deps;
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
      contexts[contextName].loaded[moduleName] = true;

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

  //****** START page load functionality ****************
  //Set up page on load callbacks. May separate this out.
  var isPageLoaded = !isBrowser;
   /**
   * Sets the page as loaded and triggers check for all modules loaded.
   */
  run.pageLoaded = function() {
    if (!isPageLoaded) {
      isPageLoaded = true;
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
    var loadInterval = setInterval(function() {
      //Check for document.readystate.
      if(/loaded|complete/.test(document.readyState)){
        clearInterval(loadInterval);
        run.pageLoaded();
      }
    }, 10);
  }
  //****** END page load functionality ****************
})();
