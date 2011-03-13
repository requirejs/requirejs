//Configure RequireJS
require({
    //Load jQuery before any other scripts, since jQuery plugins normally
    //assume jQuery is already loaded in the page.
    priority: ['jquery']
});

//Load scripts.
require(['jquery', 'jquery.alpha', 'jquery.beta'], function($) {
    //The jquery.alpha.js and jquery.beta.js plugins have been loaded.
    $(function() {
        $('body').alpha().beta();
    });
});
