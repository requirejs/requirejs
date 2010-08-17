# Packages

# Background

I am considering supporting CommonJS packages in RequireJS. Packages are laid out differently than what is expected now from RequireJS. It is also a concern for Dojo, since both RequireJS and Dojo use the same path resolution logic.

Packages can contain more than one module, and the way paths are resolved are different. Here is the standard layout for a CommonJS package, or what I have understood them to be so far (and note that "CommonJS packages" does not imply a hard spec, they are still experimenting, trying to find consensus via implementation):

* packageName/
    * package.json
    * lib/
    * lib/main.js
    * lib/util.js

There can be other directories inside the packageName directory, notably a tests/ directory, and perhaps a resources/ directory, for resources. In CommonJS pathing land, doing a require('packageName'), it gets mapped to path/to/packageName/lib/main.js, require('packageName/util') is mapped to path/to/packageName/lib/util.js.

Actually, the choice of main.js as the module to use for require('packageName') is configurable in package.json with the "main" property, and so is the lib directory. I think the most recent update of the package spec/proposal forces the package.json to specify at least "main" or "lib" properties to be valid. I want a reasonable default, and would assume lib/main.js if no package.json config is found, and access to the lib directory is always allowed.

For Dojo modules, this would be an improvement over what is used now, particularly for dojox: having dojox/foo.js, dojox/foo/, dojox/foo/_base.js with dojox/foo.js just requiring the _base file. Packages can be easily zipped up and distributed, and all the contents are within a folder.

The downside is the mappings are a little bit weird, and it requires more explicit config to load the package's modules in the browser. The explicit config can be minified particularly if modules follow convention of lib/main.js, but it is something to consider. The existing path mappings in Dojo and RequireJS are a bit more straightforward, but it does make it more difficult to share discrete functionality -- you cannot just zip up a directory, you need to zip up a directory and one file that is a sibling to that directory, and it gets weird to unzip many of these bundles in a common directory.

I would actually like to have one solution that has the best of both worlds, but I cannot see it yet. Feel free to suggest something. In the absense of something else, I will explore the CommonJS package loading.

I still want to support the simpler path mappings we have in Dojo/RequireJS (the default behavior), but also support the package construct. It does not makes sense to force packages to be the default path behavior, but I am open to counter-arguments. As seen below, to support nested packages with nested dependencies, an explicit package config is probably necessary anyway.

Some useful links:

