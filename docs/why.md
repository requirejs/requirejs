# Why RequireJS?

## The Problem

* Web sites are turning into Web apps
* Code complexity grows as the site gets bigger
* Assembly gets harder
* Developer wants discrete JS files/modules
* Deployment wants optimized code in just one or a few HTTP calls

## Solution

Front-end developers need a solution with:

* Some sort of #include/import/require
* ability to load nested dependencies
* ease of use for developer but then backed by an optimization tool that helps deployment

## Script Loading APIs

First thing to sort out is a script loading API. Here are some candidates:

* Dojo: dojo.require("some.module")
* LABjs: $LAB.script("some/module.js")
* CommonJS: require("some/module")

All of them map to loading some/path/some/module.js. Ideally we could choose the CommonJS syntax, since it is likely to get more common over time, and we want to reuse code.

We also want some sort of syntax that will allow loading plain JavaScript files that exist today -- a developer should not have to rewrite all of their JavaScript to get the benefits of script loading.

However, we need something that works well in the browser. The CommonJS require() is a synchronous call, it is expected to return the module immediately. This does not work well in the browser.

## Async vs Sync

This example should illustrate the basic problem for the browser. Suppose we have an Employee object and we want a Manager object to derive from the Employee object. [Taking this example](https://developer.mozilla.org/en/Core_JavaScript_1.5_Guide%3aThe_Employee_Example%3aCreating_the_Hierarchy), we might code it up like this using our script loading API:

    var Employee = require("types/Employee");
    
    function Manager () {
        this.reports = [];
    }
    
    //Error if require call is async
    Manager.prototype = new Employee();

As the comment indicates above, if require() is async, this code will not work. However, loading scripts synchronously in the browser kills performance. So, what to do?

## Script Loading: XHR

It is tempting to use XMLHttpRequest (XHR) to load the scripts. If XHR is used, then we can massage the text above -- we can do a regexp to find require() calls, make sure we load those scripts, then use eval() or script elements that have their body text set to the text of the script loaded via XHR.

Using eval() to evaluate the modules is bad:

* Developers have been taught that eval() is bad.
* Some environments do not allow eval().
* It is harder to debug. Firebug and WebKit's inspector have an //@ sourceURL= convention, which helps give a name to evaled text, but this support is not universal across browsers.
* eval context is different across browsers. You might be able to use execScript in IE to help this, but it means more moving parts.

Using script tags with body text set to file text is bad:

* While debugging, the line number you get for an error does not map to the original source file.

XHR also has issues with cross-domain requests. Some browsers now have cross-domain XHR support, but it is not universal, and IE decided to create a different API object for cross-domain calls, XDomainRequest. More moving parts and more things to get wrong. In particular, you need to be sure to not send any non-standard HTTP headers or there may be another "preflight" request done to make sure the cross-domain access is allowed.

Dojo has used and XHR-based loader with eval(), and while it works, it has been a source of frustration for developers. Dojo has an xdomain loader but it requires the modules to be modified via a build step to use a function wrapper, so that script src="" tags can be used to load the modules. There are many edge cases and moving parts that create a tax on the developer.

If we are creating a new script loader, we can do better.

## Script Loading: Web Workers

Web Workers might be another way to load scripts, but:

* It does not have strong cross browser support
* It is a message-passing API, and the scripts likely want to interact with the DOM, so it means just using the worker to fetch the script text, but pass the text back to the main window then use eval/script with text body to execute the script. This has all of the problems as XHR mentioned above.

## Script Loading: document.write()

document.write() can be used to load scripts -- it can load scripts from other domains and it maps to how browsers normally consume scripts, so it allows for easy debugging.

However, in the [Async vs Sync example](#async) we cannot just execute that script directly. Ideally we could know the require() dependencies before we execute the script, and make sure those dependencies are loaded first. But we do not have access to the script before it is executed.

Also, document.write() does not work after page load. A great way to get perceived performance for your site is loading code on demand, as the user needs it for their next action.

Finally, scripts loaded via document.write() will block page rendering. When looking at reaching the very best performance for your site, this is undesirable.

## Script Loading: head.appendChild(script)

We can create scripts on demand and add them to the head:

    var head = document.getElementsByTagName('head')[0],
        script = document.createElement('script');
    
    script.src = url;
    head.appendChild(script);

There is a bit more involved than just the above snippet, but that is the basic idea. This approach has the advantage over document.write in that it will not block page rendering and it works after page load.

However, it still has the [Async vs Sync example](#async) problem: ideally we could know the require() dependencies before we execute the script, and make sure those dependencies are loaded first.

## Function Wrapping

So we need to know the dependencies and make sure we load them before executing our script. The best way to do that is construct our module loading API with function wrappers. Like so:

    define(
        //The name of this module
        "types/Manager",

        //The array of dependencies
        ["types/Employee"],

        //The function to execute when all dependencies have loaded. The arguments
        //to this function are the array of dependencies mentioned above.
        function (Employee) {
            function Manager () {
                this.reports = [];
            }
            
            //This will now work
            Manager.prototype = new Employee();
    
            //return the Manager constructor function so it can be used by other modules.
            return Manager;
        }
    );

And this is the syntax used by RequireJS. There is also a simplified syntax if you just want to load some plain JavaScript files that do not define modules:

    require(["some/script.js"], function() {
        //This function is called after some/script.js has loaded.
    });


This type of syntax was chosen because it is terse and allows the loader to use head.appendChild(script) type of loading.

It differs from the normal CommonJS syntax out of necessity to work well in the browser. There have been suggestions that the normal CommonJS syntax could be used with head.appendChild(script) type of loading if a server process transforms the modules to a transport format that has a function wrapper.

I believe it is important to not force the use of a runtime server process to transform code:

* It makes debugging weird, line numbers will be off vs. the source file since the server is injecting a function wrapper.
* It requires more gear. Front-end development should be possible with static files.
