/*
 * This is an example file that demonstrates how to use the build system for
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
        //the parent of the directory that contains the runbuild.js and run.js files from runjs.
        //For plain files, ones that end in .js, then they are loaded relative
        //to where your build.js file is located.
        baseUrl: "./",
        
        //Set paths for modules. If relative paths, set relative to baseUrl above.
        paths: {
            "foo.bar": "../scripts/foo/bar",
            "baz": "../another/path/baz"
        },
  
        //Copy all the files in the paths directory to the output folder.
        //Be default, the value is true.
        copyPaths: false,
  
        //The directory path to save the output. If not specified, then
        //a
        TODO
        dir: "../some/path",
  
        //Used to inline i18n resources into the built file. If no locale
        //is specified, i18n resources will not be inlined. Note that the value
        //should be an array.
        locale: ["en-us"],
        
        //How to optimize
        TODO
        optimize: "closure",
        
        TODO:
        - way to specify inlined HTML files?
        - way to optimize CSS? default to true
        - way to ignore CSS imports?
        - way to include run.js in a build layer?
    }
);

//Just specifying a module name means that module will be converted into
//a built file that contains all of its dependencies. If that module or any
//of its dependencies includes i18n bundles, they may not be included in the
//built file unless the locale: section is set above.
run("foo.bar.bop");

//This invocation combines all the dependencies of foo.bar.bop into one file
//but excludes foo.bar.bee and any of its dependencies from the file.
run(
    "foo.bar.bop",
    ["foo.bar.bee"]
);


