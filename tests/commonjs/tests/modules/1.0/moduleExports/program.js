define(["module", "exports", "test"], function(module, exports, test) {
test.assert(module.exports === exports, 'exports equals module.exports');
test.print('DONE', 'info');

});
