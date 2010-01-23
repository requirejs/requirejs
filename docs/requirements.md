# RequireJS Requirements

RequireJS is designed to meet the following requirements:

## Go with the grain of the browser

XMLHttpRequest(XHR) loaders are limited to the same domain as the page, and make debugging harder. Certain browsers allow cross-domain XHR calls and better conventions for debugging when eval is used, but support is inconsistent across browsers.

eval-based loaders should be avoided since eval is not a JavaScript best practice and it is not allowed in some environments. There is a time and place for eval, but a module loader can do better than to use it.

A server process that transforms scripts on the fly should also not be needed. Getting everyone to use the same server process or even making specs for a common format they can all emit is more overhead, more stuff to write. Front-end developers have a long established practice of being able to author plain text files and having them load in the browser without a bunch of server hardware.

Scripts loaded via script tags work everywhere and work across domains. It is a much simpler loading style that uses the natural way browsers load scripts.

## Load code before and after page load

The same system should be usable before and after page load. Delaying loading of code until a later page action is a key performance benefit.

## Scripts should be able to specify dependencies.

It is very easy for a project to beyond needing a couple of scripts. It is hard to manually track all the dependencies and the correct loading order. A script should be able to specify its immediate dependencies. The developer should not have to worry about what those dependencies need to load and work out the correct loading order.

## The loader should be able to load nested dependencies

If each module specifies its own direct dependencies, the loader should be able to work out the correct dependencies across the whole system, even nested dependencies, for dependencies of dependencies.

## Scripts can be evaluated out of order, but modules need to be evaluated according to dependencies

Using the browser-native script loading that has nested dependency resolution and works after page load means that scripts will need to be loaded at least part of the time via using appendChild for script elements.

IE and WebKit will execute scripts added via appendChild out of DOM order, they
execute them in network receive order. Even if they executed scripts in the order
they were added to the DOM, dependencies for a module are discovered after
the module script has been loaded, so scripts for the dependencies will always be added
after the script that needs them.

This leads to constructing a module format for a script, one that puts the bulk of the script in a function, with its dependencies specified outside of that function wrapper. This allows scripts to be evaluated out of order by the browser, but gives the chance to properly work out the dependencies, then call the function wrappers in the right sequence to bring the scripts into being.

## The module format should be compact

Boilerplate code is a pain. However a function wrapper is needed as part of the boilerplate. Prefer making the boilerplate as terse as possible, to allow easy hand-coding by developers. Avoid overly-explicit module formats that use a name/value pair for each property, since developer will have to code these by hand.

## Have a streamlined core loader, but allow for the future.

The core of the loader, module format support with nested dependency resolution, should be compact, but allow for plugins to expand the concept of dependencies and what it means to load them.

In Dojo, it is common to need i18n string bundles and text strings of HTML for widget constructions. Allow the loader to be able to load these things, but as plugins, so the core stays lightweight.

## Allow modules to keep a clean global namespace

As projects get bigger, it is more common to need to load two versions of a module in a page. This should be possible by allowing a module system that does not define modules in the globale namespace.

If a module wants to work with the global namespace, but that is normally easy to allow in a module spec. The harder part is constructing a format that works well to avoid the global namespace.

## Load any script

Not all scripts will be using the module format. Allow existing scripts to be loaded and treated as a dependency.

## Allow for performance upgrades

This mainly means have a build system that can combine and optimize modules. It also means the loader should allow loading a script with multiple modules defined in it, and only fetch dependencies that are not already included in that script file.

