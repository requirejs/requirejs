define(['require', 'volatile!./pillow.resource'], function (require, resource) {
    return {
        resource: resource,
        delayed: function (cb) {
            require(['volatile!./pillow.resource'], cb);
        }
    };
});
