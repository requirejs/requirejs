# RequireJS

RequireJS loads plain JavaScript files as well as more defined modules. It is
optimized for in-browser use, including in
[a Web Worker](requirejs/tree/master/docs/api.md#webworker), but it can be used
in other JavaScript environments, like Rhino and
[Node](requirejs/tree/master/docs/node.md). It implements the
[Asynchronous Module](http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition)
API.

RequireJS uses plain script tags to load modules/files, so it should allow for
easy debugging. It can be used
[simply to load existing JavaScript files](requirejs/tree/master/docs/api.md#jsfiles),
so you can add it to your existing project without having to re-write your
JavaScript files.

RequireJS includes [an optimization tool](requirejs/tree/master/docs/optimization.md)
you can run as part of your packaging steps for deploying your code. The
optimization tool can combine and minify your JavaScript files to allow for
better performance.

If the JavaScript file defines a JavaScript module via
[define()](requirejs/tree/master/docs/api.md#define), then there are other benefits
RequireJS can offer: [better CommonJS support](requirejs/tree/master/docs/commonjs.md)
and [loading multiple versions](requirejs/tree/master/docs/api.md#multiversion)
of a module in a page. RequireJS also has a plugin system that supports features like
[i18n string bundles](requirejs/tree/master/docs/api.md#i18n), and
[text file dependencies](requirejs/tree/master/docs/api.md#text).

RequireJS does not have any dependencies on a JavaScript framework.
It is dual-licensed -- new BSD or MIT.

The standard require.js file is around 5KB when minified via Closure Compiler
and gzipped.

RequireJS works in IE 6+, Firefox 2+, Safari 3.2+, Chrome 3+, and Opera 10+.

[Latest Release](http://requirejs.org/docs/download.html)

## Directories

* **dist**: Scripts and assets to generate the requirejs.org docs, and for
generating a require.js release.
* **docs**: The raw HTML files for the requirejs.org docs. Only includes the
body of each page. Files in **dist** are used to generate a complete HTML page.
* **tests**: Tests that use require.js, order.js text.js, and i18n.js.
* **testBaseUrl.js**: A file used in the tests inside **tests**. Purposely
placed outside the tests directory for testing paths that go outside a baseUrl.
* **updatesubs.sh**: Updates projects that depend on require.js Assumes the
projects are siblings to this directory and have specific names. Useful to
copy require.js to dependent projects easily while in development.

The following are loader plugins which can be released on a separate schedule
from each other and from require.js. They are included in this repo because
some of the tests depend on them. At some point they may be separated out into
separate projects.

*i18n.js
*order.js
*text.js
