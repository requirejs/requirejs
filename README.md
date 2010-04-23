# RequireJS

RequireJS loads plain JavaScript files as well as more defined modules. It is optimized for in-browser use, but it can be used in other JavaScript environments, like Rhino and [Node](requirejs/tree/master/docs/node.md). It implements the [CommonJS Transport/C proposal](http://wiki.commonjs.org/wiki/Modules/Transport/C) API.

RequireJS uses plain script tags to load modules/files, so it should allow for easy debugging. It can be used [simply to load existing JavaScript files](requirejs/tree/master/docs/api.md#jsfiles), so you can add it to your existing project without having to re-write your JavaScript files.

RequireJS includes [an optimization tool](requirejs/tree/master/docs/optimization.md) you can run as part of your packaging steps for deploying your code. The optimization tool can combine and minify your JavaScript files to allow for better performance.

If the JavaScript file defines a JavaScript module via [require.def()](requirejs/tree/master/docs/api.md#define), then there are other benefits RequireJS can offer: [better CommonJS support](http://wiki.commonjs.org/wiki/Modules/Transport/C) and [loading multiple versions](requirejs/tree/master/docs/api.md#multiversion) of a module in a page. RequireJS also allows for [module modifiers](requirejs/tree/master/docs/api.md#modifiers) and has a plugin system that supports features like [i18n string bundles](requirejs/tree/master/docs/api.md#i18n) and [text file dependencies](requirejs/tree/master/docs/api.md#text).

RequireJS does not have any dependencies on a JavaScript framework. It is tri-licensed -- BSD, MIT, and GPL.

The standard require.js file is around 3.7KB when minified via Closure Compiler and gzipped. require.js can be built without some features, with the smallest option (just dependency tracking and simple module loading) weighing in at 2.6KB minified, gzipped.

The unit tests work in IE 6+, Firefox 3.0+, Safari 4+, Chrome 3+, and Opera 10+.

Latest Release: [0.10.0](http://requirejs.org/docs/download.html)

* [Start](requirejs/tree/master/docs/start.md)
    * [Using it with jQuery](requirejs/tree/master/docs/jquery.md)
* [Download](requirejs/tree/master/docs/download.md)
* [API](requirejs/tree/master/docs/api.md)
* [Optimization](requirejs/tree/master/docs/optimization.md)
* [Why](requirejs/tree/master/docs/why.md)
* [Requirements](requirejs/tree/master/docs/requirements.md)
* [History](requirejs/tree/master/docs/history.md)
* [Get involved or ask questions](http://groups.google.com/group/requirejs)
* [Blog](http://tagneto.blogspot.com)
