define(['require', 'dynamic!./pillow.resource'], function (require, resource) {
    return {
        resource: resource,
        delayed: function (cb) {
            require(['dynamic!./pillow.resource'], cb);
        }
    };
});
