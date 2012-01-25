define(function(require) {
    var $ = require('jquery'),
        Backbone = require('use!backbone');

    return new (Backbone.View.extend({
        className: 'content',

        initialize: function() {
            this.toolbar = require('./toolbar');
        },
        render: function() {
            $(this.el).append(
                this.toolbar.render()
            );

            return this.el;
        }
    }));
});