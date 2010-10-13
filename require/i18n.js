/**
 * @license RequireJS i18n Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
/*jslint regexp: false, nomen: false, plusplus: false */
/*global require: false, navigator: false */
"use strict";

/**
 * This plugin handles i18n! prefixed modules. It does the following:
 *
 * 1) A regular module can have a dependency on an i18n bundle, but the regular
 * module does not want to specify what locale to load. So it just specifies
 * the top-level bundle, like "i18n!nls/colors".
 *
 * This plugin will load the i18n bundle at nls/colors, see that it is a root/master
 * bundle since it does not have a locale in its name. It will then try to find
 * the best match locale available in that master bundle, then request all the
 * locale pieces for that best match locale. For instance, if the locale is "en-us",
 * then the plugin will ask for the "en-us", "en" and "root" bundles to be loaded
 * (but only if they are specified on the master bundle).
 *
 * Once all the bundles for the locale pieces load, then it mixes in all those
 * locale pieces into each other, then finally sets the context.defined value
 * for the nls/colors bundle to be that mixed in locale.
 *
 * 2) A regular module specifies a specific locale to load. For instance,
 * i18n!nls/fr-fr/colors. In this case, the plugin needs to load the master bundle
 * first, at nls/colors, then figure out what the best match locale is for fr-fr,
 * since maybe only fr or just root is defined for that locale. Once that best
 * fit is found, all of its locale pieces need to have their bundles loaded.
 *
 * Once all the bundles for the locale pieces load, then it mixes in all those
 * locale pieces into each other, then finally sets the context.defined value
 * for the nls/fr-fr/colors bundle to be that mixed in locale.
 */
