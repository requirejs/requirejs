# RunJS

run.js loads JavaScript modules and JavaScript files. It is optimized for in-browser use, but can be easily adapted to other JavaScript environments.

If the loaded file calls run.def() to define a JavaScript module, then run.js can properly trace the module's dependencies and evaluate modules in the correct order. RunJS allows for module modifiers and has a plugin system that supports features like i18n string bundles and text file dependencies.

It uses plain script tags to load modules/files, so it should allow for easy debugging.

Part of the dependency tracking code comes from the Dojo JavaScript Toolkit, but run.js does not have any dependencies on a JavaScript framework. It is a standalone JavaScript file that can be used in any project.

The core run.js file around 3.1KB when minified via Closure Compiler and gzipped.

It is still in development, but the existing unit tests work in IE 6+, Firefox 3.5+, Safari 4+, Chrome 3+, and Opera 10+.

# Usage

There are 4 basic ways to use run.js:

1. Loading JavaScript files.
2. Define a module that has other dependencies.
3. Define an internationalization (i18n) bundle.
4. Specify a text file dependency.

## Loading JavaScript Files

If you just want to load some JavaScript files, do the following inside the HEAD tag in an HTML document:

    <script type="text/javascript" src="scripts/run.js"></script>
    <script type="text/javascript">
      run(["a.js", "b.js", "some/module"],
          function() {
              //This function will be called when all the dependencies
              //listed above are loaded. Note that this function could
              //be called before the page is loaded. This callback is optional.
          }
      );
    </script>

The dependencies above, ["a.js", "b.js", "some/module"], will be loaded via scripts tags that have the following src values:

* a.js (in the same directory as the HTML page that has the above HTML snippet)
* b.js (in the same directory as the HTML page that has the above HTML snippet)
* scripts/some/module.js

Files that end in ".js" are assumed to just be plain JS files that do not use run.js's module syntax, and therefore do not use the module-to-path algorithm used for looking up dot-notation modules, like "some/module" above.

See the **Configuration Options** section for information on changing the lookup paths used for dependencies.

## Defining a Module

If the module does not have any dependencies, then just specify the name of the module as the first argument to run.def() and and the second argument is just an object literal that defines the module's properties. For example:

    run.def("my/simpleshirt",
        {
            color: "black",
            size: "unisize"
        }
    );

This example would be stored in a my/simpleshirt.js file.

If the module has dependencies, then specify the dependencies as the second argument (as an array) and then pass a function as the third argument. The function will be called to define the module once all dependencies have loaded. The function should return an object that defines the module:

    run.def("my/shirt",
        ["my/cart", "my/inventory"],
        function(cart, inventory) {
            //return an object to define the "my/shirt" module.
            return {
                color: "blue",
                size: "large"
                addToCart: function() {
                    inventory.decrement(this);
                    cart.add(this);
                }
            }
        }
    );

In this example, a my/shirt module is created. It depends on my/cart and my/inventory. On disk, the files are structured like this:

* my/cart.js
* my/inventory.js
* my/shirt.js

The function call above specifies two arguments, "cart" and "inventory". These are the modules represented by the "my/cart" and "my/inventory" module names.

The function is not called until the my/cart and my/inventory modules have been loaded, and the function receives the modules as the "cart" and "inventory" arguments.

Modules that define globals are explicitly discouraged, so that multiple versions of a module can exist in a page at a time (see **Advanced Usage**). Also, the order of the function arguments should match the order of the dependencies.

The return object from the function call defines the "my/shirt" module. Be defining modules in this way, "my/shirt" does not exist as a global object.

If the modules do not have to return objects. Any valid return value from a function is allowed. Here is a module that returns a function as its module definition:

    run.def("my/title",
        ["my/dependency1", "my/dependency2"],
        function(dep1, dep2) {
            //return a function to define "my/title". It gets or sets
            //the window title.
            return function(title) {
                return title ? (window.title = title) : window.title;
            }
        }
    );

### Other Module Notes

Only one module should be defined per JavaScript file, given the nature of the module name-to-path lookup algorithm.

### Circular Dependencies

If you define a circular dependency (A needs B and B needs A), then in this case when B's module function is called, it will get an undefined value for A. B can fetch A later after modules have been defined by using the run.get() method (be sure to specify run as a dependency so the right context is used to look up A):

    run.def("B",
        ["run", "A"],
        function(run, a) {
            //"a" in this case will be null if A also asked for B,
            //a circular dependency.
            return function(title) {
                return run.get("A").doSomething();
            }
        }
    );

Normally you should not need to use run.get(). Circular dependencies are rare, and usually a sign that you might want to rethink the design. However, sometimes they are needed, and in that case, use run.get() as specified above.

