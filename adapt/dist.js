/**
 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
 * This script will create the final r.js file used in node projects to use
 * RequireJS.
 *
 * This file uses Node to run:
 * node dist.js
 */

/*jslint strict: false */
/*global require: false, process: false, console: false */

/**
 * Escapes a string so it is safe as a JS string
 * Taken from Dojo's buildUtil.jsEscape
 * @param {String} str
 * @returns {String}
 */
function jsEscape(str) {
    return ('"' + str.replace(/(["\\])/g, '\\$1') + '"'
        ).replace(/[\f]/g, '\\f'
        ).replace(/[\b]/g, '\\b'
        ).replace(/[\n]/g, '\\n'
        ).replace(/[\t]/g, '\\t'
        ).replace(/[\r]/g, '\\r'); // string
}

var fs = require('fs'),
    child_process = require('child_process'),
    contents = fs.readFileSync('../bin/x.js', 'utf8'),
    loadRegExp = /readFile\(requireBuildPath \+ '([\w\/\.]+)'\)/g;

//Inline file contents
contents = contents.replace(loadRegExp, function (match, fileName) {
    return jsEscape(fs.readFileSync('../' + fileName, 'utf8'));
});

//Switch the behavior to "inlined mode"
contents = contents.replace(/useRequireBuildPath \= true/, 'useRequireBuildPath = false');

if (process.argv[2] === 'opto') {
    //Build the optimizer into one file, opto.js
    //Run the opto.build.js and insert the result into the built file.
    child_process.exec('cd ../build/jslib && ../build.sh opto.build.js && cd ../../adapt',
        function (error, stdout, stderr) {
            if (error) {
                console.log('Could not build opto: ' + error);
                return;
            }

            var optoBuildFileName = '../build/jslib/optotext.js',
                optoText = fs.readFileSync(optoBuildFileName, 'utf8');

            //Inject the content into the final output.
            contents = contents.replace('exec(readFile(fileName), fileName);', optoText);

            //Set the isOpto flag to true
            contents = contents.replace('isOpto = false', 'isOpto = true');
            fs.writeFileSync('opto.js', contents, 'utf8');

            //Remove build output since no longer needed.
            fs.unlinkSync(optoBuildFileName);

        }
    );
} else {
    fs.writeFileSync('r.js', contents, 'utf8');
}
