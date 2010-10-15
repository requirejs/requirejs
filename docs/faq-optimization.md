# FAQ: RequireJS Optimizations

### <a name="usage">How do I use the Optimization Tool?</a>

See the [general optimization page](optimization.md) for basic set-up. Also see the [jQuery doc page](jquery.md) for a good way to set up your project, even if you are not using jQuery.

### <a name="priority">How can I download all script dependencies in parallel?</a>

Using [require()]() and [define()](api.md#define) to define script modules and dependencies is an efficient syntax for indicating related code. However, for deploying code in the browser, it may not lead to the best overall performance. To find nested dependencies, a script has to be fetched, then a require() or define() call in that script might trigger other script downloads.

The [Optimization Tool](optimization.md) allows a quick way to [build all your scripts into one file](optimization.md#onejs), so only one script download is needed for your page.

However, if you have many pages in your web app, it may make more sense to optimize your scripts into a set of two or three optimized layers:

* One layer for common toolkit code, like require.js plus jQuery, Dojo, Prototype or MooTools (toolkit.js)
* One layer for common web app code (appcommon.js)
* One layer for page-specific code  (page.js)

Ideally you could do that layering after you finish development, and tune those layers for optimal, parallel download of the files, without having to change all your scripts.

This is possible with RequireJS:

* [Optimize your project](optimization.md#wholeproject) to create the three script layers.
* Use the [**priority** config value](api.md#config) to pass the list of layers to priority download to the top-level require() call in the HTML file(s).

Script modules/files specified in the config's priority array will be downloaded in parallel before any other script dependencies are traced.

This example uses the [combined RequireJS+jQuery](download.md#jqueryrequirejs) file to demonstrate the approach:

Assume the project has the following structure:

* app.build.js (the build profile used by optimization tool)
* webapp
    * page1.html
    * page2.html
    * scripts
        * require-jquery.js (used on both pages, "toolkit")
        * page1.js (lists the dependencies for page 1)
        * page2.js (lists the dependencies for page 2)
        * object.js (used on both pages, "appcommon")
        * event.js (used on both pages, "appcommon")
        * widget.js (used on both pages, "appcommon")
        * Dialog.js (used on both pages, "appcommon")
        * Slider.js (used only on page 2)
        * Tabs.js (used only on page 1)
* webapp-build
    * this directory will hold the optimized files

page1.html might look like this:

    <!DOCTYPE html>
    <html>
        <head>
            <title>Page 1</title>
            <script src="scripts/require-jquery.js"></script>
            <script>
                require({
                    //Leave priority commented out in dev
                    //priority: ["appcommon", "page1"]
                },
                ["page1"]);
            </script>
        </head>
        <body>
        </body>
    </html>

with page1.js looking like this:

    define("page1",
        ["jquery", "object", "event", "widget", "Dialog", "Tabs"],
        function ($, object, event, widget, Dialog, Tabs) {
            ...
        }
    );

page2.html and page2.js would look similar, except referencing "page2" instead of "page1" and using "Slider" instead of "Tabs" in page2.js.

The build profile, **app.build.js** would look like this:

    {
        appDir: "webapp",
        baseUrl: "scripts",
        dir: "webapp-build",
        optimize: "none",
        paths: {
            "jquery": "require-jquery"
        },
        modules: [
            {
                name: "appcommon",
                //Indicate we want to create a new file that did
                //not exist in the source structure
                create: true,
                exclude: ["jquery"],
                include: ["object", "event", "widget", "Dialog"]
            },
            {
                name: "page1",
                exclude: ["jquery", "appcommon"]
            },
            {
                name: "page2",
                exclude: ["jquery", "appcommon"]
            }
        ]
    }

Once the build is run, it will generate the contents of **webapp-build** that look similar to **webapp**, except that the contents are optimized and there is a scripts/appcommon.js file now.

In the web-build/page1.html and webapp-build/page2.html, comment out the **priority** config option. page1.html example:

    <!DOCTYPE html>
    <html>
        <head>
            <title>Page 1</title>
            <script src="scripts/require-jquery.js"></script>
            <script>
                require({
                    priority: ["appcommon", "page1"]
                },
                ["page1"]);
            </script>
        </head>
        <body>
        </body>
    </html>

The **priority** config value tells RequireJS to load appcommon.js and page1.js in parallel before tracing dependencies. With those two files, along with require-jquery.js (which contains the jQuery definition), all the dependencies in the page will be loaded with three requests, with the appcommon.js and page1.js scripts being loaded asynchronously and in parallel.
