/**
 * @license RequireJS text 0.24.0 Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint regexp: false, nomen: false, plusplus: false, strict: false */
/*global require: false, XMLHttpRequest: false, ActiveXObject: false,
  define: false, window: false, process: false, Packages: false,
  java: false */

(function () {
    var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        buildMap = [];






    define(function () {
        var text, get, fs, parseJSON = null, checkJSON = null;


        if (JSON != null) {
            parseJSON = JSON.parse;
            checkJSON = function(data) {
                return JSON.stringify(JSON.parse(data));
            }
        } else {
            (function() {
                // Based on jQuery.parseJSON
                // JSON RegExp
                var rvalidchars  = /^[\],:{}\s]*$/,
                    rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
                    rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
                    rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
                trim         = String.prototype.trim ?
                    function(text) {
                        return text == null ? '' : text.toString().trim();
                    } :
                    function(text) {
                        return text == null ? '' : text.toString().replace(/^\s+|\s+$/gmi, '');
                    };


                checkJSON = function(data) {
                    // Make sure the incoming data is actual JSON
                    // Logic borrowed from http://json.org/json2.js
                    return ( rvalidchars.test(data.replace(rvalidescape, "@")
                           .replace(rvalidtokens, "]")
                           .replace(rvalidbraces, "")));
                };

                parseJSON = function( data ) {
                    if ( typeof data !== "string" || !data ) {
                        return null;
                    }

                    // Make sure leading/trailing whitespace is removed (IE can't handle it)
                    data = trim( data );


                    if ( checkJSON(data) ) {
                        return (new Function("return " + data))();
                    } else {
                        throw new Error( "Invalid JSON: " + data );
                    }
                }
            })();
        }





        if (typeof window !== "undefined" && window.navigator && window.document) {
            get = function (url, callback) {
                var xhr = text.createXhr();
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
        } else if (typeof process !== "undefined" &&
                 process.versions &&
                 !!process.versions.node) {
            //Using special require.nodeRequire, something added by r.js.
            fs = require.nodeRequire('fs');

            get = function (url, callback) {
                callback(fs.readFileSync(url, 'utf8'));
            };
        } else if (typeof Packages !== 'undefined') {
            //Why Java, why is this so awkward?
            get = function (url, callback) {
                var encoding = "utf-8",
                    file = new java.io.File(url),
                    lineSeparator = java.lang.System.getProperty("line.separator"),
                    input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
                    stringBuffer, line,
                    content = '';
                try {
                    stringBuffer = new java.lang.StringBuffer();
                    line = input.readLine();

                    // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
                    // http://www.unicode.org/faq/utf_bom.html

                    // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
                    // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
                    if (line && line.length() && line.charAt(0) === 0xfeff) {
                        // Eat the BOM, since we've already found the encoding on this file,
                        // and we plan to concatenating this buffer with others; the BOM should
                        // only appear at the top of a file.
                        line = line.substring(1);
                    }

                    stringBuffer.append(line);

                    while ((line = input.readLine()) !== null) {
                        stringBuffer.append(lineSeparator);
                        stringBuffer.append(line);
                    }
                    //Make sure we return a JavaScript string and not a Java string.
                    content = String(stringBuffer.toString()); //String
                } finally {
                    input.close();
                }
                callback(content);
            };
        }

        text = {
            version: '0.24.0',

            strip: function (content) {
                //Strips <?xml ...?> declarations so that external SVG and XML
                //documents can be added to a document without worry. Also, if the string
                //is an HTML document, only the part inside the body tag is returned.
                if (content) {
                    content = content.replace(xmlRegExp, "");
                    var matches = content.match(bodyRegExp);
                    if (matches) {
                        content = matches[1];
                    }
                } else {
                    content = "";
                }
                return content;
            },

            jsEscape: function (content) {
                return content.replace(/(['\\])/g, '\\$1')
                    .replace(/[\f]/g, "\\f")
                    .replace(/[\b]/g, "\\b")
                    .replace(/[\n]/g, "\\n")
                    .replace(/[\t]/g, "\\t")
                    .replace(/[\r]/g, "\\r");
            },

            createXhr: function () {
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
            },

            get: get,

            load: function (name, req, onLoad, config) {
                //Name has format: some.module.filext!strip
                //The strip part is optional.
                //if strip is present, then that means only get the string contents
                //inside a body tag in an HTML string. For XML/SVG content it means
                //removing the <?xml ...?> declarations so the content can be inserted
                //into the current doc without problems.

                var strip = false, json = false, option = null, url, index = name.indexOf("."),
                    contentType = 'text',
                    modName = name.substring(0, index),
                    ext = name.substring(index + 1, name.length);

                index = ext.indexOf("!");
                if (index !== -1) {
                    //Pull off the strip arg.
                    option = ext.substring(index + 1, ext.length);
                    strip = option === "strip";
                    json = option === "json";
                    ext = ext.substring(0, index);
                }
                
                if (json) {
                    contentType = 'json';
                }
                
                

                //Load the text.
                url = req.nameToUrl(modName, "." + ext);
                text.get(url, function (content) {
                    content = strip ? text.strip(content) : content;
                    if (config.isBuild && config.inlineText) {
                        buildMap[name] = [contentType, content];
                    }
                    onLoad(json ? parseJSON(content) : content);
                });
            },

            write: function (pluginName, moduleName, write) {
                if (moduleName in buildMap) {
                    
                    var options = buildMap[moduleName];
                        contentType = options[0] ,
                        content = options[1];
                   
                    if (contentType == 'json') {
                        if (!checkJSON(content)) {
                            throw new Error( "Invalid JSON: " + data );

                        }
                     
                    } else {
                        content = '\'' + text.jsEscape(content) + '\'';
                    }
                   
                    write("define('" + pluginName + "!" + moduleName  +
                          "', function () { return " + content + ";});\n");
                }
            }
        };

        return text;
    });
}());