## Define an I18N Bundle

Once your web app gets to a certain size and popularity, localizing the strings in the interface and providing other locale-specific information becomes more useful. However, it can be cumbersome to work out a scheme that scales well for supporting multiple locales.

run.js allows you to set up a basic module that has localized information without forcing you to provide all locale-specific information up front. It can be added over time, and only strings/values that change between locales can be defined in the locale-specific file.

i18n bundle support is provided by the run/i18n.js plugin. It is automatically loaded when a module or dependency specifies the i18n! prefix (more info below).

To define a bundle, put it in a directory called "nls" -- the i18n! plugin assumes a module name with "nls" in it indicates an i18n bundle. The "nls" marker in the name tells the i18n plugin where to expect the locale directories (they should be immediate children of the nls directory). If you wanted to provide a bundle of color names in your "my" set of modules, create the directory structure like so:

* my/nls/colors.js

The contents of that file should look like so:

    run.def("i18n!my/nls/colors",
        [{
            "root": {
                "red": "red",
                "blue": "blue",
                "green": "green"
            }
        }]
    );

Notice that an object literal with a property of "root" as given as the only dependency for this module. That is all you have to do to set the stage for later localization (l10n) work.

You can then use the above module in another module, say, in a my/lamps.js file:

    run.def("my/lamps",
        ["i18n!my/nls/colors"],
        function(colors) {
            return {
                testMessage: "The name for red in this locale is: " + colors.red
            }
        }
    );

The my/lamps module has one property called "testMessage" that uses colors.red to show the localized value for the color red.

Later, when you want to add a specific translation to a file, say for the fr-fr locale, change my/nls/colors to look like so:

    run.def("i18n!my/nls/colors",
        [{
            "root": {
                "red": "red",
                "blue": "blue",
                "green": "green"
            },
            "fr-fr": "i18n!my/nls/fr-fr/colors"
        }]
    );

Then define a file at my/nls/fr-fr/colors.js that has the following contents:

    run.def("i18n!my/nls/fr-fr/colors",
      {
        "red": "rouge",
        "blue": "bleu",
        "green": "vert"
      }
    );

run.js will use browser's navigator.language or navigator.userLanguage property to determine what locale values to use for my/nls/colors, your app does not have to change. If you prefer to set the locale, you can use the locale: configuration parameter to run.js (see the **Configuration options** section).

run.js is also smart enough to pick the right locale bundle, the one that most closely matches the ones provided by my/nls/colors. For instance, if the locale is "en-us", then the "root" bundle will be used. If the locale is "fr-fr-paris" then the "fr-fr" bundle will be used.

run.js also combines bundles together, so for instance, if the french bundle was defined like so (omitting a value for red):

    run.def("i18n!my/nls/fr-fr/colors",
      {
        "blue": "bleu",
        "green": "vert"
      }
    );

Then the value for red in "root" will be used. This works for all locale pieces. If all the bundles listed below were defined, then run.js will use the values in the following priority order (the one at the top takes the most precedence):

* my/nls/fr-fr-paris/colors.js
* my/nls/fr-fr/colors.js
* my/nls/fr/colors.js
* my/nls/colors.js

## Specify a Text File Dependency

It is nice to build HTML using regular HTML tags, instead of building up DOM structures in script. However, there is no good way to embed HTML in a JavaScript file. The best that can be done is using a string of HTML, but that can be hard to manage, particularly for multi-line HTML.

run.js has a plugin, run/text.js, that can help with this issue. It will automatically be loaded if the text! prefix is used for a dependency.

You can specify a text file resource as a dependency like so:

    run(["some/module", "text!some/module!html", "text!some/module!css"],
        function(module, html, css) {
            //the html variable will be the text of the some/module.html file
            //the css variable will be the text of the som/module.css file.    
        }
    );


Notice the !html and !css suffixes to specify the extension of the file.

For HTML/XML/SVG files, there is another option you can pass !strip, which strips XML declarations so that external SVG and XML documents can be added to a document without worry. Also, if the string is an HTML document, only the part inside the body tag is returned. Example:

    run(["text!some/module!html!strip"],
        function(html) {
            //the html variable will be the text of the some/module.html file,
            //but only the part inside the body tag.   
        }
    );

The text files are loaded via asynchronous XMLHttpRequest (XHR) calls, so you can only fetch files from the same domain as the web page.

However, the build system for run.js will inline any text! references with the actual text file contents into the modules, so after a build, the modules that have text! dependencies can be used from other domains.

# Mechanics

run.js loads each dependency as a script tag, using head.appendChild(). In the near future, there may be an optimization or a configuration option to allow using document.write() to write out the script tag (with an src= attribute) if the page has not loaded yet.

