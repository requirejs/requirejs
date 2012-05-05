//PS3 does not have a usable Function.prototype.toString,
//so avoid those tests.
var hasToString = (function () {
    var test = 'hello world';
}).toString().indexOf('hello world') !== -1;

doh.registerUrl("simple", "../simple.html");

//PS3 does not like this test
doh.registerUrl("baseUrl", "../baseUrl.html");

doh.registerUrl("config", "../config.html");
doh.registerUrl("configRequirejs", "../configRequirejs.html");
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
doh.registerUrl("circularPlugin", "../circular/circularPlugin.html");
doh.registerUrl("circularComplexPlugin", "../circular/complexPlugin/complexPlugin.html");
doh.registerUrl("depoverlap", "../depoverlap.html");
doh.registerUrl("urlfetch", "../urlfetch/urlfetch.html");
doh.registerUrl("uniques", "../uniques/uniques.html");
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

//Probably fail in PS3
doh.registerUrl("i18ncommon", "../i18n/common.html");
doh.registerUrl("i18ncommonlocale", "../i18n/common.html?locale=en-us-surfer");


doh.registerUrl("shimBasic", "../shim/basic.html");
doh.registerUrl("shimBasicBuilt", "../shim/built/basic-built.html");

doh.registerUrl("paths", "../paths/paths.html");
doh.registerUrl("moduleConfig", "../moduleConfig/moduleConfig.html");

doh.registerUrl("mapConfig", "../mapConfig/mapConfig.html");
doh.registerUrl("mapConfigBuilt", "../mapConfig/built/mapConfigBuilt.html");
doh.registerUrl("mapConfigStar", "../mapConfig/mapConfigStar.html");
doh.registerUrl("mapConfigStarBuilt", "../mapConfig/built/mapConfigStarBuilt.html");

doh.registerUrl("layers", "../layers/layers.html", 10000);

doh.registerUrl("afterload", "../afterload.html", 10000);

doh.registerUrl("universal", "../universal/universal.html");
doh.registerUrl("universalBuilt", "../universal/universal-built.html");


doh.registerUrl("nestedDefine", "../nestedDefine/nestedDefine.html");
doh.registerUrl("nestedDefine2", "../nestedDefine/nestedDefine2.html");

doh.registerUrl("pluginsSync", "../plugins/sync.html");
doh.registerUrl("doublePluginCall", "../plugins/double.html");
doh.registerUrl("pluginsNameOnly", "../plugins/nameOnly.html");
doh.registerUrl("pluginsFromText", "../plugins/fromText/fromText.html");
doh.registerUrl("pluginsTextDepend", "../plugins/textDepend/textDepend.html");

doh.registerUrl("text", "../text/text.html");
doh.registerUrl("textOnly", "../text/textOnly.html");
doh.registerUrl("textBuilt", "../text/textBuilt.html");
doh.registerUrl("jsonp", "../jsonp/jsonp.html");
doh.registerUrl("domReady", "../domReady/domReady.html");

doh.registerUrl("relative", "../relative/relative.html");
doh.registerUrl("relativeBaseUrl", "../relative/relativeBaseUrl.html");
doh.registerUrl("relativeOutsideBaseUrl", "../relative/outsideBaseUrl/a/outsideBaseUrl.html");

doh.registerUrl("remoteUrls", "../remoteUrls/remoteUrls.html");

//Hmm, PS3 does not like exports test? assign2 is undefined?
doh.registerUrl("exports", "../exports/exports.html");

doh.registerUrl("moduleAndExports", "../exports/moduleAndExports.html");

if (typeof Worker !== "undefined") {
    doh.registerUrl("workers", "../workers.html");
}

doh.registerUrl("undef", "../undef/undef.html", 8000);
doh.registerUrl("undefLocal", "../undef/undefLocal.html", 8000);
doh.registerUrl("errorContinue", "../error/errorContinue.html", 8000);
doh.registerUrl("errorContinueLocal", "../error/errorContinueLocal.html", 8000);
doh.registerUrl("pluginErrorContinue", "../error/pluginErrorContinue.html", 8000);
doh.registerUrl("pluginErrorContinueLocal", "../error/pluginErrorContinueLocal.html", 8000);
doh.registerUrl("defineErrorLocal", "../error/defineErrorLocal.html");
