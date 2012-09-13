
require.config({
  urlArgs: "bust=" +  (new Date()).getTime(),
  paths: {
    text: 'textplugin/text'
  },

  baseUrl: 'base/'
});

require([
  '../relative/nested/first'
], function (first) {

  doh.register(
    "relativePathPlugin",
    [
      function relativePathPlugin(t) {
        t.is('hello', first);
      }
    ]
  );

  doh.run();

});