run.js waits for all dependencies to load, figures out the right order in which to call the functions that define the modules, then calls the module definition functions in the right order.

Using run.js in a server-side JavaScript enviroment that has synchronous loading should be as easy as redefining run.load(). The build system does this, the run.load method for that environment can be found in build/jslib/runPatch.js.

In the future, this code may be pulled into the run/ directory as an optional module that you can load in your env to get the right load behavior based on the host environment.

# Configuration Options

When using run() in the top-level HTML page (or top-level script file that does not define a module), a configuration object can be passed as the first option:

    <script type="text/javascript" src="scripts/run.js"></script>
    <script type="text/javascript">
      run({
              baseUrl: "/another/path/",
              paths: {
                  "some": "some/v1.0"
              },
              waitSeconds: 15,
              locale: "fr-fr",
              context: "foo"
          },
          ["a.js", "b.js", "some/module", "my/module"],
          function() {
              //This function will be called when all the dependencies
              //listed above are loaded. Note that this function could
              //be called before the page is loaded. This callback is optional.
          }
      );
    </script>

That example shows all the supported configuration options:

**baseUrl**: the root path to use for all module lookups. So in the above example, "my/module"'s script tag will have a src="/another/path/my/module.js". baseUrl is **not** used when loading plain .js files, those strings are used as-is, so a.js and b.js will be loaded from the same directory as the HTML page that contains the above snippet.

If no baseUrl is passed in, the path to run.js is used as the baseUrl path.

**paths**: allows configuration of some modules paths. Assumed to be relative to baseUrl. So for "some/module"'s script tag will have a src="/another/path/some/v1.0/module.js"

**waitSeconds**: The number of seconds to wait before giving up on loading a script. The default is 7 seconds.

**locale**: The locale to use for loading i18n bundles. By default navigator.language or navigator.userLanguage will be used. The proper syntax for specifying a locale is using lowercase and separating values by dashes, for instance: "fr-fr-paris" or "en-us".

**context**: A name to give to a loading context. This allows run.js to load multiple versions of modules in a page, as long as each top-level run call specifies a unique context string. See **Advanced Features** below.

# Page Load Event Support

run.js also has a method for notifying your code when the page has loaded. run.js uses the DOMContentLoaded event for browsers that support it, or window onload for browsers that do not.

The syntax:

    run.ready(function() {
      //DOM is ready, DOM nodes can be manipulated now.
    });

To use it in conjunction with module loading:

    run(["module/one", "module/two"],
        function(one, two) {
          run.ready(function() {
            one.modifyTheDom();
          });
        }
    );

# Advanced Usage

Some advanced features:

* Multiversion support
* Loading code after page load
* run.pause()/run.resume() for build layers/bundles
* Module Modifiers

## Multiversion Support

As mentioned in **Configuration Options**, multiple versions of a module can be loaded in a page by using different "context" configuration options. Here is an example that loads two different versions of the alpha and beta modules (this example is taken from one of the test files):

    <script type="text/javascript" src="../run.js"></script>
    <script type="text/javascript">
    run({
	      context: "version1",
	      baseUrl: "version1/"
        },
        ["run", "alpha", "beta",],
	    function(run, alpha, beta) {
	      log("alpha version is: " + alpha.version); //prints 1
	      log("beta version is: " + beta.version); //prints 1

	      setTimeout(function() {
		    run(["omega"],
		      function(omega) {
			    log("version1 omega loaded with version: " + omega.version); //prints 1
		      }
		    );
	      }, 100);
	    }
    );

    run({
	      context: "version2",
	      baseUrl: "version2/"
        },
        ["run", "alpha", "beta"],
        function(run, alpha, beta) {
          log("alpha version is: " + alpha.version); //prints 2
          log("beta version is: " + beta.version); //prints 2

          setTimeout(function() {
            run(["omega"],
              function(omega) {
                log("version2 omega loaded with version: " + omega.version); //prints 2
              }
            );
          }, 100);
          }
    );
    </script>

## Loading Code After Page Load

The example above in the **Multiversion Support** section shows how code can later be loaded by nested run() calls. Note that "run" is specified as a dependency for the module. This allows the run method that is passed to the function callback to use the right context to load the modules correctly for multiversion support.

## run.pause()/run.resume() for build layers/bundles

If you want to include many modules that use run.def() in one script, and those modules may depend on each other, then use run.pause() before the set of run calls to prevent runjs from tracing dependencies on each run call. When all the run calls have finished in the file, call run.resume() to have the dependencies properly traced.

Only use run.pause() and run.resume() on a file-by-file basis. Do not use run.pause() in one file and run.resume() in another file. Multiple files can call run.pause()/resume() combinations though.