* [CommonJS Packages/1.0](http://wiki.commonjs.org/wiki/Packages/1.0)
* [CommonJS Packages/1.1](http://wiki.commonjs.org/wiki/Packages/1.1)
* [CommonJS Mappings/C](http://wiki.commonjs.org/wiki/Packages/Mappings/C)

I believe Mappings will be needed to complete a generic config that does not depend on a server-based package repository. It should be possible to use a package repository but it is not adequate for all use cases. A server-based repository can be seen as just a directory that has the final mapping. However, I hope to leverage some existing repositories, like the one used by npm, to bootstrap something that can reuse existing CommonJS packages.

When the package manager for RequireJS downloads packages, it will convert the modules inside them to RequireJS syntax if they are in the traditional CommonJS module syntax.

# Guiding principles

* Package configuration should be done at development time, not at runtime. The developer will run a tool to introduce a new package dependency into a project. The tool would download the package, and set up the code's configuration to allow the browser to correctly find the package's modules.
* It should be easy to exclude downloaded packages from the source control for the project.
* There is no global or assumed packages space for the whole system, and there cannot be a path lookup sequence since this work is to support loading in the browser, which needs to be fast and avoid 404s. Only one path can be configured per package version, and the configuration will be app/package specific.
* It should be possible to configure loading a package's modules from another domain. CDN loading for example. However, the developer's package tool would contact the CDN location, parse the package.json, then set up the local webapp's configuration.
* Package config that is run in the browser needs to be reasonably small.
* While a tool can be used to automate the package config, it should be possible to manually add additional config.

Something to call out in this approach: RequireJS will not try to parse package.json files on the fly in the browser. A developer tool will do that work, and set up an optimized config block that will be injected into top-level application modules. This will avoid extraneous requests, provide more consistent load behavior, and work for server-side RequireJS-based projects.

# User experience

* Download the package manager. For illustration purposes (not the final name), call it pkg.js. Only one file is downloaded. It is a JS file that can be executed in a JS environment that works from the command line, mostly likely Node and/or Rhino. Sample commands:

* pkg.js createApp appName
    * Generates dir structure, stub an application-level package.json file.
    * puts in require.js and r.js (the RequireJS/Node adapter) too.
* pkg.js add packageName version (or an URL)
    * pkg.js adds the package dependency info to app's package.json
    * fetches the dependency and any of its dependencies.
* pkg.js create packageName : creates a new package that is subject to version control.
    * Different from createApp in that it is assumed not to have require.js included, and it will not need to update config objects in the top-level app modules.
* pkg.js update : updates the app config to be the latest based on sub packages.
* pkg.js addApp name: adds a new entry to package.json's app property, updates
  that named module to have the automated require() config injection. Used to specify
  what top-level app modules are used in the webapp. App modules are the top level
  module that is loaded by a particular web page.

I am hoping the pkg.js can be limited to just one JS file to download, but minification tools may mean downloading a couple files. But really try for just one file (for distribution -- in the package manager source it can be many files that are built into one).

# Implementation

## Creating a package-aware project

To create a web app called foo, run

    pkg.js createApp foo

A directory structure is created that looks like this:

* foo
    * index.html: main app HTML file, loads main.js via RequireJS.
    * package.json: the config file that stores the persistent info about the project.
    * lib
        * .packages: directory to house downloaded 3rd party packages
        * main.js: the app module loaded by default by index.html
        * require.js: and/or r.js for node, maybe this is an optional arg to createApp


**index.html** would look like the following:

    <!DOCTYPE html>
    <html>
    <head>
        <script data-main="main" src="lib/require.js"></script>
    </head>
    <body>
    </body>
    </html>

The **data-main** attribute on the RequireJS script tag is something new for RequireJS (not yet implemented), it will tell RequireJS what module to load for the web page. Only one module can be loaded in this way, to support a specific project layout that takes advantage of the optimization tool. The optimization tool in RequireJS can combine all of the page's modules into main.js so only one file needs to be loaded once the developer wants to deploy the code.

**main.js** would look like this by default:

    require(['require'], function (require) {

        //Use require.ready to register callbacks with the DOM is ready for access
        require.ready(function () {
            document.getElementsByTagName('body').innerHTML = '<h1>Hello World</h1>';
        });
    });

**package.json**:

    {
        "name": "foo",
        "version": "0.0.1",
        "requirejs": {
            "app" : ["main"]
        }
    }

The **requirejs** property is used to store info specific to RequireJS implementation. In this case, it has a property called "app" which is an array listing of all the top-level modules used by web pages. If the user created another page, called secondary.html and its top-level module was secondary.js, then the app array would change to **["main", "secondary"]**.

## Add package to project

To add the "bar" package, run either

    pkg.js add bar 0.4 

or
    pkg.js add bar http://some.domain.com/packages/bar/0.4.zip

In the first example, a package repository or index would be consulted to find the URL to the 0.4 bar package, and basically convert the call to something like the second one, where an URL would be used to fetch the module. The module could be in source form (like a Git repository URL) or in zip form (details still to be worked out).

bar would be downloaded to foo/.packages/bar/0.4, and the following files would be changed by pkg.js to the following:

**package.json**:

    {
        "name": "foo",
        "version": "0.0.1",
        "requirejs": {
            "app" : ["main"]
        },
        dependencies: {
            "bar", "0.4"
        },
        mappings: {
            "bar": {
                version: "0.4",
                location: "http://some.domain.com/packages/bar/0.4.zip"
            }
        }
    }

The dependencies and mappings of those dependencies is stored in the package.json file, so that the .packages directory could be missing, but it still would be able to regenerate the correct directory layout. This is important since the .packages directory would likely not be committed to source control (but everything will still work if .packages is committed to source control).

**main.js**:

    //Start automatic config, do not alter by hand
    require({
        packagePaths: {
            ".packages": ["bar/0.4"]
        }
    });
    //End automatic config

    require(['require'], function (require) {

        //Use require.ready to register callbacks with the DOM is ready for access
        require.ready(function () {
            document.getElementsByTagName('body').innerHTML = '<h1>Hello World</h1>';
        });
    });

main.js is modified to add the configuration of the packages and their paths. The config object's "packagePaths" property would be a new feature to RequireJS, it is not supported today.

While it is unfortunate to have a tool modify a source file that will contain other manually edited code by the user, the goal of avoiding extra network requests to get this configuration is more important. It also means those top level app modules could be used directly in a server side environment like Node, via the r.js RequireJS adapter (assuimg the app module was coded specifically for a Node server environment).

In the above example, it has:
    packagePaths: {
        ".packages": ["bar/0.4"]
    }

This means, "the bar package is located in the .packages basePath, and 0.4 directory under bar is the root of the package", so require("bar") would be translated to ".packages/bar/0.4/lib/main.js". Only the first part of the "bar/0.4" identifier is used as the package name, the "/0.4" part is given as additional pathing information.

An example of a more complex packagePaths configuration that loads packages "four" and "five" from a remote host on the fly, in the browser. They could be packages hosted on a CDN:

    require({
        packagePaths: {
            '.packages': ['one', 'two', {name: 'three', lib: 'scripts'}],
            'http://something.com/packages': ['four', 'five'],
            'packages': ['six', ...],
            '../': []
        }
    });

Each property of the packagePaths object is a base path to find some packages. The array values list the packages that are available under that base path. If the package has a different "lib" or "main" property, then instead of using a simple string for the package, an object is used to specify those extra properties, as shown for the "three" package above.

This sort of representation is meant to minimize the size of the configuration object that is needed in the browser. If it turns out it adds a bunch of awkward code to RequireJS, then it may become more verbose, as in:

    require({
        packages: {
            "one": ".packages",
            "two": ".packages",
            "three": {
                lib: "scripts"
            },
            "bar": {
                "location": ".packages/bar/0.4"
                //If "main" or "lib" were different they could be listed here
            },
            ...
        }
    });

If there is specific package config per package, then a "packages" property could be used. This would allow, for instance, having packagePaths that are specific to a package (assuming packagePaths works out in the implementation):

    require({
        packages: {
            "bar": {
                packagePaths: {
                    //Similar to above, but only applies to packages used by bar
                },
                //Conceptually, could allow for a "packages" property here, if
                //there were specific package properties that only applied to
                //packages loaded by the "bar" package.
            }
        }
    });

This would allow very specific configuration for each package and its sub-packages. While RequireJS does not support that model today, it could in the future. Right now RequireJS supports multiple versions of a module being loaded in a page, but it means creating top-level "contexts", and not something as granular as a per-package context. However, it may make sense to move to per-package contexts, and I can see a path to supporting it.

# Summary

Hopefully this outline gives a path to supporting packages that work with RequireJS in the browser directly, without a bunch of run-time configuration, but still allow fine-grained debugging support.

Of course, the optimization tool in RequireJS could be used to combine some of the package modules together to make it even faster in dev, and just exclude the specific modules you want to debug. However, it still may make sense to load some packages directly off a third party server, like a CDN, so this approach still allows that.

The optimization tool may need to change to allow inlining package modules, or at least making sure each module included in the optimized layer is mapped correctly to its package. However, that work will be outlined separately, and only if the above makes sense.

# Low level implementation Notes

Mostly notes for me on implementation so I do not forget:

For the data-main="main" attribute on script tags:
Means that built require.js that includes app needs to not fetch extra scripts
until after whole file is parsed? Use setTimeout? But that means behavior
is different vs. command line, but its ok, won't be that different, just order
of scripts. Hmm, could affect order! plugins, but that is just used in browser
anyway. But still confusing vs something that defines require = {} before
the script. Maybe just needs docs, and go with setTimeout if it is available.

Consider using/reusing/adapting Kris Zyp's [Nodules](http://github.com/kriszyp/nodules) as a basis for implementation for pkg.js. It is Dojo Foundation CLA-approved code.
