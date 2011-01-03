//PS3 does not have a usable Function.prototype.toString,
//so avoid those tests.
var hasToString = (function () {
    var test = 'hello world';
}).toString().indexOf('hello world') !== -1;

doh.registerUrl("simple", "../simple.html");

//PS3 does not like this test
doh.registerUrl("baseUrl", "../baseUrl.html");

doh.registerUrl("config", "../config.html");
doh.registerUrl("dataMain", "../dataMain.html");

if (hasToString) {
    doh.registerUrl("anonSimple", "../anon/anonSimple.html");
    doh.registerUrl("packages", "../packages/packages.html");
}

doh.registerUrl("simple-nohead", "../simple-nohead.html");

//Only do the base test if the urls work out.
if (location.href.indexOf('http://127.0.0.1/requirejs/') === 0) {
    doh.registerUrl("simple-badbase", "../simple-badbase.html");
}


doh.registerUrl("circular", "../circular.html");
doh.registerUrl("depoverlap", "../depoverlap.html");
doh.registerUrl("urlfetch", "../urlfetch/urlfetch.html");
doh.registerUrl("multiversion", "../multiversion.html", 10000);
doh.registerUrl("jquery", "../jquery/jquery.html");

//Next three tests fail in PS3
doh.registerUrl("jqueryDynamic", "../jquery/jqueryDynamic.html");
doh.registerUrl("jqueryDynamic2", "../jquery/jqueryDynamic2.html");
doh.registerUrl("i18nlocaleunknown", "../i18n/i18n.html?bundle=i18n!nls/fr-fr/colors");

doh.registerUrl("i18n", "../i18n/i18n.html");
//Fail in PS3
doh.registerUrl("i18nlocale", "../i18n/i18n.html?locale=en-us-surfer");
//Fail in PS3
doh.registerUrl("i18nbundle", "../i18n/i18n.html?bundle=i18n!nls/en-us-surfer/colors");

doh.registerUrl("paths", "../paths/paths.html");

doh.registerUrl("layers", "../layers/layers.html", 10000);
doh.registerUrl("allplugins-text", "../layers/allplugins-text.html");

doh.registerUrl("afterload", "../afterload.html", 10000);

doh.registerUrl("pluginsSync", "../plugins/sync.html");
doh.registerUrl("text", "../text/text.html");
doh.registerUrl("textOnly", "../text/textOnly.html");
doh.registerUrl("jsonp", "../jsonp/jsonp.html");
doh.registerUrl("order", "../order/order.html");

doh.registerUrl("relative", "../relative/relative.html");

//Hmm, PS3 does not like exports test? assign2 is undefined?
doh.registerUrl("exports", "../exports/exports.html");


doh.registerUrl("priority", "../priority/priority.html");
doh.registerUrl("priorityWithDeps", "../priority/priorityWithDeps/priorityWithDeps.html");
doh.registerUrl("prioritySingleCall", "../priority/prioritySingleCall.html");

if (typeof Worker !== "undefined") {
    doh.registerUrl("workers", "../workers.html");
}