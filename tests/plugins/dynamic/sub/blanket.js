define([ 'require', 'dynamic!../pillow.resource', 'dynamic!./blanket.resource'],
function (require,   pillowResource,                blanketResource) {
    return {
        resource: blanketResource,
        pillowResource: pillowResource
    };
});
