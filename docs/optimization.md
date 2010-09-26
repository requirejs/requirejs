# RequireJS Optimization Tool

* [Requirements](#requirements)
* [Download](#download)
* [Example Setup](#setup)
* [Optimizing one JavaScript file](#onejs)
* [Shallow exclusions for fast development](#shallow)
* [Optimizing one CSS file](#onecss)
* [Optimizing a whole project](#wholeproject)
* [All configuration options](#options)

RequireJS comes with an optimization tool that does the following:

* Combines related scripts together into build layers and minifies them via Google Closure.
* Optimizes CSS by inlining CSS files referenced by @import and removing comments.
* Can add require.js and any of its plugins to any optimized build layer.

The optimization tool is in the requirejs/build directory, and it is designed to be run as part of a build or packaging step after you are done with development and are ready to deploy the code for your users.

## <a name="requirements">Requirements</a>

The optimization tool uses [Google Closure Compiler](http://code.google.com/closure/compiler/) to do the code minification, and therefore requires [Java 6](http://java.com/) to run.

## <a name="download">Download</a>

You can download the tool on [the download page](download.md#optimizationtool).

## <a name="setup">Example Setup</a>

The examples in this page will assume you downloaded and unzipped the optimization tool in a directory that is a sibling to your project directory. The optimization tool can live anywhere you want, but you will likely need to adjust the paths accordingly in these examples.

Example setup:

* appdirectory
    * main.html
    * css
        * common.css
        * main.css
    * scripts
        * require.js
        * main.js
        * one.js
        * two.js
        * three.js
* requirejs (the unzipped optimization tool from the [download page](download.md))
    * build
        * build.sh
    * require
    * require.js

main.html has script tags for require.js and loads main.js via a require call, like so:

    <!DOCTYPE html>
    <html>
        <head>
            <title>My App</title>
            <link rel="stylesheet" type="text/css" href="css/main.css">
            <script data-main="main" src="scripts/require.js"></script>
        </head>
        <body>
            <h1>My App</h1>
        </body>
    </html>

main.js loads one.js, two.js and three.js via a require call:

    require(["one", "two", "three"], function (one, two, three) {
    });

main.css has content like the following:

    @import url("common.css");

    .app {
        background: transparent url(../../img/app.png);
    }

## <a name="onejs">Optimizing one JavaScript file</a>

Use the above example setup, if you just wanted to optimize main.js, you could use this command, from inside the **appdirectory/scripts** directory:

    ../../requirejs/build/build.sh name=main out=main-built.js baseUrl=.

This will create a file called **appdirectory/scripts/main-built.js** that will include the contents of main.js, one.js, two.js and three.js.

Normally you should **not** save optimized files with your pristine project source. Normally you would save them to a copy of your project, but to make this example easier it is saved with the source. Change the **out=** option to any directory you like, that has a copy of your source. Then, you can change the main-built.js file name to just main.js so the HTML page will load the optimized version of the file.

If you wanted to include require.js with the main.js source, you can use this command:

    ../../requirejs/build/build.sh name=main out=main-built.js baseUrl=. includeRequire=true

Once that is done, you can then rename the main-built.js file to require.js and your optimized project will only need to make one script request!

## <a name="shallow">Shallow exclusions for fast development</a>

You can use the [one JavaScript file optimization](#onejs) approach to make your development experience faster. By optimizing all the modules in your project into one file, except the one you are currently developing, you can reload your project quickly in the browser, but still give you the option of fine grained debugging in a module.

You can do this by using the **excludeShallow** option. Using the [example setup](#example) above, assume you are currently building out or debugging two.js. You could use thing optimization command:

    ../../requirejs/build/build.sh name=main excludeShallow=two out=main-built.js baseUrl=. includeRequire=true

If you do not want the main-build.js file minified, pass **optimize=none** in the command above.

Then configure the HTML page to load the main-built.js file instead of main.js by configuring the path used for "main" to be "main-built":

    <!DOCTYPE html>
    <html>
        <head>
            <title>My App</title>
            <link rel="stylesheet" type="text/css" href="css/main.css">
            <script src="scripts/require.js"></script>
            <script>
                require({
                    paths: {
                        //Comment out this line to go back to loading
                        //the non-optimized main.js source file.
                        "main": "main-built"
                    }
                }, ["main"]);
            </script>
        </head>
        <body>
            <h1>My App</h1>
        </body>
    </html>

Now, when this page is loaded, the require() for "main" will load the main-built.js file. Since excludeShallow told it just to exclude two.js, two.js will still be loaded as a separate file, allowing you to see it as a separate file in the browser's debugger, so you can set breakpoints and better track its individual changes.

## <a name="onecss">Optimizing one CSS file</a>

Use the above example setup, if you just wanted to optimize main.css, you could use this command, from inside the **appdirectory/css** directory:

    ../../requirejs/build/build.sh cssIn=main.css out=main-built.css

This will create a file called **appdirectory/css/main-build.css** that will include the contents of common.js, have the url() paths properly adjusted, and have comments removed.

See the notes for the [Optimizing one JavaScript file](#onejs) about avoiding saving optimized files in your pristine source tree. It is only done here to make the example simpler.

**NOTE**: The url() path fixing will always fix the paths relative to the **cssIn** build option path, not the **out** build option.

## <a name="wholeproject">Optimizing a whole project</a>

The optimization tool can take care of optimizing all the CSS and JS files in your project by using a build profile.

Create a build profile, call it app.build.js, and put it in the **scripts** directory. The app.build.js file can live anywhere, but just be sure to adjust the paths accordingly in the example below -- all paths will be relative to where the app.build.js is located. Example app.build.js:

    {
        appDir: "../",
        baseUrl: "scripts/",
        dir: "../../appdirectory-build",
        modules: [
            {
                name: "main"
            }
        ]
    }

This build profile tells RequireJS to copy all of **appdirectory** to a sibling directory called **appdirectory-build** and apply all the optimizations in the **appdirectory-build** directory. It is strongly suggested you use a different output directory than the source directory -- otherwise bad things will likely happen as the optimization tool overwrites your source.

RequireJS will use **baseUrl** to resolve the paths for any module names. The **baseUrl** should be relative to **appDir**.

In the **modules** array, specify the module names that you want to optimize, in the example, "main". "main" will be mapped to **appdirectory/scripts/main.js** in your project. The build system will then trace the dependencies for main.js and inject them into the **appdirectory-build/scripts/main.js** file.

It will also optimize any CSS files it finds inside **appdirectory-build**.

To run the build on Unix/Linux systems, run this command from inside the **appdirectory/scripts** directory:

    ../../requirejs/build/build.sh app.build.js

For windows operating systems:

    ..\..\requirejs\build\build.bat app.build.js

Once the build is done, you can use **appdirectory-build** as your optimized project, ready for deployment.

## <a name="options">All configuration options</a>

There is an [example.build.js](http://github.com/jrburke/requirejs/blob/master/build/example.build.js) file in the requirejs/build directory that details all of the allowed optimization tool configuration options.
