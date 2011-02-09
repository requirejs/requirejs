/**
 * Converts CommonJS modules to be requirejs compliant modules.
 *
 * Usage:
 * ../../../bin/x convert.js path/to/commonjs/modules output/dir
 *
 */
/*jslint strict: false */
/*global require: false */

require(['env!env/args', 'commonJs', 'env!env/print'],
function (args,           commonJs,   print) {

    var foundConvert = false,
        srcDir, outDir;

    //strip off arguments until there is no more convert.js.
    //Node and Rhino give different numbers of args.
    //Revisit this later as other code gets moved around.
    while(!foundConvert) {
        foundConvert = args.shift() === 'convert.js';
    }

    srcDir = args[0];
    outDir = args[1];

    if (!srcDir || !outDir) {
        print('Usage: convert.js path/to/commonjs/modules output/dir');
        return;
    }

    commonJs.convertDir(args[0], args[1]);
});
