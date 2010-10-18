# RequireJS API

* [Usage](#usage)
    * [Loading JavaScript Files](#jsfiles)
    * [Defining a Module](#define)
        * [Simple Name/Value Pairs](#defsimple)
        * [Definition Functions](#deffunc)
        * [Definition Functions with Dependencies](#defdep)
        * [Defining a Module as a Function](#funcmodule)
        * [Other Module Notes](#modulenotes)
        * [Circular Dependencies](#circular)
    * [Define an I18N Bundle](#i18n)
    * [Specify a Text File Dependency](#text)
    * [Specify a JSONP Service Dependency](#jsonp)
    * [Load Scripts in a Specific Order](#order)
* [Mechanics](#mechanics)
* [Configuration Options](#config)
* [Page Load Event Support](#pageload)
* [Advanced Usage](#advanced)
    * [Loading Modules from Packages](#packages)
    * [Multiversion Support](#multiversion)
    * [Loading Code After Page Load](#afterload)
    * [Module Modifiers](#modifiers)
        * [Modifier Registration](#modregister)
        * [Modifier Definition](#moddef)
    * [Web Worker Support](#webworker)
    * [Rhino Support](#rhino)

# <a name="usage">Usage</a>

There are 5 basic ways to use require.js:

1. Loading JavaScript files.
2. Define a module that has other dependencies.
3. Define an internationalization (i18n) bundle.
4. Specify a text file dependency.
4. Specify a JSONP service dependency.

## <a name="jsfiles">Loading JavaScript Files</a>

If you just want to load some JavaScript files, do the following inside the HEAD tag in an HTML document:

    <script src="scripts/require.js"></script>
    <script>
        require(["a.js", "b.js", "some/module"], function() {
            //This function will be called when all the dependencies
            //listed above are loaded. Note that this function could
            //be called before the page is loaded. This callback is optional.
        });
    </script>

The dependencies above, ["a.js", "b.js", "some/module"], will be loaded via scripts tags that have the following src values:

* a.js (in the same directory as the HTML page that has the above HTML snippet)
* b.js (in the same directory as the HTML page that has the above HTML snippet)
* scripts/some/module.js

Files that end in ".js" are assumed to just be plain JS files that do not use require.js's module syntax, and therefore do not use the module-to-path algorithm used for looking up dot-notation modules, like "some/module" above.

See the **Configuration Options** section for information on changing the lookup paths used for dependencies.

While you can use require() inside a script tag in an HTML file, it is strongly encouraged to place the work in a file that is loaded by RequireJS. This allows for easier optimization via the optimization tool, and there is a shorthand that can be used in the HTML for this pattern. The above example would be structured like this:

    <script data-main="main" src="scripts/require.js"></script>

The data-main attribute tells RequireJS will take the value of the data-main attribute and treat it like a require([]) call. So, in this case, it would load scripts/main.js, and that file should have the top-level require call:

    //Inside scripts/main.js
    require(["a.js", "b.js", "some/module"], function() {
        //...
    });

## <a name="define">Defining a Module</a>

A module is different from a traditional script file in that it defines a well-scoped object that does not try to pollute the global namespace. It can explicitly list its dependencies and get a handle on those dependencies without needing to refer to global objects, but instead receive the dependencies as arguments to the function that defines the module. Modules in RequireJS are an extension of the [Module Pattern](http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth), with the benefit of not needing globals to refer to other modules.

The RequireJS syntax for modules allows them to be loaded as fast as possible, even out of order, but evaluated in the correct dependency order, and since global variables are not created, it makes it possible to [load multiple versions of a module in a page](#multiversion).

(If you are familiar with or are using CommonJS modules, then please also see [CommonJS Notes](commonjs.md) for information on how the RequirejS module format maps to CommonJS modules).

There should only be **one** module definition per file on disk. The modules can be grouped into optimized bundles by the [optimization tool](optimization.md).

**NOTE**: As of RequireJS 0.14.3, the function **define()** is preferred to create modules. Previously it was **require.def()**. require.def is still available, but define() is encouraged in the interests of conforming to the [Asynchronous Module Proposal](http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition). You are free to continue require.def() if you only want RequireJS to load the modules, but if you want your code to be potentially interoperable with other Async Module script loaders, you should consider using define(). Any API examples that use define() will work the same if require.def() is used instead.

### <a name="defsimple">Simple Name/Value Pairs</a>

If the module does not have any dependencies, and it is just a collection of name/value pairs, then just pass an object literal to define():

    //Inside file my/shirt.js:
    define({
        color: "black",
        size: "unisize"
    });

### <a name="deffunc">Definition Functions</a>

If the module does not have dependencies, but needs to use a function to do some setup work, then define itself, pass a function to define():

    //my/shirt.js now does setup work
    //before returning its module definition.
    define(function () {
        //Do setup work here
        
        return {
            color: "black",
            size: "unisize"
        }
    );

### <a name="defdep">Definition Functions with Dependencies</a>

If the module has dependencies, then specify the dependencies as an array for the first argument and then pass a definition function as the second argument. The function will be called to define the module once all dependencies have loaded. The function should return an object that defines the module. The dependencies will be passed to the definition function as function arguments, listed in the same order as the order in the dependency array:

    //my/shirt.js now has some dependencies, a cart and inventory
    //module in the same directory as shirt.js
    define(["./cart", "./inventory"], function(cart, inventory) {
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

The function call above specifies two arguments, "cart" and "inventory". These are the modules represented by the "./cart" and "./inventory" module names.

The function is not called until the my/cart and my/inventory modules have been loaded, and the function receives the modules as the "cart" and "inventory" arguments.

Modules that define globals are explicitly discouraged, so that multiple versions of a module can exist in a page at a time (see **Advanced Usage**). Also, the order of the function arguments should match the order of the dependencies.

The return object from the function call defines the "my/shirt" module. Be defining modules in this way, "my/shirt" does not exist as a global object.

### <a name="funcmodule">Defining a Module as a Function</a>

If the modules do not have to return objects. Any valid return value from a function is allowed. Here is a module that returns a function as its module definition:

    //A module definition inside foo/title.js. It uses
    //my/cart and my/inventory modules from before,
    //but since foo/bar.js is in a different directory than
    //the "my" modules, it uses the "my" in the module dependency
    //name to find them. The "my" part of the name can be mapped
    //to any directory, but by default, it is assumed to be a sibling
    //to the "foo" directory.
    define(["my/cart", "my/inventory"],
        function(cart, inventory) {
            //return a function to define "foo/title". It gets or sets
            //the window title.
            return function(title) {
                return title ? (window.title = title) : inventory.storeName + ' ' + cart.name;
            }
        }
    );

### <a name="modulename">Defining a Module with a Name</a>

You may encounter some define() calls that include a name for the module as the first argument to define():

        //Excplicitly defines the "foo/title" module:
        define("foo/title",
            ["my/cart", "my/inventory"],
            function(cart, inventory) {
                //Define foo/title object in here.
           }
        );

These are normally generated by the [optimization tool](optimization.md). You can explicitly name modules yourself, but it makes the modules less portable -- if you move the file to another directory you will need to change the name. It is normally best to avoid coding in a name for the module and just let the optimization tool burn in the module names. The optimization tool needs to add the names so that more than one module can be bundled in a file, to allow for faster loading in the browser.

### <a name="modulenotes">Other Module Notes</a>

Only one module should be defined per JavaScript file, given the nature of the module name-to-file-path lookup algorithm. Multiple modules will be grouped into optimized files by the [optimization tool](optimization.md), but you should only use the optimization tool to place more than one module in a file.

If you need to work with a module you already loaded via a require(["module/name"], function(){}) call in the JavaScript console, then you can use  the require() form that just uses the string name of the module to fetch it:

    require("module/name").callSomeFunction()

Note this only works if "module/name" was previously loaded via the async version of require: require(["module/name"]).

### <a name="circular">Circular Dependencies</a>

If you define a circular dependency (A needs B and B needs A), then in this case when B's module function is called, it will get an undefined value for A. B can fetch A later after modules have been defined by using the require() method (be sure to specify require as a dependency so the right context is used to look up A):

    //Inside B.js:
    define(["require", "A"],
        function(require, a) {
            //"a" in this case will be null if A also asked for B,
            //a circular dependency.
            return function(title) {
                return require("A").doSomething();
            }
        }
    );

Normally you should not need to use require() to fetch a module, but instead rely on the module being passed in to the function as an argument. Circular dependencies are rare, and usually a sign that you might want to rethink the design. However, sometimes they are needed, and in that case, use require() as specified above.

If you are familiar with CommonJS modules, you could instead declare **exports** as a dependency to create an empty object for the module. By doing this on both sides of a circular dependency, you can then safely hold on to the the other module via a function argument.

## <a name="i18n">Define an I18N Bundle</a>

Once your web app gets to a certain size and popularity, localizing the strings in the interface and providing other locale-specific information becomes more useful. However, it can be cumbersome to work out a scheme that scales well for supporting multiple locales.

require.js allows you to set up a basic module that has localized information without forcing you to provide all locale-specific information up front. It can be added over time, and only strings/values that change between locales can be defined in the locale-specific file.

i18n bundle support is provided by the require/i18n.js plugin. It is automatically loaded when a module or dependency specifies the i18n! prefix (more info below).

To define a bundle, put it in a directory called "nls" -- the i18n! plugin assumes a module name with "nls" in it indicates an i18n bundle. The "nls" marker in the name tells the i18n plugin where to expect the locale directories (they should be immediate children of the nls directory). If you wanted to provide a bundle of color names in your "my" set of modules, create the directory structure like so:

* my/nls/colors.js

The contents of that file should look like so:

    //my/nls/colors.js contents:
    define({
        "root": {
            "red": "red",
            "blue": "blue",
            "green": "green"
        }
    });

Notice that an object literal with a property of "root" as given as the only dependency for this module. That is all you have to do to set the stage for later localization (l10n) work.

You can then use the above module in another module, say, in a my/lamps.js file:

    //Contents of my/lamps.js
    define(["i18n!my/nls/colors"], function(colors) {
        return {
            testMessage: "The name for red in this locale is: " + colors.red
        }
    });

The my/lamps module has one property called "testMessage" that uses colors.red to show the localized value for the color red.

Later, when you want to add a specific translation to a file, say for the fr-fr locale, change my/nls/colors to look like so:

    //Contents of my/nls/colors.js
    define({
        "root": {
            "red": "red",
            "blue": "blue",
            "green": "green"
        },
        "fr-fr": true
    });

Then define a file at my/nls/fr-fr/colors.js that has the following contents:

    //Contents of my/nls/fr-fr/colors.js
    define({
        "red": "rouge",
        "blue": "bleu",
        "green": "vert"
    });

require.js will use browser's navigator.language or navigator.userLanguage property to determine what locale values to use for my/nls/colors, your app does not have to change. If you prefer to set the locale, you can use the locale: configuration parameter to require.js (see the **Configuration options** section).

require.js is also smart enough to pick the right locale bundle, the one that most closely matches the ones provided by my/nls/colors. For instance, if the locale is "en-us", then the "root" bundle will be used. If the locale is "fr-fr-paris" then the "fr-fr" bundle will be used.

require.js also combines bundles together, so for instance, if the french bundle was defined like so (omitting a value for red):

    //Contents of my/nls/fr-fr/colors.js
    define({
        "blue": "bleu",
        "green": "vert"
    });

Then the value for red in "root" will be used. This works for all locale pieces. If all the bundles listed below were defined, then require.js will use the values in the following priority order (the one at the top takes the most precedence):

* my/nls/fr-fr-paris/colors.js
* my/nls/fr-fr/colors.js
* my/nls/fr/colors.js
* my/nls/colors.js

## <a name="text">Specify a Text File Dependency</a>

It is nice to build HTML using regular HTML tags, instead of building up DOM structures in script. However, there is no good way to embed HTML in a JavaScript file. The best that can be done is using a string of HTML, but that can be hard to manage, particularly for multi-line HTML.

require.js has a plugin, require/text.js, that can help with this issue. It will automatically be loaded if the text! prefix is used for a dependency.

You can specify a text file resource as a dependency like so:

    require(["some/module", "text!some/module.html", "text!some/module.css"],
        function(module, html, css) {
            //the html variable will be the text of the some/module.html file
            //the css variable will be the text of the som/module.css file.    
        }
    );


Notice the .html and .css suffixes to specify the extension of the file. The "some/module" part of the path will be resolved according to normal module name resolution: it will use the **baseUrl** and **paths** [configuration options](#config) to map that name to a path.

For HTML/XML/SVG files, there is another option you can pass !strip, which strips XML declarations so that external SVG and XML documents can be added to a document without worry. Also, if the string is an HTML document, only the part inside the body tag is returned. Example:

    require(["text!some/module.html!strip"],
        function(html) {
            //the html variable will be the text of the some/module.html file,
            //but only the part inside the body tag.   
        }
    );

The text files are loaded via asynchronous XMLHttpRequest (XHR) calls, so you can only fetch files from the same domain as the web page.

However, the build system for require.js will inline any text! references with the actual text file contents into the modules, so after a build, the modules that have text! dependencies can be used from other domains.

## <a name="jsonp">Specify a JSONP Service Dependency</a>

[JSONP](http://en.wikipedia.org/wiki/JSON#JSONP) is a way of calling some services in JavaScript. It works across domains and it is an established approach to calling services that just require an HTTP GET via a script tag.

RequireJS has a plugin, require/jsonp.js, that allows you to use JSONP API services as dependencies. RequireJS will handle setting up the callback function with the service, and once the service returns a value to that callback, it will use that value as the value for that JSONP service URL.

To use a JSONP service in RequireJS, specify the jsonp! plugin prefix, then the URL to the service. For the JSONP callback parameter, use a question mark for the value, similar to how it is done in jQuery.

Here is an example that calls a twitter API endpoint. In this example, the JSONP callback parameter is called "callback":

    require(["jsonp!http://search.twitter.com/trends/current.json?callback=?"],
        function (trends) {
            //The trends object will be the API response for the
            //Twitter trends/current API
            console.log(trends);
        }
    );

Errors in loading a JSONP service are normally surfaced via timeouts for the service, since script tag loading does not give much detail into network problems. To detect errors, attach an event listener for window.onerror. The error object passed to the onerror function will contain two properties if it is a timeout issue:

* **requireType**: value will be "timeout"
* **requireModules**: an array of module names/URLs that timed out. You can find the JSONP service URL in here.

## <a name="order">Load Scripts in a Specific Order</a>

Normally RequireJS loads and evaluates scripts in an undetermined order. However, there are some traditional scripts that depend on being loaded in a specific order. For those cases you can use the **order** plugin:

    require(["order!one.js", "order!two.js", "order!three.js"], function () {
        //This callback is called after the three scripts finish loading.
    });

Scripts loaded by the **order** plugin will be fetched asynchronously, but evaluated in the order they are passed to require, so it should still perform better with using script tags in the head of an HTML document.

The **order** plugin is best used with traditional scripts, it is not needed for scripts that use define() to define modules. It is possible to mix and match "order!" dependencies with regular dependencies, but only the "order!" ones will be evaluated in relative order to each other. 

**Note**: the order! plugin only works with JavaScript files that are cacheable by the browser. If the JS file has headers that do not allow the browser to cache the file, then the order of scripts will not be maintained.

# <a name="mechanics">Mechanics</a>

require.js loads each dependency as a script tag, using head.appendChild().

require.js waits for all dependencies to load, figures out the right order in which to call the functions that define the modules, then calls the module definition functions in the right order.

Using require.js in a server-side JavaScript enviroment that has synchronous loading should be as easy as redefining require.load(). The build system does this, the require.load method for that environment can be found in build/jslib/requirePatch.js.

In the future, this code may be pulled into the require/ directory as an optional module that you can load in your env to get the right load behavior based on the host environment.

# <a name="config">Configuration Options</a>

When using require() in the top-level HTML page (or top-level script file that does not define a module), a configuration object can be passed as the first option:

    <script type="text/javascript" src="scripts/require.js"></script>
    <script type="text/javascript">
      require({
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

Also, you can define require to be an object **before** require.js is loaded, and have the values applied. This is example specifies some dependencies to load as soon as require.js defines require() and registers a require.ready() callback to register after require.js defines require.ready():

    <script type="text/javascript">
        var require = {
            deps: ["a.js", "b.js", "some/module1", "my/module2"],
            callback: function(a, b, module1, module2) {
                //This function will be called when all the dependencies
                //listed above in deps are loaded. Note that this function could
                //be called before the page is loaded. This callback is optional.
            },
            ready: function() {
                //This function called once the DOM is ready.
                //If you build require.js without page load support, then nothing
                //is done with this function.
            }
        };
    </script>
    <script type="text/javascript" src="scripts/require.js"></script>


Supported configuration options:

**baseUrl**: the root path to use for all module lookups. So in the above example, "my/module"'s script tag will have a src="/another/path/my/module.js". baseUrl is **not** used when loading plain .js files, those strings are used as-is, so a.js and b.js will be loaded from the same directory as the HTML page that contains the above snippet.

If no baseUrl is passed in, the path to require.js is used as the baseUrl path. The baseUrl can be an URL on a different domain as the page that will load require.js. RequireJS script loading works across domains. The only restriction is on text content loaded by text! plugins: those paths should be on the same domain as the page, at least during development. The optimization tool will inline text! plugin resources so after using the optimization tool, you can use resources that reference text! plugin resources from another domain.

**baseUrlMatch**: If no baseUrl is specified, normally the path to require.js is used. However, if you build RequireJS into another file with a name that does not have "require.js" in it, then the autodetection of the baseUrl will fail. In that case you can set baseUrlMatch to match the name of the file you built. The value should be a Regular expression. For example:

    baseUrlMatch: /mycustomlib\.js/i

**paths**: allows configuration of some modules paths. Assumed to be relative to baseUrl. So for "some/module"'s script tag will have a src="/another/path/some/v1.0/module.js". The path that is used for a module name should **not** include the .js extension, since the path mapping could be for a directory. The path mapping code will automatically add the .js extension when mapping the module name to a path.

**packagePaths**: configures module name prefixes to map to CommonJS packages. See the [packages topic](#packages) for more information. Related to **packages** config option.

**packages**: configures loading modules from CommonJS packages. See the [packages topic](#packages) for more information. Related to **packagePaths** config option.

**waitSeconds**: The number of seconds to wait before giving up on loading a script. The default is 7 seconds.

**locale**: The locale to use for loading i18n bundles. By default navigator.language or navigator.userLanguage will be used. The proper syntax for specifying a locale is using lowercase and separating values by dashes, for instance: "fr-fr-paris" or "en-us".

**context**: A name to give to a loading context. This allows require.js to load multiple versions of modules in a page, as long as each top-level require call specifies a unique context string. See **Advanced Features** below.

**deps**: An array of dependencies to load. Useful when require is defined as a config object before require.js is loaded, and you want to specify dependencies to load as soon as require() is defined.

**callback**: An function to pass to require that should be require after **deps** have been loaded. Useful when require is defined as a config object before require.js is loaded, and you want to specify a function to require after the configuration's **deps** array have been loaded.

**ready**: An function to pass to require.ready(). Useful when require is defined as a config object before require.js is loaded, and you want to specify a require.ready callback to set as soon as require() is defined.

**priority**: An array of module/file names to load immediately, before tracing down any other dependencies. This allows you to set up a small set of files that are downloaded in parallel that contain most of the modules and their dependencies already built in. More information is in the [Optimization FAQ, Priority Downloads](faq-optimization#priority).

** urlArgs**: Extra querystring arguments appended to URLs that RequireJS uses to fetch resources. Most useful to cache bust when the browser or server is not configured correctly. Example cache bust setting for urlArgs:

    urlArgs: "bust=" +  (new Date()).getTime()

During development it can be useful to use this, however **be sure** to remove it before deploying your code.

# <a name="pageload">Page Load Event Support</a>

require.js also has a method for notifying your code when the page has loaded. require.js uses the DOMContentLoaded event for browsers that support it, or window onload for browsers that do not.

The syntax:

    require.ready(function() {
      //DOM is ready, DOM nodes can be manipulated now.
    });

To use it in conjunction with module loading:

    require(["module/one", "module/two"],
        function(one, two) {
          require.ready(function() {
            one.modifyTheDom();
          });
        }
    );

# <a name="advanced">Advanced Usage</a>

## <a name="packages">Loading Modules from Packages</a>

RequireJS supports loading modules that are in a [CommonJS Packages](http://wiki.commonjs.org/wiki/Packages/1.1) directory structure, but some additional configuration needs to be specified for it to work. Specifically, there is support for the following CommonJS Packages features:

* A package can be associated with a module name/prefix.
* The package config can specify the following properties for a specific package:
    * **name**: The name of the package (used for the module name/prefix mapping)
    * **location**: The location on disk. Locations are relative to the baseUrl configuration value, unless they contain a protocol or start with a front slash (/).
    * **lib**: The name of the directory inside the package folder that contains modules. The default value is "lib", so no need to specify it unless it is different than the default.
    * **main**: The name of the module inside the lib directory that should be used when someone does a require for "packageName". The default value is "main", so only specify it if it differs from the default.

**IMPORTANT NOTES**

* While the packages can have the CommonJS directory layout, the modules themselves should be in a module format that RequireJS can understand. Exception to the rule: if you are using the r.js Node adapter, the modules can be in the traditional CommonJS module format. You can use the [CommonJS converter tool](commonjs.md#autoconversion) if you need to convert traditional CommonJS modules into an async module format that RequireJS uses.
* Only one version of a package can be used in a project context at a time. You can use RequireJS [multiversion support](#multiversion) to load two different module contexts, but if you want to use Package A and B in one context and they depend on different versions of Package C, then that will be a problem. This may change in the future.
    
If you use a similar project layout as specified in the [Start Guide](start.md), the start of your web project would look something like this (Node/Rhino-based projects are similar, just use the contents of the **scripts** directory as the top-level project directory):

* project-directory/
    * project.html
    * scripts/
        * require.js

There are two types of packages you may use in your project -- packages made by other people (third-party packages), and packages that you make as part of your project (source packages). It is suggested that you use two different directories inside scripts to keep track of them. For third-party packages, a **.packages** is recommended, where source packages can just be directories that are siblings to require.js. The third-party packages likely do not need to be committed to your source control, so you can put .packages in your source control's ignore file (.gitignore, .hgignore, etc...).

However, you will want to remember what third-party packages you are using, and where you got them. For that reason, it is suggested that you construct a **package.json** file in the **scripts** directory and use a [**mappings**](http://wiki.commonjs.org/wiki/Packages/Mappings) section in the package.json file to remember the locations.

Here is how the example directory layout looks with two third-party packages, **alpha** and **omega**, and has two source packages, **cart** and **store**:

* project-directory/
    * project.html
    * scripts/
        * .gitignore (ignores .packages)
        * .packages/
            * alpha/
                * lib/
                    * main.js
            * omega/
                * lib/
                    * main.js
        * cart/
            * lib/
                * main.js
        * store/
            * lib/
                * main.js
                * util.js
        * main.js
        * package.json
        * require.js

The **package.json** for the project might be as simple as this, just to track where alpha and omega came from, since they are not committed to source control:

    {
        "mappings": {
            "alpha": "http://example.com/packages/alpha/0.4.zip",
            "omega": "http://example.com/pacakges/omega/1.0.zip"
        }
    }

**project.html** will have a script tag like this:

    <script data-main="main" src="scripts/require.js"></script>

This will instruct require.js to load scripts/main.js. **main.js** uses the **packagePaths** config option to set up the location of the the third party packages, where "packages" is used to set up packages that are relative to require.js, which in this case are the source packages "cart" and "store":

    //main.js contents
    //Pass a config object to require
    require({
        packagePaths: {
            ".packages": ["alpha", "omega"]
        },
        "packages": ["cart", "store"]
    });

    require(["alpha", "omega", "cart", "store", "store/util"],
    function (alpha,   omega,   cart,   store,   util) {
        //use the modules as usual.
    });

A require of "alpha" means that it will be loaded from **scripts/.packages/alpha/lib/main.js**, since "lib" and "main" are the default lib directory and main module settings supported by RequireJS. A require of "store/util" will be loaded from **scripts/store/lib/util.js**.

If the "alpha" and "store" packages did not follow the "lib" and "main.js" conventions, and looked more like this:

* project-directory/
    * project.html
    * scripts/
        * .gitignore (ignores .packages)
        * .packages/
            * alpha/
                * scripts/
                    * index.js
            * omega/
                * lib/
                    * main.js
        * cart/
            * lib/
                * main.js
        * store/
            * store.js
            * util.js
        * main.js
        * package.json
        * require.js

Then the RequireJS configuration would look like so:

    require({
        packagePaths: {
            ".packages": [
                {
                    name: "alpha",
                    lib: "scripts",
                    main: "index"
                },
                "omega"
            ]
        },
        "packages": [
            "cart",
            {
                name: "store",
                lib: ".",
                main: "store"
            }
        ]
    });

**packagePaths** is just a convenience for listing several packages that are not direct siblings of require.js, but still have a common directory parent. The above configuration could be written like so with just the **packages** config option, by using the **location** property for each third-party package:

    require({
        "packages": [
            {
                name: "alpha",
                location: ".packages/alpha",
                lib: "scripts",
                main: "index"
            },
            {
                name: "omega",
                location: ".packages/omega"
            }
            "cart",
            {
                name: "store",
                lib: ".",
                main: "store"
            }
        ]
    });

To avoid verbosity, it is strongly suggested to always use packages that use the "lib" and "main" conventions in their structure, and use packagePaths for third party packages.

To make fetching and configuring packages easier, there are designs for [a command line package tool](http://github.com/jrburke/requirejs/blob/master/docs/design/packages.md) in the works.

## <a name="multiversion">Multiversion Support</a>

As mentioned in **Configuration Options**, multiple versions of a module can be loaded in a page by using different "context" configuration options. Here is an example that loads two different versions of the alpha and beta modules (this example is taken from one of the test files):

    <script type="text/javascript" src="../require.js"></script>
    <script type="text/javascript">
    require({
	      context: "version1",
	      baseUrl: "version1/"
        },
        ["require", "alpha", "beta",],
	    function(require, alpha, beta) {
	      log("alpha version is: " + alpha.version); //prints 1
	      log("beta version is: " + beta.version); //prints 1

	      setTimeout(function() {
		    require(["omega"],
		      function(omega) {
			    log("version1 omega loaded with version: " + omega.version); //prints 1
		      }
		    );
	      }, 100);
	    }
    );

    require({
	      context: "version2",
	      baseUrl: "version2/"
        },
        ["require", "alpha", "beta"],
        function(require, alpha, beta) {
          log("alpha version is: " + alpha.version); //prints 2
          log("beta version is: " + beta.version); //prints 2

          setTimeout(function() {
            require(["omega"],
              function(omega) {
                log("version2 omega loaded with version: " + omega.version); //prints 2
              }
            );
          }, 100);
          }
    );
    </script>

Note that "require" is specified as a dependency for the module. This allows the require method that is passed to the function callback to use the right context to load the modules correctly for multiversion support, and it is required in multiversion situations where you want to user require inside the module's factory function.

## <a name="afterload">Loading Code After Page Load</a>

The example above in the **Multiversion Support** section shows how code can later be loaded by nested require() calls. 

## <a name="modifiers">Module Modifiers</a>

There are some cases where you want to be able to modify the behavior of a module. A common case is setting up a base module but modifying it only if some specific information or state is available.

One example could be a module that calculates DOM node positions and sizes. In standards mode, the calculations are simpler, but in quirks mode it can be trickier. You may want to avoid loading the quirks mode code unless the browser page is really in quirks mode, but you still want the node dimension module to have the same interface to other modules.

Enter Module Modifiers. They allow you to modify properties of a module. Some properties of module modifiers:

* modifiers are executed before the target module is given to other modules as dependency.
* modifiers can be specified before the target module is loaded.
* modifiers can be lazy-loaded and lazy-evaluated: only executed if the target module is loaded.
* modifiers can only modify **properties** of a module. They cannot completely redefine the whole module.

require.modify() is used for modifiers, and require.modify() can be called in two ways:

* Modifier registration.
* Modifier definition.

### <a name="modregister">Modifier Registration</a>

If you want to tell require.js that there is a modifier, but not actually load the modifier or the target yet, then just register the modifiers with require.js:

    require.modify({
        "my/target1": "my/modifier1",
        "my/target1": "my/modifier2",
        "my/target2": "my/modifier3"
    });

This call tells require.js to load the "my/modifier1" and "my/modifier2" modules if the "my/target1" module is loaded and to load "my/modifier3" module if "my/target2" is loaded.

You are not required to register modifiers with require.js. Only do it if you want to avoid loading the target modules and defining the modifiers right away. Otherwise, you can use Modifier Definition.

### <a name="moddef">Modifier Definition</a>

A modifier definition looks like a normal define() module definition, but:

* require.modify() is used.
* the target module's name is listed first in the require.modify() call.
* modifiers do not need to return an object from the function definition, since they are just modifying another module.

For the example given above in Modifier Registration, where "my/target1" is the target module and "my/modifier1" is the modifier, the "my/modifier1" module might look like this:

    require.modify(
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

## <a name="webworker">Web Worker Support</a>

As of release 0.12, RequireJS can be run inside a Web Worker. Just use importScripts() inside a web worker to load require.js (or the JS file that contains the require() definition), then call require.

You will likely need to set the **baseUrl** [configuration option](#config) to make sure require() can find the scripts to load.

You can see an example of its use by looking at one of the files used in [the unit test](http://github.com/jrburke/requirejs/blob/master/tests/workers.js).

## <a name="rhino">Rhino Support</a>

RequireJS can be used in Rhino, just be sure to load require.js and require/rhino.js before doing any require calls:

    load("requirejs/require.js");
    load("requirejs/require/rhino.js");

    //Set up any config values, baseUrl is required so module names
    //will map correctly to paths.
    require({
        baseUrl: 'path/to/scripts'
    });

    //Now load the top level script.
    require(['startingscript']);

You can see an example of RequireJS working in Rhino by looking at [tests/all-rhino.js](http://github.com/jrburke/requirejs/blob/master/tests/all-rhino.js). The test file is a bit different from above since each test sets its own baseUrl.
