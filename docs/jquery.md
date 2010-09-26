# How to use RequireJS with jQuery

When a project reaches a certain size, managing the script modules for a project starts to get tricky. You need to be sure to sequence the scripts in the right order, and you need to start seriously thinking about combining scripts together into a bundle for deployment, so that only one or a very small number of requests are made to load the scripts.

You may also want to load code on the fly, after page load.

RequireJS can help you manage the script modules, load them in the right order, and make it easy to combine the scripts later via the RequireJS [optimization tool](optimization.md) without needing to change your markup. It also gives you an easy way to load scripts after the page has loaded, allowing you to spread out the download size over time.

RequireJS has a module system that lets you define well-scoped modules, but you do not have to follow that system to get the benefits of dependency management and build-time optimizations. Over time, if you start to create more modular code that needs to be reused in a few places, the module format for RequireJS makes it easy to write encapsulated code that can be loaded on the fly. It can grow with you, particularly if you want to incorporate internationalization (i18n) string bundles, to localize your project for different languages, or load some HTML strings and make sure those strings are available before executing code, or even use JSONP services as dependencies.

## Get require.js

First step is to [download a build of jQuery with RequireJS built in](download.md).

## Set up your HTML page.

A sample HTML page would look like this (assuming you put all your .js files in a "scripts" subdirectory):

    <!DOCTYPE html>
    <html>
        <head>
            <title>jQuery+RequireJS Sample Page</title>
            <script data-main="main" src="scripts/require-jquery.js"></script>
        </head>
        <body>
            <h1>jQuery+RequireJS Sample Page</h1>
        </body>
    </html>

The data-main attribute on the script tag for require.js tells RequireJS to load the scripts/main.js file. RequireJS will load any dependency that is passed to require() without a ".js" file from the same directory as require.js. If you feel more comfortable specifying the whole path, you can also do the following:

    <script data-main="scripts/main.js" src="scripts/require-jquery.js"></script>

What is in main.js? Another call to require.js to load all the scripts you need and any init work you want to do for the page. This example main.js script loads two plugins, jquery.alpha.js and jquery.beta.js (not the names of real plugins, just an example). The plugins should be in the same directory as require-jquery.js:

main.js:

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
* webapp/scripts/main.js
* webapp/scripts/require-jquery.js
* webapp/scripts/jquery.alpha.js
* webapp/scripts/jquery.beta.js

Then, in the scripts directory that has require-jquery.js and main.js, create a file called app.build.js with the following contents:

    {
        appDir: "../",
        baseUrl: "scripts/",
        dir: "../../webapp-build",
        //Comment out the optimize line if you want
        //the code minified by Closure Compiler using
        //the "simple" optimizations mode
        optimize: "none",
    
        modules: [
            {
                name: "main"
            }
        ]
    }

To use the build tool, you need Java 6 installed. Closure Compiler is used for the JavaScript minification step (if optimize: "none" is commented out), and it requires Java 6.

To start the build, go to the **webapp/scripts** directory, execute the following command:

For non-windows operating systems:

    ../../requirejs/build/build.sh app.build.js

For windows operating systems:

    ..\..\requirejs\build\build.bat app.build.js

Now, in the webapp-build directory, main.js will have the main.js contents, jquery.alpha.js and jquery.beta.js inlined. If you then load the app.html file in the webapp-build directory, you should not see any network requests for jquery.alpha.js and jquery.beta.js.

## See it in action

This example is really basic, but demonstrates how you can upgrade your code to use RequireJS, and get powerful build optimizations without needing to change your code.

Visit the [Download page](download.md) to get this jQuery sample project as a zip file.
