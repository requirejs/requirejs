/**
 * @license RequireJS text Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint regexp: false, nomen: false, plusplus: false */
/*global require: false, XMLHttpRequest: false, ActiveXObject: false,
  define: false */
"use strict";

(function () {
    var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        buildMap = [];

    if (!require.textStrip) {
        require.textStrip = function (text) {
            //Strips <?xml ...?> declarations so that external SVG and XML
            //documents can be added to a document without worry. Also, if the string
            //is an HTML document, only the part inside the body tag is returned.
            if (text) {
                text = text.replace(xmlRegExp, "");
                var matches = text.match(bodyRegExp);
                if (matches) {
                    text = matches[1];
                }
            } else {
                text = "";
            }
            return text;
        };
    }

    if (!require.jsEscape) {
        require.jsEscape = function (text) {
            return text.replace(/(['\\])/g, '\\$1')
                .replace(/[\f]/g, "\\f")
                .replace(/[\b]/g, "\\b")
                .replace(/[\n]/g, "\\n")
                .replace(/[\t]/g, "\\t")
                .replace(/[\r]/g, "\\r");
        };
    }

    //Upgrade require to add some methods for XHR handling. But it could be that
    //this require is used in a non-browser env, so detect for existing method
    //before attaching one.
    if (!require.getXhr) {
        require.getXhr = function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else {
                for (i = 0; i < 3; i++) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) {}

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            if (!xhr) {
                throw new Error("require.getXhr(): XMLHttpRequest not available");
            }

            return xhr;
        };
    }

    if (!require.fetchText) {
        require.fetchText = function (url, callback) {
            var xhr = require.getXhr();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function (evt) {
                //Do not explicitly handle errors, those should be
                //visible via console output in the browser.
                if (xhr.readyState === 4) {
                    callback(xhr.responseText);
                }
            };
            xhr.send(null);
        };
    }

    define({
        load: function (name, req, onLoad, config) {
            //Name has format: some.module.filext!strip
            //The strip part is optional.
            //if strip is present, then that means only get the string contents
            //inside a body tag in an HTML string. For XML/SVG content it means
            //removing the <?xml ...?> declarations so the content can be inserted
            //into the current doc without problems.

            var strip = false, url, index = name.indexOf("."),
                modName = name.substring(0, index),
                ext = name.substring(index + 1, name.length);

            index = ext.indexOf("!");
            if (index !== -1) {
                //Pull off the strip arg.
                strip = ext.substring(index + 1, ext.length);
                strip = strip === "strip";
                ext = ext.substring(0, index);
            }

            //Load the text.
            url = req.nameToUrl(modName, "." + ext);
            require.fetchText(url, function (text) {
                text = strip ? require.textStrip(text) : text;
                if (config.isBuild && config.inlineText) {
                    buildMap[name] = text;
                }
                onLoad(text);
            });
        },

        write: function (pluginName, moduleName, write) {
            if (moduleName in buildMap) {
                var text = require.jsEscape(buildMap[moduleName]);
                write("define('" + pluginName + "!" + moduleName  +
                      "', function () { return '" + text + "';});\n");
            }
        }
    });
}());
