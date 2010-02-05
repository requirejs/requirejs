# How to use RequireJS with jQuery

When a project reaches a certain size, managing the script modules for a project starts to get tricky. You need to be sure to sequence the scripts in the right order, and you need to start seriously thinking about combining scripts together into a bundle for deployment, so that only one or a very small number of requests are made to load the scripts.

You may also want to load code on the fly, after page load.

RequireJS can help you manage the script modules, load them in the right order, and make it easy to combine the scripts later via the RequireJS build tools without needing to change your markup. It also gives you an easy way to load scripts after the page has loaded, allowing you to spread out the download size of your logic over time.

RequireJS has a module system that lets you define well-scoped modules, but you do not have to follow that system to get the benefits of dependency management and build tool optimizations. Over time, if you start to create more modular code that needs to be reused in a few places, the module format for RequireJS makes it easy to write encapsulated code that can be loaded on the fly. It can grow with you, particularly if you want to incorporate internationalization (i18n) string bundles, to localize your project for different languages, or load some HTML strings and make sure those strings are available before executing code.

## Get require.js

First step is integrating require.js with your code. There are two options:

1. Grab require.js from the RequireJS project and drop it in directory with jquery.js
2. Build jQuery integrated with require.js: You can use [this fork of the jQuery source](http://github.com/jrburke/jquery).


**NOTE**: Following the above approaches will get RequireJS set up with its core feature set. Later, if you want to use the i18n or text plugins with RequireJS or more sophisticated things like loading multiple versions of modules or creating module modifiers, you will need to grab the complete source version of require.js along with the require directory (which contains the i18n.js and text.js files).

## Set up your HTML page.

A sample HTML page would look like this (assuming you put all your .js files in a "scripts" subdirectory):

    <!DOCTYPE html>
    <html>
        <head>
            <title>jQuery+RequireJS Sample Page</title>
            <!-- If you built require.js into jquery
                 then you do not need the script tag for require.js here -->
            <script src="scripts/require.js"></script>
            <script src="scripts/jquery.min.js"></script>
            <script>require(["app"]);</script>
        </head>
        <body>
            <h1>jQuery+RequireJS Sample Page</h1>
        </body>
    </html>

The call to require(["app"]); tells RequireJS to load the scripts/app.js file. RequireJS will load any dependency that is passed to require() without a ".js" file from the same directory as require.js. If you feel more comfortable specifying the whole path, you can also do the following:

    <script>require(["scripts/app.js"]);</script>

What is in app.js? Another call to require.js to load all the scripts you need and any init work you want to do for the page that is not in another helper script. This example app.js script loads two plugins, jquery.alpha.js and jquery.beta.js (not the names of real plugins, just an example). The plugins should be in the same directory as jquery.js:

app.js:

    require(["jquery.alpha", "jquery.beta"], function() {
        //the jquery.alpha.js and jquery.beta.js plugins have been loaded.
        $(function() {
            $('body').alpha().beta();
        });
    });

## Feel the need for speed

Now your page is set up to be optimized very easily. Download the RequireJS source and place it anywhere you like, preferrably somewhere outside your web development area. For the purposes of this example, the RequireJS source is placed as a sibling to the **webapp** directory, which contains the HTML page and the scripts directory with all the scripts. Complete directory structure:

* requirejs/  (used for the build tools)
* webapp/app.html
* webapp/scripts/app.js
* webapp/scripts/jquery.js (if not built into jquery)
* webapp/scripts/jquery.alpha.js
* webapp/scripts/jquery.beta.js
* webapp/scripts/require.js (if not built into jquery)

Then, in the scripts directory that has jquery.js and app.js, create a file called app.build.js with the following contents:

    require({
            appDir: "../",
            baseUrl: "scripts/",
            requireUrl: "../../requirejs/require.js",
            dir: "../webapp-build",
            //Comment out the optimize line if you want
            //the code minified by Closure Compiler using
            //the "simple" optimizations mode
            optimize: "none",
            inlineText: false,
            execModules: false
        },
        "app"
    );

To use the build tool, you need Java 6 installed. Closure Compiler is used for the JavaScript minification step (if optimize: "none" is commented out), and it requires Java 6.

To start the build, go to the **webapp/scripts** directory, execute the following command:

For non-windows operating systems:

    ../../requirejs/build/build.sh app.build.js

For windows operating systems (a .bat file is in the works to make this easier):

    java -classpath ..\..\requirejs\build\lib\rhino\js.jar;..\..\requirejs\build\lib\closure\compiler.jar org.mozilla.javascript.tools.shell.Main ..\..\requirejs\build\build.js ..\..\requirejs\build\ app.build.js

Now, in the webapp-build directory, app.js will have the app.js contents, jquery.alpha.js and jquery.beta.js inlined. If you then load the app.html file in the webapp-build directory, you should not see any network requests for jquery.alpha.js and jquery.beta.js.

## See it in action

This example is really basic, but demonstrates how you can upgrade your code to use RequireJS, and get powerful build optimizations without needing to change your code.

[Here is the complete example](http://www.tagneto.org/requirejs/jquery-require-sample/) in action, [here is the zip of all the files](http://www.tagneto.org/requirejs/jquery-require-sample.zip).


