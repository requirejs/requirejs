/**
 * @license RunJS text Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/runjs for details
 */
/*jslint regexp: false, nomen: false, plusplus: false */
/*global run: false, XMLHttpRequest: false, ActiveXObject: false */

"use strict";

(function () {
    var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im;

    if (!run.textStrip) {
        run.textStrip = function (text) {
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

    //Upgrade run to add some methods for XHR handling. But it could be that
    //this run is used in a non-browser env, so detect for existing method
    //before attaching one.
    if (!run.getXhr) {
        run.getXhr = function () {
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
                throw new Error("run.getXhr(): XMLHttpRequest not available");
            }

            return xhr;
        };
    }
    
    if (!run.fetchText) {
        run.fetchText = function (url, callback) {
            var xhr = run.getXhr();
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

    run.plugin({
        prefix: "text",

        /**
         * This callback is prefix-specific, only gets called for this prefix
         */
        run: function (name, deps, callback, context) {
            //No-op, run never gets these text items, they are always
            //a dependency, see load for the action.
        },

        /**
         * Called when a new context is defined. Use this to store
         * context-specific info on it.
         */
        newContext: function (context) {
            run.mixin(context, {
                text: {},
                textWaiting: []
            });
        },

        /**
         * Called when a dependency needs to be loaded.
         */
        load: function (name, contextName) {
            //Name has format: some.module!filext!strip!text
            //The strip and text parts are optional.
            //if strip is present, then that means only get the string contents
            //inside a body tag in an HTML string. For XML/SVG content it means
            //removing the <?xml ...?> declarations so the content can be inserted
            //into the current doc without problems.
            //If text is present, it is the actual text of the file.
            var strip = false, text = null, key, url, index = name.indexOf("!"),
                modName = name.substring(0, index), fullKey,
                ext = name.substring(index + 1, name.length),
                context = run.s.contexts[contextName],
                tWaitAry = context.textWaiting;

            index = ext.indexOf("!");
            if (index !== -1) {
                //Pull off the strip arg.
                strip = ext.substring(index + 1, ext.length);
                ext = ext.substring(0, index);
                index = strip.indexOf("!");
                if (index !== -1 && strip.substring(0, index) === "strip") {
                    //Pul off the text.
                    text = strip.substring(index + 1, strip.length);
                    strip = "strip";
                } else if (strip !== "strip") {
                    //strip is actually the inlined text.
                    text = strip;
                    strip = null;
                }
            }
            key = modName + "!" + ext;
            fullKey = strip ? key + "!" + strip : key;

            //Store off text if it is available for the given key and be done.
            if (text !== null && !context.text[key]) {
                context.defined[name] = context.text[key] = text;
                return;
            }

            //If text is not available, load it.
            if (!context.text[key] && !context.textWaiting[key] && !context.textWaiting[fullKey]) {
                //Keep track that the fullKey needs to be resolved, during the
                //orderDeps stage.
                if (!tWaitAry[fullKey]) {
                    tWaitAry[fullKey] = tWaitAry[(tWaitAry.push({
                        name: name,
                        key: key,
                        fullKey: fullKey,
                        strip: !!strip
                    }) - 1)];
                }

                //Load the text.
                url = run.convertNameToPath(modName, contextName, "." + ext);
                context.loaded[name] = false;
                run.fetchText(url, function (text) {
                    context.text[key] = text;
                    context.loaded[name] = true;
                    run.checkLoaded(contextName);                    
                });
            }
        },

        /**
         * Called when the dependencies of a module are checked.
         */
        checkDeps: function (name, deps, context) {
            //No-op, checkDeps never gets these text items, they are always
            //a dependency, see load for the action.
        },

        /**
         * Called to determine if a module is waiting to load.
         */
        isWaiting: function (context) {
            return !!context.textWaiting.length;
        },

        /**
         * Called when all modules have been loaded.
         */
        orderDeps: function (context) {
            //Clear up state since further processing could
            //add more things to fetch.
            var i, dep, text, tWaitAry = context.textWaiting;
            context.textWaiting = [];
            for (i = 0; (dep = tWaitAry[i]); i++) {
                text = context.text[dep.key];
                context.defined[dep.name] = dep.strip ? run.textStrip(text) : text;
            }
        }
    });
}());
