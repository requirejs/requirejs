(function () {
    //Define the plugin.
    function plugin($) {
        $.fn.gamma = function() {
            return 'gamma';
        };

        $(function () {
            doh.is('gamma', $('body').gamma());
            readyFired();
        });
    }

    //Register the plugin.
    if (typeof define !== 'undefined') {
        define(['jquery'], plugin);
    } else if (typeof jQuery !== 'undefined') {
        plugin(jQuery);
    }
}());
