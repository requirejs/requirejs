require({
        baseUrl: require.isBrowser ? './' : './circular/complexPlugin',
        paths: {
            order: '../../../order',
            text: '../../../text'
        },
        use: {
            "underscore": {
              attach: "_"
            },

            "backbone": {
              deps: ["use!underscore", "jquery"],
              attach: function(_, $) {
                return this.Backbone.noConflict();
              }
            }
        }
    },
    ["require", "main"],
    function(require, main) {
        doh.register(
            "circularComplexPlugin",
            [
                function circularComplexPlugin(t) {
                    t.is("main", main.name);
                    t.is('toolbar', main.toolbar.className);
                }
            ]
        );
        doh.run();
    }
);
