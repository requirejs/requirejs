/**
 * @license Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint  */
/*global print: false, load: false, fileUtil: false */

"use strict";

var pkg;
(function () {

    function printError(action, err) {
        print(action + ': ' + err);
    }

    function usage() {
        var actions = pkg.actions, prop;

        print('\npkg.js, a package tool for RequireJS. Allowed commands:\n');

        for (prop in actions) {
            if (actions.hasOwnProperty(prop)) {
                print(prop + ': ' + actions[prop].doc + '\n');
            }
        }
        return new Error('Unsupported command.');
    }

    /**
     * Runs the package tool.
     * @param {Array} args the array of command line arguments.
     */
    pkg = function (args) {
        var request = {
                pkgHome: args[0],
                action: args[1],
                target: args[2],
                option: args[3]
            },
            pkgHome = request.pkgHome,
            actionObj = pkg.actions[request.action],
            error;

        //Load helper libs
        if (pkgHome.charAt(pkgHome.length - 1) !== "/") {
            pkgHome += "/";
            request.pkgHome = pkgHome;
        }   
        ["../../build/jslib/logger", "../../build/jslib/fileUtil"].forEach(function (path) {
            load(pkgHome + "jslib/" + path + ".js");
        });

        if (!actionObj) {
            error = usage();
        } else {
            error = actionObj.validate(request);
        }

        if (!error) {
            error = actionObj.run(request);
        }

        if (error) {
            printError(request.action, error);
        }

        return error;
    };

    pkg.actions = {
        'createApp': {
            doc: 'Creates a new application. Pass it the name of the application to create.',
            validate: function (request) {
                if (!request.target || !(/^[A-Za-z\d\-]+$/.test(request.target))) {
                    return new Error('Application name can only contain alphanumeric and dash characters.');
                }
                return undefined;
            },
            run: function (request) {
                var contents,
                    packageFile = request.target + '/package.json';

                //Copy over the template of files.
                fileUtil.copyDir(request.pkgHome + 'templates/createApp', request.target);
                
                //Update the name of the app in package.json
                contents = fileUtil.readFile(packageFile);
                contents = contents.replace(/\%APPNAME\%/g, request.target);
                fileUtil.saveFile(packageFile, contents);
            
                //Copy RequireJS to the lib directory
                fileUtil.copyFile(request.pkgHome + '../require.js', request.target + '/lib/require.js');
                fileUtil.copyDir(request.pkgHome + '../require', request.target + '/lib/require');
            }
        }
    };

}());