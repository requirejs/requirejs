/**
 * @license Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*
 * Use the .sh or .bat build scripts to run this script. General use:
 * executingEnv build.js directory/containing/build.js/ profile.build.js
 *
 * General use:
 *
 * Create a build.js file that has the build options you want and pass that
 * build file to this file to do the build. See example.build.js for more information.
 */

/*jslint strict: false */
/*global require: false */

require({
    baseUrl: require.s.contexts._.config.baseUrl,
    //Use a separate context than the default context so that the
    //build can use the default context.
    context: 'build'
},       ['env!env/args', 'build'],
function (args,            build) {
    //Take off the first argument since it is for
    //are a path inside requirejs for use by the bootstrap.
    var buildArgs = args.slice(1),
        rjsBuildDir = buildArgs[0].replace(/\\/g, '/');

    //The second arg is the full path for this script. The
    //directory portion is the only part needed though, so adjust it.
    rjsBuildDir = rjsBuildDir.split('/');
    rjsBuildDir.pop();
    buildArgs[0] = rjsBuildDir.length ? rjsBuildDir.join('/') : '.';

    build(buildArgs);
});
