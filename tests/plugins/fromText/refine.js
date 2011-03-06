
/*jslint strict: false */
/*global define: false, require: false */

(function () {
    //Load the text plugin, so that the XHR calls can be made.
    var buildMap = {};

    define(['require/text'], function (text) {
        return {
            load: function (name, parentRequire, load, config) {
                var url = parentRequire.toUrl(name + '.refine');
                require.fetchText(url, function (text) {
                    text = text.replace(/refine/g, 'define');

                    if (config.isBuild) {
                        buildMap[name] = text;
                    }

                    //Add in helpful debug line
                    text += "\r\n//@ sourceURL=" + url;

                    load.fromText(name, text);

                    parentRequire([name], function (value) {
                        load(value);
                    });
                });
            },

            write: function (pluginName, name, write) {
                if (name in buildMap) {
                    var text = buildMap[name];
                    write.asModule(pluginName + "!" + name, text);
                }
            }
        };
    });

}());
