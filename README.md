# RequireJS

RequireJS loads plain JavaScript files as well as more defined modules. It is optimized for in-browser use, but it can be used in other JavaScript environments, like Rhino. It implements the [CommonJS Transport/C proposal](http://wiki.commonjs.org/wiki/Modules/Transport/C) API.

RequireJS uses plain script tags to load modules/files, so it should allow for easy debugging. It can be used simply to load existing JavaScript files, so you can add it to your existing project without having to re-write your JavaScript files.

If the JavaScript file defines a JavaScript module via require.def(), then there are other benefits RequireJS can offer: better CommonJS support, loading multiple versions of a module in the same page, and better optimizations via the optimization tool. RequireJS also allows for module modifiers and has a plugin system that supports features like i18n string bundles and text file dependencies.

RequireJS does not have any dependencies on a JavaScript framework. It is tri-licensed -- BSD, MIT, and GPL.

The core require.js file around 3.5KB when minified via Closure Compiler and gzipped. require.js can also be built without some features, with the smallest option (just dependency tracking and simple module loading) weighing in at 2.4KB minified, gzipped.

The unit tests work in IE 6+, Firefox 3.0+, Safari 4+, Chrome 3+, and Opera 10+.

Latest Release: 0.8.0

* [Start](docs/start.md)
    * [Using it with jQuery](docs/jquery.md)
* [Download](docs/download.md)
* [API](docs/api.md)
* [Why](docs/why.md)
* [Requirements](docs/requirements.md)
* [History](docs/history.md)
* [Get involved or ask questions](http://groups.google.com/group/requirejs)
* [Blog](http://tagneto.blogspot.com)
