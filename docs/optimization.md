# RequireJS Optimization Tool

RequireJS comes with an optimization tool that does the following:

* Combines related scripts together into build layers and minifies them via Google Closure.
* Optimizes CSS by inlining CSS files referenced by @import and removing comments.
* Can add require.js and any of its plugins to any optimized build layer.

The optimization tool is in the requirejs/build directory, and it is designed to be run as part of a build or packaging step after you are done with development and are ready to deploy the code for your users.

The build tool works by defining a build profile, normally in a file with a suffix of ***build.js*** and then passing that build profile to the optimization tool.

## Requirements

The optimization tool uses [Google Closure Compiler](http://code.google.com/closure/compiler/) to do the code minification, and therefore requires [Java 6](http://java.com/) to run.

## Download

You can download the tool on [the download page](download.md#optimizationtool).

## How to structure your project

Please see [the jQuery example page](jquery.md) for a description on how to best lay out your project, and where to place the optimization tool relative to your code. The ***app.build.js*** file in that example is the build profile.

## Build profiles

Build profiles are files that declare build preferences via a JavaScript object. They can be written in strict JSON syntax too. In the build preferences, you define a ***modules*** array that specifies the ***build layers***. You can define multiple build layers in a build profile. You can see examples in [the build profile that builds require.js](http://github.com/jrburke/requirejs/blob/master/build/require/require.build.js) with different options and in the [jquery build profile](http://github.com/jrburke/requirejs/blob/master/build/jquery/jquery.build.js)

## Build layers

Each entry in the ***modules*** array defines a build layer. Only modules that map to a module file on disk will work. Each entry in the modules array can have the following properties:

* 
* name: The name of the layer. This ***must*** map to an existing file in your project.
* include: an array of other modules to include, besides the ones that are included by default as part of any require() or require.def() calls in the module. All nested dependencies will be included in the build layer.
* includeRequire: a boolean indicating if the contents of require.js should be included in the build layer.
* override: an object specifying overrides specific to the build layer that take precedence over the top-level build options set in the build profile.

## Build layer configuration options

There is an [example.build.js](http://github.com/jrburke/requirejs/blob/master/build/example.build.js) file in the requirejs/build directory that details all of the allowed configuration options.

## More Questions?

See the [Optimization FAQ](faq-optimization.md) for a discussion of different optimization approaches.
