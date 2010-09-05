doh.registerUrl("simple", "../simple.html");
doh.registerUrl("config", "../config.html");
doh.registerUrl("dataMain", "../dataMain.html");
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
doh.registerUrl("i18nlocaleunknown", "../i18n/i18n.html?bundle=i18n!nls/fr-fr/colors");
doh.registerUrl("i18n", "../i18n/i18n.html");
doh.registerUrl("i18nlocale", "../i18n/i18n.html?locale=en-us-surfer");
doh.registerUrl("i18nbundle", "../i18n/i18n.html?bundle=i18n!nls/en-us-surfer/colors");
doh.registerUrl("modifiers", "../modifier/modifier.html", 10000);
doh.registerUrl("pause/resume", "../pauseresume/pauseresume.html", 10000);
doh.registerUrl("afterload", "../afterload.html", 10000);
doh.registerUrl("text", "../text/text.html");
doh.registerUrl("jsonp", "../jsonp/jsonp.html");
doh.registerUrl("order", "../order/order.html");
doh.registerUrl("relative", "../relative/relative.html");
doh.registerUrl("exports", "../exports/exports.html");
doh.registerUrl("transportD", "../transportD/transportD.html");
doh.registerUrl("priority", "../priority/priority.html");
doh.registerUrl("prioritySingleCall", "../priority/prioritySingleCall.html");
if (typeof Worker !== "undefined") {
    doh.registerUrl("workers", "../workers.html");
}