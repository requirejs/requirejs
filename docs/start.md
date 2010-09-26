# RequireJS Start

How to get started with RequireJS:

* [Get RequireJS](#get)
* [Add RequireJS to your project](#add)
* Once you are ready to deploy your code, [use the Optimization Tool](#optimize) to make your code go fast.

If you are using jQuery, there is a [targeted jQuery tutorial](jquery.md).

## <a name="get">Get RequireJS</a>

Go to the [download](download.md) page and get the file. There is a build of jQuery with integrated require() support too.

## <a name="add">Add RequireJS</a>

For jQuery-specific advice, see the [jQuery integration page](jquery.md).

This setup assumes you keep all your JavaScript files in a "scripts" directory in your project. For example, if you have a project that has an project.html page, with some scripts, the directory layout might look like so:

* project-directory/
    * project.html
    * scripts/
        * main.js
        * helper/
            * util.js

Add require.js to the scripts directory, so it looks like so:

* project-directory/
    * project.html
    * scripts/
        * main.js
        * require.js
        * helper/
            * util.js

To take full advantage of the optimization tool, it is suggested that you keep all inline script out of the HTML, and only reference require.js with a require call like so to load your script:

    <!DOCTYPE html>
    <html>
        <head>
            <title>My Sample Project</title>
            <!-- data-main attribute tells require.js to load
                 scripts/main.js after require.js loads. -->
            <script data-main="main" src="scripts/require.js"></script>
        </head>
        <body>
            <h1>My Sample Project</h1>
        </body>
    </html>

Inside of main.js, you can use require() to load any other scripts you need to run:

    require(["helper/util"], function() {
        //This function is called when scripts/helper/util.js is loaded.

        require.ready(function() {
            //This function is called when the page is loaded (the DOMContentLoaded
            //event) and when all required scripts are loaded.
            
            //Do nested require() calls in here if you want to load code
            //after page load.
        });
    });

That is it! Check out the [API docs](api.md) to learn more about require().

## <a name="optimize">Optimize</a>

Once you are finished doing development and want to deploy your code for your end users, you can use the [optimization tool](optimization.md) to combine the JavaScript files together and minify it. In the example above, it can combine main.js and helper/util.js into one file and minify it using Google's Closure Compiler.
