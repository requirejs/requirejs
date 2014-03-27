/*jslint browser: true, sloppy: true, unparam: true*/
/*global opera*/
var opera, mapsAPI;

(function () {
    var node, onLocaleLoad, localeId, callback;

    // Get locale id by browser information (here simulate 'en_US')
    localeId = 'en_US';

    // Get callback by url GET argument (here simulate 'cbMapsAPI')
    callback = 'cbMapsAPI';

    // Define an on load locale handler
    onLocaleLoad = function () {
        // Run callback on load of locale
        if (typeof window[callback] === 'function') {
            window[callback]();
        }
    };

    // Provide maps API object
    mapsAPI = {
        name: 'externalMapsAPI',
        localeId: localeId
    };

    // Load locale
    node = document.createElement('script');
    node.type = 'text/javascript';
    node.charset = 'utf-8';
    node.async = true;
    if (node.attachEvent && !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) && !(opera !== undefined && opera.toString() === '[object Opera]')) {
        node.attachEvent('onreadystatechange', onLocaleLoad);
    } else {
        node.addEventListener('load', onLocaleLoad, false);
    }
    node.src = './externalMapsAPI-locale-' + localeId + '.js';
    document.getElementsByTagName('head')[0].appendChild(node);

}());