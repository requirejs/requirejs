/**
 * 
 */

define(function(require, exports, module) {
    class Person {
        constructor() {
            this.name = "[unknown]";
            this.age = 0;
        }

        saySomething(msg) {
            console.log(`${this.name}, age ${this.age}, says "${msg}"`);
        }
    }

    return Object.assign(Person, {
        "__semver__": "0.0.1",
        "__author__": "code@tythos.net",
        "__license__": "MIT"
    });
});