Example:

    run.pause();
    
    run.def("alpha",
        ["beta"],
        function (beta) {
            return {
                name: "alpha",
                betaName: beta.name
            };
        }
    );
    
    run.def("beta",
        {
            name: "beta"
        }
    );

    run.resume();

If run.pause() and run.resume() were not used, then the run.def() call to define "alpha" would have tried to load "beta" via another network/file IO call.

## Module Modifiers

There are some cases where you want to be able to modify the behavior of a module. A common case is setting up a base module but modifying it only if some specific information or state is available.

One example could be a module that calculates DOM node positions and sizes. In standards mode, the calculations are simpler, but in quirks mode it can be trickier. You may want to avoid loading the quirks mode code unless the browser page is really in quirks mode, but you still want the node dimension module to have the same interface to other modules.

Enter Module Modifiers. They allow you to modify properties of a module. Some properties of module modifiers:

* modifiers are executed before the target module is given to other modules as dependency.
* modifiers can be specified before the target module is loaded.
* modifiers can be lazy-loaded and lazy-evaluated: only executed if the target module is loaded.
* modifiers can only modify **properties** of a module. They cannot completely redefine the whole module.

run.modify() is used for modifiers, and run.modify() can be called in two ways:

* Modifier registration.
* Modifier definition.

### Modifier Registration

If you want to tell runjs that there is a modifier, but not actually load the modifier or the target yet, then just register the modifiers with runjs:

    run.modify({
        "my/target1": "my/modifier1",
        "my/target1": "my/modifier2",
        "my/target2": "my/modifier3"
    });

This call tells runjs to load the "my/modifier1" and "my/modifier2" modules if the "my/target1" module is loaded and to load "my/modifier3" module if "my/target2" is loaded.

You are not required to register modifiers with runjs. Only do it if you want to avoid loading the target modules and defining the modifiers right away. Otherwise, you can use Modifier Definition.

### Modifier Definition

A modifier definition looks like a normal run.def() module definition, but:

* run.modify() is used.
* the target module's name is listed first in the run.modify() call.
* modifiers do not need to return an object from the function definition, since they are just modifying another module.

For the example given above in Modifier Registration, where "my/target1" is the target module and "my/modifier1" is the modifier, the "my/modifier1" module might look like this:

    run.modify(
        "my/target1",
        "my/modifier1",
        ["my/target1"],
        function(target1) {
            //Modify the properties on target1 as appropriate.
            //No need to return a value from this function since it
            //modifies another module.
            target1.foo = function(){};
        }
    );

# History and Influences

I work a lot on the Dojo Loader. The normal dojo loader uses synchronous XMLHttpRequest (XHR) calls. However, the XHR loader cannot load Dojo modules from other domains because of the same-origin restrictions. So I created the xdomain loader that required a build step to inject function wrappers similar to what RunJS uses, but more complex, due to i18n bundle loading and dojo.requireIf behavior. Because of the more complex i18n and requireIf requirements and the existence of many dojo modules already out in the world, I did not feel like the Dojo community would consider writing modules with function wrappers manually.

However, the sync XHR loader has other issues, like making debugging harder. Recently, David Mark suggested that Dojo use document.write() to load modules before the page loads to help with that issue, but that means required dependencies would not load until after the current module executes. This can cause errors if the module references a dependency as part of the module's definition. So a function wrapper is needed. The Dojo community seemed more amenable to considering a function wrapper, particularly since we are considering a Dojo 2.0 that can break some APIs. I fleshed out some of the details for RunJS on the dojo-contributors list, and Mike Wilson originally pushed for a more generic loader that could load plain files as well as allow for different contexts. I hope run.js can be used for Dojo 2.0 modules, but more investigation on i18n and requireIf support is needed.

YUI 3's use() function is also very similar to run, and use()'s API (but not code) also informed run's structure. I believe RunJS is more generic, since YUI seems to use labels for their modules that do not directly correspond to file paths. It also looks like it cannot load plain JS files, and I liked explicitly passing the dependent modules as arguments to the function definition. YUI.use() might support some of these features underneath, but I just looked at the top-level API doc.

I originally wanted something that would work with CommonJS modules, but those modules seem to be structured assuming a synchronous module loader, which is possible in server-side JavaScript environments. However, I am mostly concerned with something that works well in the browser, and that means needing a function wrapper so we can use script tags. Using synchronous XHR is not very friendly for new developers or people who want easy of debugging across browsers. It can also be slower than plain script tag loading. Some environments, like Adobe AIR do not allow eval() and most developers are taught that eval() is evil and should be avoided. run.js should be very usable in a server-side environment, and I plan on using it there too.