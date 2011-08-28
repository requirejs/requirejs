define([ 'require', 'volatile!../pillow.resource', 'volatile!./blanket.resource'],
function (require,   pillowResource,                blanketResource) {
    return {
        resource: blanketResource,
        pillowResource: pillowResource
    };
});
