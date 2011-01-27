This is a copy of UglifyJS from the following location around Jan 17, 2011, 9pm Pacific:
https://github.com/mishoo/UglifyJS

UglifyJS is under the BSD license, and it a third-party package.

* The contents of the package were modified to wrap the modules in a define() wrapper.
* The scripts in the original lib directory were just placed alongside index.js to allow for an easier path mapping.
* index.js was modified to use the ./ path instead of the ./lib/ path.
* In parse-js.js, in function JS_Parse_Error, the try/catch to generate a stack is disabled.

If UglifyJS is updated, be sure to run a Java-backed optimizer test to be sure
it still works in that environment. Array.prototype.reduce needed to be added
to get the existing version to work.