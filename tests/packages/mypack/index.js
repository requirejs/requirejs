/**
 * @package
 */

define(function(require, exports, module) {
    return Object.assign(exports, {
        "Person": require("./Person"),
        "Student": require("./Student"),
        "Teacher": require("./Teacher")
    });
});
