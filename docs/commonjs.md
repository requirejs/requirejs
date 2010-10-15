# CommonJS Notes

* [Introduction](#intro)
* [Manual Conversion](#manualconversion)
* [Conversion Tool](#autoconversion)
* [Setting Exported Value](#exports)
* [Alternative Syntax](#altsyntax)
* [Loading Modules from CommonJS Packages](packages)
* [Optimization Tool](#optimize)

## <a name="intro">Introduction</a>

[CommonJS](http://www.commonjs.org/) defines [a module format](http://wiki.commonjs.org/wiki/Modules/1.1.1). Unfortunately, it was defined without giving browsers equal footing to other JavaScript environments. Because of that, there are CommonJS spec proposals for [Transport formats](http://wiki.commonjs.org/wiki/Modules/Transport) and an [asynchronous require](http://wiki.commonjs.org/wiki/Modules/Async/A).

RequireJS tries to keep with the spirit of CommonJS, with using string names to refer to dependencies, and to avoid modules defining global objects, but still allow coding a module format that works well natively in the browser. RequireJS implements the [Asynchronous Module Definition](http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition) (formerly Transport/C) proposal.

If you have modules that are in the traditional CommonJS module format, then you can easily convert them to work with RequireJS. Alternatively, if you are using the RequireJS r.js Node adapter, you do not need to convert third-party modules -- r.js will do that on the fly as modules are loaded.

## <a name="manualconversion">Manual Conversion</a>

If you just have a few modules to convert, then all you need to do is wrap the module in this code:

    define(function(require, exports, module) { 
        //Put traditional CommonJS module content here
    });

**IMPORTANT**: The function arguments should always be listed as **require, exports, module**, with those exact names and in that exact order, otherwise chaos will ensue. You can leave off exports and module from the list, but if they are needed, they need to be specified in the exact order illustrated here.

## <a name="autoconversion">Conversion Tool</a>

If you have many modules to convert, RequireJS has a converter tool at **requirejs/convert/convertCommonJs.sh** (use .bat if you are on Windows). [Download the RequireJS source distribution](download.md#optimizationtool) to get the tool. Give it the path to the directory you want to convert and an output directory:

    convertCommonJs.sh path/to/commonjs/modules/ path/to/output

## <a name="exports">Setting Exported Value</a>

There are some CommonJS systems that allow setting the exported value via module.setExports() or assigning the exported value as module.exports. Both of those idioms are supported by RequireJS, but there is another, easier one that is supported too -- just return the value from the function passed to **define**:

    define(function (require) {
        var foo = require('foo');

        //Define this module as exporting a function
        return function () {
            foo.doSomething();
        };
    });

With this approach, then you normally do not need the exports and module function arguments, so you can leave them off the module definition.

## <a name="altsyntax">Alternative Syntax</a>

Instead of using require() to get dependencies inside the function passed to define(), you can also specify them via a dependency array argument to define(). The order of the names in the dependency array match the order of arguments passed to the definition function passed to define(). So the above example that uses the module **foo**:

define(['foo'], function (foo) {
    return function () {
        foo.doSomething();
    };
});

See the [API docs](api.md) for more information on that syntax.

## <a name="packages">Loading Modules from CommonJS Packages</a>

Modules in CommonJS packages can be loaded by RequireJS by setting up the RequireJS configuration to know about the location and package attributes. See the [packages API section](api.md#packages) for more information.

## <a name="optimize">Optimization Tool</a>

RequireJS has an optimization tool that can combine module definitions together into optimized bundles for browser delivery. It works as a command-line tool that you use as part of code deployment. See the [optimization docs](optimization.md) for more information.

