# RequireJS Optimization Tool

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
    * app.html
    * css
        * common.css
        * app.css
    * scripts
        * require.js
        * app.js
        * one.js
        * two.js
        * three.js
* requirejs (the unzipped optimization tool from the [download page](download.md))
    * build
        * build.sh
    * require
    * require.js

app.html has script tags for require.js and loads app.js via a require call, like so:

    <!DOCTYPE html>
    <html>
        <head>
            <title>My App</title>
            <link rel="stylesheet" type="text/css" href="css/app.css">
            <script src="scripts/require.js"></script>
            <script>require(["app"]);</script>
        </head>
        <body>
            <h1>My App</h1>
        </body>
    </html>

app.js loads one.js, two.js and three.js via a require call:

    require(["one", "two", "three"], function (one, two, three) {
    });

app.css has content like the following:

    @import url("common.css");

    .app {
        background: transparent url(../../img/app.png);
    }

## <a name="onejs">Optimizing one JavaScript file</a>

Use the above example setup, if you just wanted to optimize app.js, you could use this command, from inside the **appdirectory/scripts** directory:

    ../../requirejs/build/build.sh name=app out=app-built.js baseUrl=.

This will create a file called **appdirectory/scripts/app-built.js** that will include the contents of app.js, one.js, two.js and three.js.

Normally you should **not** save optimized files with your pristine project source. Normally you would save them to a copy of your project, but to make this example easier it is saved with the source. Change the **out=** option to any directory you like, that has a copy of your source. Then, you can change the app-built.js file name to just app.js so the HTML page will load the optimized version of the file.

If you wanted to include require.js with the app.js source, you can use this command:

    ../../requirejs/build/build.sh name=app out=app-built.js baseUrl=. includeRequire=true

Once that is done, you can then rename the app-built.js file to require.js and your optimized project will only need to make one script request!

## <a name="onecss">Optimizing one CSS file</a>

Use the above example setup, if you just wanted to optimize app.css, you could use this command, from inside the **appdirectory/css** directory:

    ../../requirejs/build/build.sh cssIn=app.css out=app-built.css

This will create a file called **appdirectory/css/app-build.css** that will include the contents of common.js, have the url() paths properly adjusted, and have comments removed.

See the notes for the [Optimizing one JavaScript file](#onejs) about avoiding saving optimized files in your pristine source tree. It is only done here to make the example simpler.

**NOTE**: The url() path fixing will always fix the paths relative to the **cssIn** build option path, not the **out** build option.

##Optimizing a whole project

The optimization tool can take care of optimizing all the CSS and JS files in your project by using a build profile.

Create a build profile, call it app.build.js, and put it in the **scripts** directory. The app.build.js file can live anywhere, but just be sure to adjust the paths accordingly in the example below -- all paths will be relative to where the app.build.js is located. Example app.build.js:

    {
        appDir: "../",
        baseUrl: "scripts/",
        dir: "../../appdirectory-build",
        modules: [
            {
                name: "app"
            }
        ]
    }

This build profile tells RequireJS to copy all of **appdirectory** to a sibling directory called **appdirectory-build** and apply all the optimizations in the **appdirectory-build** directory. It is strongly suggested you use a different output directory than the source directory -- otherwise bad things will likely happen as the optimization tool overwrites your source.

RequireJS will use **baseUrl** to resolve the paths for any module names. The **baseUrl** should be relative to **appDir**.

In the **modules** array, specify the module names that you want to optimize, in the example, "app". "app" will be mapped to **appdirectory/scripts/app.js** in your project. The build system will then trace the dependencies for app.js and inject them into the **appdirectory-build/scripts/app.js** file.

It will also optimize any CSS files it finds inside **appdirectory-build**.

To run the build on Unix/Linux systems, run this command from inside the **appdirectory/scripts** directory:

    ../../requirejs/build/build.sh app.build.js

For windows operating systems (a .bat file is in the works to make this easier):

    java -classpath ..\..\requirejs\build\lib\rhino\js.jar;..\..\requirejs\build\lib\closure\compiler.jar org.mozilla.javascript.tools.shell.Main ..\..\requirejs\build\build.js ..\..\requirejs\build\ app.build.js

Once the build is done, you can use **appdirectory-build** as your optimized project, ready for deployment.

## <a name="options">Build layer configuration options</a>

There is an [example.build.js](http://github.com/jrburke/requirejs/blob/master/build/example.build.js) file in the requirejs/build directory that details all of the allowed configuration options.
