# Download RequireJS

### Latest Release: 0.14.5

* [Fix bug](http://github.com/jrburke/requirejs/commit/88847fe53ab2e97e7ba7ec8f2afc056fb29b0a70) where scripts were not loaded from the correct path. Did not affect RequireJS+jQuery builds, but affected other builds. If you do not use a RequireJS+jQuery build, then it is strongly recommended that you upgrade from 0.14.4 to 0.14.5.
* Added an urlArgs [config option](http://requirejs.org/docs/api.html#config) to allow for cache busting when servers/browser misbehave during development.

#### <a name="requirejs">require.js</a> [Minified](http://requirejs.org/docs/release/0.14.5/minified/require.js) | [With Comments](http://requirejs.org/docs/release/0.14.5/comments/require.js)

All you need to start using require.js in the browser. Does not include i18n, text, order, JSONP plugins or Node/Rhino support.

#### <a name="requirejsplugins">require.js with plugins</a> [Minified](http://requirejs.org/docs/release/0.14.5/minified/allplugins-require.js) | [With Comments](http://requirejs.org/docs/release/0.14.5/comments/allplugins-require.js)

require.js for use in the browser with the i18n, text, order and JSONP plugins included. 

#### <a name="jqueryrequirejs">jQuery 1.4.3 with require()</a> [Minified](http://requirejs.org/docs/release/0.14.5/minified/require-jquery-1.4.3.js) | [With Comments](http://requirejs.org/docs/release/0.14.5/comments/require-jquery-1.4.3.js)

A build of jQuery with integrated require() support. **Does not include** RequireJS plugin support, so the i18n, text, order, JSONP plugins will not work with this build.

#### <a name="jqueryrequirejsplugins">jQuery 1.4.3 with require() and plugins</a> [Minified](http://requirejs.org/docs/release/0.14.5/minified/requireplugins-jquery-1.4.3.js) | [With Comments](http://requirejs.org/docs/release/0.14.5/comments/requireplugins-jquery-1.4.3.js)

A build of jQuery with integrated require() support that includes plugin support, including the i18n, text, order and JSONP plugins.

<hr>

#### <a name="samplejquery">Sample jQuery 1.4.3 project with require()</a> [Download](http://requirejs.org/docs/release/0.14.5/jquery-require-sample.zip)

A zip file containing a build of jQuery with integrated require() support, with an sample project included to show how it can be used when using jQuery. **Does not include** RequireJS plugin support, so the i18n, text, order, JSONP plugins will not work with this build.

<hr>

#### <a name="node">RequireJS adapter for Node</a> 

**[r.js](http://requirejs.org/docs/release/0.14.5/node/r.js)**: use this file if you want to code to the RequireJS module format in Node. The [Node instructions](node.md) explain how to use it. It includes all the code needed for RequireJS to function with Node.

**[index.js](http://requirejs.org/docs/release/0.14.5/node/index.js)**: the standard HTTP server-based Hello World app for Node, but coded to work with the r.js adapter. Download it in the same directory as r.js and then run this command:

    node r.js index.js

Then you can go to http://127.0.0.1:8000/ and see "Hello World" printed after about 2 seconds.

<hr>

#### <a name="optimizationtool">Optimization Tool / Full Source</a> [Download](http://requirejs.org/docs/release/0.14.5/requirejs-0.14.5.zip)

A zip file that is the optimization tool for RequireJS. It also includes the full source for require.js and its plugins.

If you want to use RequireJS in Rhino, you should use this download.

<hr>
<hr>
<hr>

### Previous releases

### Latest Release: 0.14.4

* Support jQuery 1.4.3. The bundled RequireJS+jQuery bundle now uses RequireJS 1.4.3, and it is now possible to load jQuery directly from a CDN.
* Remove the Transport D pre-built option from the download page. The Transport D adapter is still in the source bundler though.

### 0.14.3

* Support for **define()**. It works the same as **require.def()**. It is supported in order to conform with the [Asynchronous Module Proposal](http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition). require.def will continue to work, but you are encouraged to gradually migrate to define() for better compatibly with other Async Module loaders.
* text! plugin now works in Node.
* __dirname and __filename support in the r.js Node adapter.
* [Bug fix for priority option](http://github.com/jrburke/requirejs/commit/79188c726f90aefa34a16435e929a7bb98098358).
* GPL license option removed: project is now just MIT and new BSD dual-licensed, since the new BSD license is compatible with the GPL.

### 0.14.2

* Bug fixes:
    * [Fix issue with "module" dependency](http://github.com/jrburke/requirejs/commit/079e8b1e0abd4b77f0cd898c4bd77f24581942f5) not correctly assigning exported value if it is *not* listed as the last dependency.
    * [Fix "packages" config option](http://github.com/jrburke/requirejs/commit/e89c6c1523ac59e7303407d506f8e2ce75cdeb31). Its behavior was fixed to match the docs.
    * [Fix module-to-name resolution](http://github.com/jrburke/requirejs/commit/416f24a6f556c0d96f9fd9d4146a9ecfcd337668) to account for package mappings.

### 0.14.1

* Bug fixes:
    * [Issue 13](http://github.com/jrburke/requirejs/issues#issue/13): convertCommonJs.sh failed copying non-JS files)
    * [Issue 14](http://github.com/jrburke/requirejs/issues#issue/14): exports not available when no require calls)
    * [Fix for deeply cyclic dependencies](http://github.com/jrburke/requirejs/commit/c5500f135bdb006cd963d245d9d30519a7cb3945).

### 0.14.0

* [Anonymous modules support](http://tagneto.blogspot.com/2010/09/anonymous-module-support-in-requirejs.html), [CommonJS Asynchronous Module proposal](http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition) supported.
* [Loading modules from CommonJS packages](api.md#packages).
*  [Bug fixes](http://github.com/jrburke/requirejs/commits/master) (see commits starting from (see commits starting from 2010-09-15 through 2010-09-26))

### 0.13.0

* module.setExports and module.exports are now supported for converted CommonJS modules.
* [Bug fixes](http://github.com/jrburke/requirejs/commits/master) (see commits starting from 2010-07-05 through 2010-09-10), in particular [a fix to throw when a timeout for a script occurs](http://github.com/jrburke/requirejs/commit/d12935bac803bcd5981652584102282b69fdd7b1). That fix should make debugging issues much easier.

### 0.12.0

* A new plugin: [order](api.md#order) -- it ensures that scripts are fetched asynchronously and in parallel, but executed in the order specified in the call to require(). Ideal for traditional browser scripts that do not participate in modules defined via calls to require.def().
* [Web Worker support](api.md#webworker). RequireJS can be used in a web worker.
* Multiple module names can now be mapped via the **paths** config option to the same URL, and that URL will only be fetched once.
* Added Firefox 2 to supported browsers. Safari 3.2 also works with require().
* [Bug fixes](http://github.com/jrburke/requirejs/commits/master) (see commits starting from 2010-05-25 through 2010-07-04), in particular [a fix for the priority config](http://github.com/jrburke/requirejs/commit/c3ae5e96f0aadd549f30a4019fe021c057e76f50), and [improved support in IE with a bad base tag](http://github.com/jrburke/requirejs/commit/98d418fe4e4503575cca18b73260c0ab74f365fc).

### 0.11.0

* There is a new [priority config option](faq-optimization.md#priority) to indicate priority, parallel download of build layers.
* A new [JSONP plugin](api.md#jsonp) allows you to treat any JSONP service as dependency.
* require.js should be Caja-compliant. The plugins may not be, but the main require.js file passed cajoling on [http://caja.appspot.com/](http://caja.appspot.com/).
* Instructions and optimization support for [renaming require()](faq-advanced.md#rename).
* There is a [new RequireJS+Transport D download option](#requirejstransportD) that supports the [CommonJS Transport D](http://wiki.commonjs.org/wiki/Modules/Transport/D) proposal. This can be useful in conjunction with the server-side [Transporter project](http://github.com/kriszyp/transporter).

### 0.10.0

* [RequireJS works in Node](node.md).
* [Optimization tool enhancements](optimization.md):
    * For a given module, you can now use **exclude** to exclude some modules and their nested dependencies.
    * Use **excludeShallow** to just exclude a specific module, but still include its nested dependencies. This is particularly useful during development. You can do an optimized build, but just excludeShallow the current module you are developing/debugging to get fast dev load times, but still allow easy debugging and development.

### 0.9.0

* **Optimization tool refactored and improved**
    * Basic CSS optimizations are in! @import urls are inlined (with url() paths properly adjusted), and comments are removed.
    * Robust nested dependency tracing by use of an AST. As a result, the build option execModules is false by default now. This is what most people need, so it is no long necessary to include execModules: false in your build profile.
    * Now possible to build just one JS file or one CSS file at a time, no need for a build profile! See the [Optimization docs](optimization.md) for full details.
    * **Backwards incompatible change**: the format of build profiles has changed. It no longer uses require() calls but it is a completely declarative format. This should be more robust for the future, and it allowed for a cleaner refactoring of the optimization tool.
* **Support for relative module names in require.def dependencies**
    * require.def("my/project/module", ["./dependency1"], function(){}); will now load my/project/dependency1.js. This should help cut down the amount of typing for larger projects.
    * The first argument to require.def, which gives the name of the module being defined, still needs to be a full name. It cannot be a relative name (cannot start with a . or ..).
    * require.nameToUrl() does not accept relative names.
* **Backwards incompatible change**: text! plugin URLs now use . instead of ! for the file extension. So, instead of "text!some/module/sample!html" it is now "text!some/module/sample.html". Please update your code, the old !html will no longer work.
* Bug fixes

This release has a couple backwards incompatible changes. These kinds of changes will be generally avoided, and more notice via the RequireJS mailing list will be given if it needs to happen again. RequireJS has not reached 1.0, so these kinds of changes may still happen. However, there should be less of a need for a backwards incompatiable change now, and as of today, none are forecasted.

### 0.8.0

* Renamed from RunJS to RequireJS
* Adds better support for existing JS files

The previous releases were just different stages in the source tree. Here are the release notes for those versions.

#### 0.0.7

* Separate module definitions via a require.def() function.
* Reworked module loading code based on Rawld Gill's algorithm.
* Changed i18n bundles to just list locales with true, based on a suggestion
  from Adam Peller.
* Integrating feedback from Bryan Forbes/David Mark.

#### 0.0.6

* Removed the Function specifier. That was for circular dependencies, but due to concerns about identity, decided to not support that use case. Now, a module function can return any value it wants to define itself, can be Function, Object, String, Number, Boolean, whatever. And now, for circular dependency, the circular dependency will be null. I decided not to throw in that case because I wan require to be able to load existing code that does not call back to require to define a module. To support circular dependencies, the module function can use require() to fetch that circular dependency later, outside the circular dependency loop.

#### 0.0.5

* Introduce plugin concept for require.js. i18n code moved to a plugin.

#### 0.0.4

* pause/resume for build layers

#### 0.0.3

* Module modifiers
* Better function module support
* Allow require() calls that just have a config object.

#### 0.0.2

* Allow modules to be defined with a plain object instead of a callback.
* i18n bundle support.

#### 0.0.1

* Basic module loading
* Support non-requirejs module loading, if file ends in .js
* Supports loading modules with different versions by using context names in
  top-level require() calls.
