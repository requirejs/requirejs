/*
 * This file will optimize files that can be loaded via run.js into one file.
 * This file needs Rhino to run:
 *
 * Call this file like so:
 * java -jar path/to/js.jar runbuild.js [arguments]
 *
 * Call the above command without arguments to get a list of supported arguments.
 *
 * General use:
 *
 * Create a build.js file that has run() calls to the build layer/bundle that you
 * want to create. Use the config option on runjs to specify paths on where
 * to find things. See example.build.js for more information.
 */


load("jslib/logger.js");
load("jslib/fileUtil.js");

logger.trace("hello");