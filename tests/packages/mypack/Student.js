/**
 * 
 */

define(function(require, exports, module) {
    let Person = require("./Person");

    class Student extends Person {
        constructor() {
            super();
            this.grade = "F";
        }
    }

    return Object.assign(Student, {
        "__semver__": "0.0.1"
    });
});
