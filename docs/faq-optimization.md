# FAQ: RequireJS Optimization Tool

* [How do I use the Optimization Tool?](#usage)
* [What if I just have some JavaScript files to optimize, not a whole application directory?](#scriptsonly)
* [Expanding on the previous question, what if I want optimize to just one JS request?](#onescript)


### <a name="usage">How do I use the Optimization Tool?</a>

See the [general optimization page](optimization.md) for basic set-up. Also see the [jQuery doc page](jquery.md) for a good way to set up your project, even if you are not using jQuery.

### <a name="scriptsonly">What if I just have some JavaScript files to optimize, not a whole application directory?</a>

In this case, you have just some .js files you want to optimize and do not want to copy a whole application directory. Here is how you might have your code set up:

* appdirectory
    * app.html
    * scripts
        * require.js
        * app.js
        * one.js
        * two.js
        * three.js
* requirejs (the unzipped optimization tool from the [download page](download.md))

app.html has script tags for require.js and loads app.js via a require call, like so:

    <!DOCTYPE html>
    <html>
        <head>
            <title>My App</title>
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

You just want combine app.js, one.js, two.js and three.js into one script file, and you just want to process the .js files, you do not want the optimization tool to copy over your HTML and CSS, and therefore skip the CSS optimizations.

In that case, create a build profile, call it app.build.js, and put it in the **scripts** directory. The app.build.js file can live anywhere, but just be sure to adjust the paths accordingly in the example below -- all paths will be relative to where the app.build.js is located.

    require({
        baseUrl: "./"
        dir: "../scripts-build",
        requireUrl: "../../requirejs/require.js"
    },
    "app");

This build profile tells RequireJS to treat the baseUrl to find scripts as the current directory (the **scripts** directory since this example assumes app.build.js is in the **scripts** directory), and to put the built output in the **scripts-build** directory, which will be a sibling to the **scripts** directory. It is strongly suggested you use a different output directory than the source directory -- otherwise bad things will likely happen as the optimization tool overwrites your source.

The **requireUrl** tells the optimization tool where to find the require.js that accompanies the optimization tool. The tool uses require.js in the optimization process.

The final argument to the require() call, **"app"**, tells the build system to use app.js as the basis for the build layer. The build system will then trace the dependencies for app.js and inject them into the **scripts-build/app.js** file.

To run the build on Unix/Linux systems, run this command from inside the **scripts** directory:

    ../../requirejs/build/build.sh app.build.js

For windows operating systems (a .bat file is in the works to make this easier):

    java -classpath ..\..\requirejs\build\lib\rhino\js.jar;..\..\requirejs\build\lib\closure\compiler.jar org.mozilla.javascript.tools.shell.Main ..\..\requirejs\build\build.js ..\..\requirejs\build\ app.build.js

Once the build is done, you can use **scripts-build/app.js** in your deployed application. It will contain app.js, one.js, two.js and three.js.

### Expanding on the previous question, what if I want optimize to just one JS request?

In that case, assuming the same setup as above, add the **includeRequire: true** to the build profile:

    require({
        baseUrl: "./"
        dir: "../scripts-build",
        requireUrl: "../../requirejs/require.js",
        includeRequire: true
    },
    "app");

After the optimization tool runs, the **scripts-build/app.js** will include the contents of require.js, app.js, one.js, two.js and three.js. Copy **scripts-build/app.js** to your deployment area and rename it to **require.js** to load everything in one script call.

