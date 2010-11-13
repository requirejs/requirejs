require({
    "baseUrl": "./scripts/",
    "paths": {
        "jquery": "http://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min"
    }
});

require(["jquery.gamma", "jquery.epsilon"], function() {

    $(function () {
        doh.is('epsilon', $('body').epsilon());
        doh.is('epsilon', $('body').epsilon());
        readyFired();
    });

});
