# RequireJS in Node

There is some preliminary support for RequireJS for use in [Node](http://nodejs.org).

## Doesn't Node already have a module loader?

Yes it does. That loader uses the CommonJS module format. [For various reasons](http://tagneto.blogspot.com/2010/03/commonjs-module-trade-offs.html), the CommonJS module format is non-optimal for the browser. By using RequireJS on the server, you can use one format for all your modules, whether they are running server side or in the browser. That way you can preserve the speed benefits and easy debugging you get with RequireJS in the browser, and not have to worry about extra translation costs for moving between two formats.

## Can I use server modules already written in the CommonJS module format?

Yes! The Node adapter for RequireJS, called r.js, can automatically convert CommonJS modules into the RequireJS format on the fly, as they are loaded, so you can use your existing modules without modifying them.

However, RequireJS does not use search paths for modules. It only does the following:

* If the module ID is one of the modules that Node contains within itself (the ones in the Node's lib directory in its source distribution), it will be used.
* Otherwise the module is assumed to be relative to the file that is given to node to start your app.

You can always use the [Configuration Options](api.md#config) for RequireJS in your top level app file to configure paths and even a different baseUrl for your modules.

## How do I use it?

Download r.js from the [the download page](download.md#node) and place it on your disk somewhere. Then run this command:

    node path/to/r.js myNodeApp.js

This assumes you are in the directory that contains myNodeApp.js, your top-level node application file.

That is it!

The on-the-fly CommonJS module conversion could hit edge cases where it may not work. If you need to get get some visibility into where it failed, you can pass **debug** after r.js to get some printout on the converstion process and any problems during module execution:

    node path/to/r.js debug myNodeApp.js

Node integration is a relatively new feature, so I expect the conversion process may not work for all modules, and in particular, RequireJS has a different approach to circular dependencies than normal CommonJS modules.

If you find you have a problem, and want to report it, use the [RequireJS GitHub Issues page](http://github.com/jrburke/requirejs/issues). If you can attach the output of the **debug** run, that would be helpful, **but be forewarned**, it is very verbose and prints out all the source code.

If you want to discuss the RequireJS-Node integration, you can use the [RequireJS Group](http://groups.google.com/group/requirejs).
