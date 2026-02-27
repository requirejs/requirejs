define(function() {
    return {
        load: function(name, parentRequire, onload, config) {
            onload(name);
        },
        normalize: function(name, normalize) {
            return name + '.xyz';
        }
    }
});
