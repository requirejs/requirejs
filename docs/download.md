# Download RequireJS

## Releases

### 0.9.0

* **Optimization tool refactored and improved**
    * Basic CSS optimizations are in! @import urls are inlined (with url() paths properly adjusted), and comments are removed.
    * Robust nested dependency tracing by use of an AST. As a result, the build option execModules is false by default now. This is what most people need, so it is no long necessary to include execModules: false in your build profile.
    * Now possible to build just one JS file or one CSS file at a time, no need for a build profile! See the [Optimization docs](optimization.md) for full details.
    * **Backwards incompatible change**: the format of build profiles has changed. It no longer uses require() calls but it is a completely declarative format. This should be more robust for the future, and it allowed for a cleaner refactoring of the optimization tool.
* **Support for relative module names in require.def dependencies**
    * require.def("my/project/module", ["./dependency1"]); will now load my/project/dependency1.js. This should help cut down the amount of typing for larger projects.
    * The first argument to require.def, which gives the name of the module being defined, still needs to be a full name. It cannot be a relative name (cannot start with a . or ..).
    * require.nameToUrl() does not accept relative names.
* **Backwards incompatible change**: text! plugin URLs now use . instead of ! for the file extension. So, instead of "text!some/module/sample!html" it is now "text!some/module/sample.html". Please update your code, the old !html will no longer work.
* Bug fixes

This release has a couple backwards incompatible changes. These kinds of changes will be generally avoided, and more notice via the RequireJS mailing list will be given if it needs to happen again. RequireJS has not reached 1.0, so these kinds of changes may still happen. However, there should be less of a need for a backwards incompatiable change now, and as of today, none are forecasted.

#### <a name="requirejs">require.js</a> [Minified](http://requirejs.org/docs/release/0.9.0/minified/require.js) | [With Comments](http://requirejs.org/docs/release/0.9.0/comments/require.js)

All you need to start using require.js. Does not include i18n, text plugins or rhino support. 

#### <a name="requirejsplugins">require.js with plugins</a> [Minified](http://requirejs.org/docs/release/0.9.0/minified/allplugins-require.js) | [With Comments](http://requirejs.org/docs/release/0.9.0/comments/allplugins-require.js)

require.js with the i18n and text plugins included. 

#### <a name="jqueryrequirejs">jQuery 1.4.2 with require()</a> [Minified](http://requirejs.org/docs/release/0.9.0/minified/require-jquery-1.4.2.js) | [With Comments](http://requirejs.org/docs/release/0.9.0/comments/require-jquery-1.4.2.js)

A build of jQuery with integrated require() support. Just includes the basic RequireJS, does not have the following features:

* i18n, text plugins
* multiversion support
* page load support (it is assumed you will use jQuery's methods)
* require.modify() support

#### <a name="jqueryrequirejsplugins">jQuery 1.4.2 with require() and plugins</a> [Minified](http://requirejs.org/docs/release/0.9.0/minified/requireplugins-jquery-1.4.2.js) | [With Comments](http://requirejs.org/docs/release/0.9.0/comments/requireplugins-jquery-1.4.2.js)

A build of jQuery with integrated require() support and the i18n and text plugins. Does not include these other RequireJS features:

* multiversion support
* page load support (it is assumed you will use jQuery's methods)
* require.modify() support

The integrated builds with jQuery contain the changes in [this jQuery fork](http://github.com/jrburke/jquery).

<hr>

#### <a name="samplejquery">Sample jQuery 1.4.2 project with require()</a> [Download](http://requirejs.org/docs/release/0.9.0/jquery-require-sample.zip)

A zip file containing a build of jQuery with integrated require() support, with an sample project included to show how it can be used when using jQuery. Does not include these features in RequireJS:

* i18n, text plugins
* multiversion support
* page load support (it is assumed you will use jQuery's methods)
* require.modify() support

<hr>

#### <a name="optimizationtool">Optimization Tool / Full Source</a> [Download](http://requirejs.org/docs/release/0.9.0/requirejs-0.9.0.zip)

A zip file that is the optimization tool for RequireJS. It also includes the full source for require.js and its plugins.

If you want to use RequireJS in Rhino, you should use this download.

<hr>
<hr>
<hr>

### Previous releases


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
