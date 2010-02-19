/*
 * This is an example build file that demonstrates how to use the build system for
 * require.js.
 *
 * THIS BUILD FILE WILL NOT WORK. It is referencing paths that probably
 * do not exist on your machine. Just use it as a guide.
 *
 * 
 */

require(
    {
        //The top level directory that contains your app. If this option is used
        //then it assumed your scripts are in a subdirectory under this path.
        //This option is not required. If it is not specified, then baseUrl
        //below is the anchor point for finding things. If this option is specified,
        //then all the files from the app directory will be copied to the dir:
        //output area, and baseUrl will assume to be a relative path under
        //this directory.
        appDir: "some/path/",

        //By default, all modules are located relative to this path. If baseUrl
        //is not explicitly set, then all modules are loaded relative to
        //the directory that holds the build file.
        baseUrl: "./",

        //The file path for require.js. If not specified, then require.js is assumed to
        //be in the same directory as your build file. Note that a complete
        //source version of require.js should be specified, and the require/ directory
        //that holds the plugins for require.js should be a sibling to this path.
        requireUrl: "./require.js",

        //Should the contents of require.js be included in the build layer. Defaults
        //to false.
        includeRequire: false,

        //Set paths for modules. If relative paths, set relative to baseUrl above.
        paths: {
            "foo.bar": "../scripts/foo/bar",
            "baz": "../another/path/baz"
        },

        //The directory path to save the output. If not specified, then
        //the path will default to be a directory called "build" as a sibling
        //to the build file. All relative paths are relative to the build file.
        dir: "../some/path",

        //Used to inline i18n resources into the built file. If no locale
        //is specified, i18n resources will not be inlined. Only one locale
        //can be inlined for a build. Root bundles referenced by a build layer
        //will be included in a build layer regardless of locale being set.
        locale: "en-us",

        //How to optimize all the JS files in the build output directory.
        //Right now only the following values
        //are supported (default is to not do any optimization):
        //- "closure": uses Google's Closure Compiler in simple optimization
        //mode to minify the code.
        //- "closure.keepLines": Same as closure option, but keeps line returns
        //in the minified files.
        optimize: "closure",
        
        //Inlines the text for any text! dependencies, to avoid the separate
        //async XMLHttpRequest calls to load those dependencies.
        inlineText: true,

        //Specify build pragmas. If the source files contain comments like so:
        //>>excludeStart("requireExcludeModify", pragmas.requireExcludeModify);
        //>>excludeEnd("requireExcludeModify");
        //Then the comments that start with //>> are the build pragmas.
        //excludeStart/excludeEnd and includeStart/includeEnd work, and the
        //the pragmas value to the includeStart or excludeStart lines
        //is evaluated to see if the code between the Start and End pragma
        //lines should be included or excluded.
        pragmas: {
            //Indicates require will be included with jquery.
            jquery: true,
            //Remove require.modify() code
            requireExcludeModify: true,
            //Remove plugin support from require. The i18n! and
            //text! extensions will not work.
            requireExcludePlugin: true,
            //Remove the page loaded detection.
            requireExcludePageLoad: true,
            //Remove context support: means loading multiple
            //versions of a module are not supported.
            requireExcludeContext: true
        },

        //Skip processing for pragmas.
        skipPragmas: false,

        //If execModules is true, each script is execute in
        //full to find the require calls/dependencies, but the code is executed
        //in the Rhino JavaScript environment. Set this value to false
        //if the code does not follow the strict require pattern of wrapping all
        //code in a require callback. If you are using jQuery, you should set
        //this value explicitly to false.
        execModules: true,

        //For build profiles that contain more than one require() call for build
        //layers, normally the first call's require() configuration options are used
        //for subsequent layers. However, if you pass a configuration object to
        //a later require call, you can pass the config object with an override
        //property to just override some config values for just that require()
        //call's build layer, and subsequent build layers will not get those
        //overrided values. The override's value is just an object that can
        //contain any of the other build options in this file.
        override: null
/*
        TODO:
        - way to optimize CSS? default to true
        - way to ignore CSS imports?
*/
    }
);

//Just specifying a module name means that module will be converted into
//a built file that contains all of its dependencies. If that module or any
//of its dependencies includes i18n bundles, they may not be included in the
//built file unless the locale: section is set above.
require.def("foo/bar/bop");

//This invocation combines all the dependencies of foo/bar/bop and foo/bar/bee
//and any of its dependencies into one file. If that module or any
//of its dependencies includes i18n bundles, they may not be included in the
//built file unless the locale: section is set above.
require(
    "foo/bar/bop",
    ["foo/bar/bee"]
);

//This invocation combines all the dependencies of foo/bar/bip into one file,
//but excludes foo/bar/bop and its dependencies from the built file. The list
//of exclude modules can only be other build layer module names, and those
//build layer *must* be defined before the require call with the exclude option.
//TODO: not supported yet.
require(
    {
       exclude: [
        "foo/bar/bop"
       ]
    },
    "foo/bar/bip"
);
