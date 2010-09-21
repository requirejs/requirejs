/*
 * This is an example build file that demonstrates how to use the build system for
 * require.js.
 *
 * THIS BUILD FILE WILL NOT WORK. It is referencing paths that probably
 * do not exist on your machine. Just use it as a guide.
 *
 * 
 */

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
    //- "none": no minification will be done.
    optimize: "closure",

    //Allow CSS optimizations. Allowed values:
    //- "standard": @import inlining, comment removal and line returns.
    //Removing line returns may have problems in IE, depending on the type
    //of CSS.
    //- "standard.keepLines": like "standard" but keeps line returns.
    //- "none": skip CSS optimizations.
    optimizeCss: "standard.keepLines",

    //If optimizeCss is in use, a list of of files to ignore for the @import
    //inlining. The value of this option should be a comma separated list
    //of CSS file names to ignore. The file names should match whatever
    //strings are used in the @import calls.
    cssImportIgnore: null,

    //Inlines the text for any text! dependencies, to avoid the separate
    //async XMLHttpRequest calls to load those dependencies.
    inlineText: true,

    //Allow "use strict"; be included in the RequireJS files.
    //Default is false because there are not many browsers that can properly
    //process and give errors on code for ES5 strict mode,
    //and there is a lot of legacy code that will not work in strict mode.
    useStrict: false,

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
        //Remove plugin support from require. The i18n! jsonp! order! and
        //text! extensions will not work.
        requireExcludePlugin: true,
        //Remove the page loaded detection.
        requireExcludePageLoad: true
    },

    //Skip processing for pragmas.
    skipPragmas: false,

    //If execModules is true, each script is execute in
    //full to find the require calls/dependencies, but the code is executed
    //in the Rhino JavaScript environment. Set this value to true only
    //if the code follows the strict require pattern of wrapping all
    //code in a require callback. If you are using jQuery, Prototype or MooTools
    //you should not set this value to true. Default is false.
    execModules: false,

    //If skipModuleInsertion is false, then files that do not use require.def
    //to define modules will get a require.def() placeholder inserted for them.
    //Also, require.pause/resume calls will be inserted.
    //Set it to true to avoid this. This is useful if you are building code that
    //does not use require() in the built project or in the JS files, but you
    //still want to use the optimization tool from RequireJS to concatenate modules
    //together.
    skipModuleInsertion: false,

    //List the modules that will be optimized. All their immediate and deep
    //dependencies will be included in the module's file when the build is
    //done. If that module or any of its dependencies includes i18n bundles,
    //only the root bundles will be included unless the locale: section is set above.
    modules: [
        //Just specifying a module name means that module will be converted into
        //a built file that contains all of its dependencies. If that module or any
        //of its dependencies includes i18n bundles, they may not be included in the
        //built file unless the locale: section is set above.
        {
            name: "foo/bar/bop",
            
            //Should the contents of require.js be included in the optimized module.
            //Defaults to false.
            includeRequire: true,

            //For build profiles that contain more than one modules entry,
            //allow overrides for the properties that set for the whole build,
            //for example a different set of pragmas for this module.
            //The override's value is an object that can
            //contain any of the other build options in this file.
            override: {
                pragmas: {
                    requireExcludeModify: true
                }
            }
        },

        //This module entry combines all the dependencies of foo/bar/bop and foo/bar/bee
        //and any of their dependencies into one file.
        {
            name: "foo/bar/bop",
            include: ["foo/bar/bee"]
        },

        //This module entry combines all the dependencies of foo/bar/bip into one file,
        //but excludes foo/bar/bop and its dependencies from the built file. If you want
        //to exclude a module that is also another module being optimized, it is more
        //efficient if you define that module optimization entry before using it
        //in an exclude array.
        {
            name: "foo/bar/bip",
            exclude: [
                "foo/bar/bop"
            ]
        },

        //This module entry shows how to specify a specific module be excluded
        //from the built module file. excludeShallow means just exclude that
        //specific module, but if that module has nested dependencies that are
        //part of the built file, keep them in there. This is useful during
        //development when you want to have a fast bundled set of modules, but
        //just develop/debug one or two modules at a time.
        {
            name: "foo/bar/bin",
            excludeShallow: [
                "foo/bar/bot"
            ]
        }
    ]
}

