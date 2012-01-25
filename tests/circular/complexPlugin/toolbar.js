define(function(require) {
    var $ = require('jquery'),
        _ = require('use!underscore'),
        Backbone = require('use!backbone');

    return new (Backbone.View.extend({
        className: 'toolbar',
        template: require('text!template.html'),

        initialize: function() {
            this._crumbs = [];
            this._actions = [];
        },
        setCrumbs: function(crumbs) {
            this._crumbs = crumbs;
            this.render();
        },
        setActions: function(actions) {
            this._actions = actions;
            this.render();
        },
        render: function() {
            $(this.el).empty().append(this.template({
                crumbs: _(this._crumbs),
                actions: _(this._actions),
            }));

            return this.el;
        }
    }));
});