(function () {
    //regexp for reconstructing the master bundle name from parts of the regexp match
    //nlsRegExp.exec("foo/bar/baz/nls/en-ca/foo") gives:
    //["foo/bar/baz/nls/en-ca/foo", "foo/bar/baz/nls/", "/", "/", "en-ca", "foo"]
    //nlsRegExp.exec("foo/bar/baz/nls/foo") gives:
    //["foo/bar/baz/nls/foo", "foo/bar/baz/nls/", "/", "/", "foo", ""]
    //so, if match[5] is blank, it means this is the top bundle definition.
    var nlsRegExp = /(^.*(^|\/)nls(\/|$))([^\/]*)\/?([^\/]*)/,
        empty = {};

    function getWaiting(name, context) {
        var nlswAry = context.nlsWaiting;
        return nlswAry[name] ||
               //Push a new waiting object on the nlsWaiting array, but also put
               //a shortcut lookup by name to the object on the array.
               (nlswAry[name] = nlswAry[(nlswAry.push({ _name: name}) - 1)]);
    }

    /**
     * Makes sure all the locale pieces are loaded, and finds the best match
     * for the requested locale.
     */
    function resolveLocale(masterName, bundle, locale, context) {
        //Break apart the locale to get the parts.
        var i, parts, toLoad, nlsw, loc, val, bestLoc = "root";

        parts = locale.split("-");

        //Now see what bundles exist for each country/locale.
        //Want to walk up the chain, so if locale is en-us-foo,
        //look for en-us-foo, en-us, en, then root.
        toLoad = [];

        nlsw = getWaiting(masterName, context);

        for (i = parts.length; i > -1; i--) {
            loc = i ? parts.slice(0, i).join("-") : "root";
            val = bundle[loc];
            if (val) {
                //Store which bundle to use for the default bundle definition.
                if (locale === context.config.locale && !nlsw._match) {
                    nlsw._match = loc;
                }

                //Store the best match for the target locale
                if (bestLoc === "root") {
                    bestLoc = loc;
                }

                //Track that the locale needs to be resolved with its parts.
                //Mark what locale should be used when resolving.
                nlsw[loc] = loc;

                //If locale value is true, it means it is a resource that
                //needs to be loaded. Track it to load if it has not already
                //been asked for.
                if (val === true) {
                    //split off the bundl name from master name and insert the
                    //locale before the bundle name. So, if masterName is
                    //some/path/nls/colors, then the locale fr-fr's bundle name should
                    //be some/path/nls/fr-fr/colors
                    val = masterName.split("/");
                    val.splice(-1, 0, loc);
                    val = val.join("/");

                    if (!context.specified[val] && !(val in context.loaded) && !context.defined[val]) {
                        context.defPlugin[val] = 'i18n';
                        toLoad.push(val);
                    }
                }
            }
        }

        //If locale was not an exact match, store the closest match for it.
        if (bestLoc !== locale) {
            if (context.defined[bestLoc]) {
                //Already got it. Easy peasy lemon squeezy.
                context.defined[locale] = context.defined[bestLoc];
            } else {
                //Need to wait for things to load then define it.
                nlsw[locale] = bestLoc;
            }
        }

        //Load any bundles that are still needed.
        if (toLoad.length) {
            require(toLoad, context.contextName);
        }
    }

    require.plugin({
        prefix: "i18n",

        /**
         * This callback is prefix-specific, only gets called for this prefix
         */
        require: function (name, deps, callback, context) {
            var i, match, nlsw, bundle, master, toLoad, obj = context.defined[name];

            //All i18n modules must match the nls module name structure.
            match = nlsRegExp.exec(name);
            //If match[5] is blank, it means this is the top bundle definition,
            //so it does not have to be handled. Only deal with ones that have a locale
            //(a match[4] value but no match[5])
            if (match[5]) {
                master = match[1] + match[5];

                //Track what locale bundle need to be generated once all the modules load.
                nlsw = getWaiting(master, context);
                nlsw[match[4]] = match[4];

                bundle = context.nls[master];
                if (!bundle) {
                    //No master bundle yet, ask for it.
                    context.defPlugin[master] = 'i18n';
                    require([master], context.contextName);
                    bundle = context.nls[master] = {};
                }
                //For nls modules, the callback is just a regular object,
                //so save it off in the bundle now.
                bundle[match[4]] = callback;
            } else {
                //Integrate bundle into the nls area.
                bundle = context.nls[name];
                if (bundle) {
                    //A specific locale already started the bundle object.
                    //Do a mixin (which will not overwrite the locale property
                    //on the bundle that has the previously loaded locale's info)
                    require.mixin(bundle, obj);
                } else {
                    bundle = context.nls[name] = obj;
                }
                context.nlsRootLoaded[name] = true;

                //Make sure there are no locales waiting to be resolved.
                toLoad = context.nlsToLoad[name];
                if (toLoad) {
                    delete context.nlsToLoad[name];
                    for (i = 0; i < toLoad.length; i++) {
                        resolveLocale(name, bundle, toLoad[i], context);
                    }
                }

                resolveLocale(name, bundle, context.config.locale, context);
            }
        },

        /**
         * Called when a new context is defined. Use this to store
         * context-specific info on it.
         */
        newContext: function (context) {
            require.mixin(context, {
                nlsWaiting: [],
                nls: {},
                nlsRootLoaded: {},
                nlsToLoad: {}
            });
            if (!context.config.locale) {
                context.config.locale = typeof navigator === "undefined" ? "root" :
                        (navigator.language || navigator.userLanguage || "root").toLowerCase();
            }
        },

        /**
         * Called when a dependency needs to be loaded.
         */
        load: function (name, contextName) {
            //Make sure the root bundle is loaded, to check if we can support
            //loading the requested locale, or if a different one needs
            //to be chosen.
            var masterName, context = require.s.contexts[contextName], bundle,
                match = nlsRegExp.exec(name), locale = match[4];

            //If match[5] is blank, it means this is the top bundle definition,
            //so it does not have to be handled. Only deal with ones that have a locale
            //(a match[4] value but no match[5])
            if (match[5]) {
                //locale-specific bundle
                masterName = match[1] + match[5];
                bundle = context.nls[masterName];
                if (context.nlsRootLoaded[masterName] && bundle) {
                    resolveLocale(masterName, bundle, locale, context);
                } else {
                    //Store this locale to figure out after masterName is loaded and load masterName.
                    (context.nlsToLoad[masterName] || (context.nlsToLoad[masterName] = [])).push(locale);
                    context.defPlugin[masterName] = 'i18n';
                    require([masterName], contextName);
                }
            } else {
                //Top-level bundle. Just call regular load, if not already loaded
                if (!context.nlsRootLoaded[name]) {
                    context.defPlugin[name] = 'i18n';
                    require.load(name, contextName);
                }
            }
        },

        /**
         * Called when the dependencies of a module are checked.
         */
        checkDeps: function (name, deps, context) {
            //i18n bundles are always defined as objects for their "dependencies",
            //and that object is already processed in the require method, no need to
            //do work in here.
        },

        /**
         * Called to determine if a module is waiting to load.
         */
        isWaiting: function (context) {
            return !!context.nlsWaiting.length;
        },

        /**
         * Called when all modules have been loaded.
         */
        orderDeps: function (context) {
            //Clear up state since further processing could
            //add more things to fetch.
            var i, j, master, msWaiting, bundle, parts, moduleSuffix, mixed,
                modulePrefix, loc, defLoc, locPart, nlsWaiting = context.nlsWaiting,
                bestFit;
            context.nlsWaiting = [];
            context.nlsToLoad = {};

            //First, properly mix in any nls bundles waiting to happen.
            for (i = 0; (msWaiting = nlsWaiting[i]); i++) {
                //Each property is a master bundle name.
                master = msWaiting._name;
                bundle = context.nls[master];
                defLoc = null;

                //Create the module name parts from the master name. So, if master
                //is foo/nls/bar, then the parts should be prefix: "foo/nls",
                // suffix: "bar", and the final locale's module name will be foo/nls/locale/bar
                parts = master.split("/");
                modulePrefix = parts.slice(0, parts.length - 1).join("/");
                moduleSuffix = parts[parts.length - 1];
                //Cycle through the locale props on the waiting object and combine
                //the locales together.
                for (loc in msWaiting) {
                    if (loc !== "_name" && !(loc in empty)) {
                        if (loc === "_match") {
                            //Found default locale to use for the top-level bundle name.
                            defLoc = msWaiting[loc];
                        
                        } else if (msWaiting[loc] !== loc) {
                            //A "best fit" locale, store it off to the end and handle
                            //it at the end by just assigning the best fit value, since
                            //after this for loop, the best fit locale will be defined.
                            (bestFit || (bestFit = {}))[loc] = msWaiting[loc];
                        } else {
                            //Mix in the properties of this locale together.
                            //Split the locale into pieces.
                            mixed = {};
                            parts = loc.split("-");
                            for (j = parts.length; j > 0; j--) {
                                locPart = parts.slice(0, j).join("-");
                                if (locPart !== "root" && bundle[locPart]) {
                                    require.mixin(mixed, bundle[locPart]);
                                }
                            }
                            if (bundle.root) {
                                require.mixin(mixed, bundle.root);
                            }

                            context.defined[modulePrefix + "/" + loc + "/" + moduleSuffix] = mixed;
                        }
                    }
                }

                //Finally define the default locale. Wait to the end of the property
                //loop above so that the default locale bundle has been properly mixed
                //together.
                context.defined[master] = context.defined[modulePrefix + "/" + defLoc + "/" + moduleSuffix];
                
                //Handle any best fit locale definitions.
                if (bestFit) {
                    for (loc in bestFit) {
                        if (!(loc in empty)) {
                            context.defined[modulePrefix + "/" + loc + "/" + moduleSuffix] = context.defined[modulePrefix + "/" + bestFit[loc] + "/" + moduleSuffix];
                        }
                    }
                }
            }
        }
    });
}());
