# FAQ: RequireJS Advanced Usage

* [How can I rename require?](#rename)
* [What about loading CSS?](#css)

### <a name="rename">How can I rename require?</a>

RequireJS and its optimization tool need to be version 0.11 or higher for this to work.

Why would you want to do this? You may have very strict global namespace requirements or you may be using code that already defines a require and you want to avoid interference. There are two steps to use the require defined by RequireJS with a different name:

#### 1) Modify the source of require.js

There needs to be a wrapper around the require.js code so you can set the require function to the name of your choosing:

    var myGlobalRequire = (function () {
        //Define a require object here that has any
        //default configuration you want for RequireJS. If
        //you do not have any config options you want to set,
        //just use an simple object literal, {}. You may need
        //to at least set baseUrl.
        var require = {
            baseUrl: '../'
        };

        //INSERT require.js CONTENTS HERE

        return require;
    }());

#### 2) Modify loaded files

For any files you load with this new function, if those files reference require in any way, you will want to wrap them in an anonymous function to set the value of require to be your new function name that you set up in step 1:

    (function (require) {

        //Regular require references now work correctly in here.

    }(myGlobalRequire));

Following the steps above should allow you to use the optimization tool to combine scripts together effectively. You should not use the **includeRequire** optimization option though. If you want your renamed require definition in the optimized script, reference your modified require.js directly in the **include** optimization option, or as the **name** option if you want to optimize that file directly.

Thanks to [Alex Sexton](http://alexsexton.com/) and [Tobie Langel](http://tobielangel.com/) for suggesting parts of this solution.

### <a name="css">What about loading CSS?</a>

Ideally RequireJS could load CSS files as dependencies. However, there are issues knowing when a CSS file has been loaded, particularly in Gecko/Firefox when the file is loaded from another domain. Some history can be found in [this Dojo ticket](http://bugs.dojotoolkit.org/ticket/5402).

Knowing when the file is loaded  is important because you may only want to grab the dimensions of a DOM element once the style sheet has loaded.

Some people have implemented an approach where they look for a well known style to be applied to a specific HTML element to know if a style sheet is loaded. Due to the specificity of that solution, it is not something that would fit will with RequireJS. Knowing when the link element has loaded the referenced file would be the most robust solution.

Since knowing when the file has loaded is not reliable, it does not make sense to explicitly support CSS files in RequireJS loading, since it will lead to bug reports due to browser behavior. If you do not care when the file is loaded, you can easily write your own function to load CSS on demand by doing the following:

    function loadCss(url) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = url;
        document.getElementsByTagName("head")[0].appendChild(link);
    }
