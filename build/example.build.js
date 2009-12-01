/*
 * This is an example build file that demonstrates how to use the build system for
 * runjs.
 *
 * THIS BUILD FILE WILL NOT WORK. It is referencing paths that probably
 * do not exist on your machine. Just use it as a guide.
 *
 * 
 */

run(
    {
        //By default, all modules are located relative to this path. If baseUrl
        //is not explicitly set, then all modules are loaded relative to
        //the directory that holds the build file.
        //For plain file paths, ones that end in .js, then they are loaded relative
        //to where your build.js file is located.
        baseUrl: "./",

        //The file path for run.js. If not specified, then run.js is assumed to
        //be in the same directory as your build file.
        runUrl: "./run.js",

        //Should the contents of run.js be included in the build layer. Defaults
        //to false.
        includeRun: false,

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
        //can be inlined for a build.
        locale: "en-us",

        //How to optimize
        TODO
        optimize: "closure",
        
        TODO:
        - way to specify inlined HTML files?
        - way to optimize CSS? default to true
        - way to ignore CSS imports?
    }
);

//Just specifying a module name means that module will be converted into
//a built file that contains all of its dependencies. If that module or any
//of its dependencies includes i18n bundles, they may not be included in the
//built file unless the locale: section is set above.
run("foo.bar.bop");

//This invocation combines all the dependencies of foo.bar.bop and foo.bar.bee
//and any of its dependencies into one file. If that module or any
//of its dependencies includes i18n bundles, they may not be included in the
//built file unless the locale: section is set above.
run(
    "foo.bar.bop",
    ["foo.bar.bee"]
);

//This invocation combines all the dependencies of foo.bar.bip into one file,
//but excludes foo.bar.bop and its dependencies from the built file. The list
//of exclude modules can only be other build layer module names, and those
//build layer *must* be defined before the run call with the exclude option.
run(
    {
       exclude: [
        "foo.bar.bop"
       ]
    }
    "foo.bar.bip"
);
