require({
    "baseUrl": "./scripts/",
    "paths": {
        "jquery": "jquery-1.4.3"
    }
});

require(["jquery.gamma", "jquery.epsilon"], function() {

    $(function () {
        doh.is('epsilon', $('body').epsilon());
        doh.is('epsilon', $('body').epsilon());
        readyFired();
    });

});
