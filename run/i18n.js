/*
    Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
    Available via the new BSD license.
    see: http://code.google.com/p/runjs/ for details
*/
/*jslint regexp: false, nomen: false, plusplus: false */
/*global run: false, navigator: false */

"use strict";

(function () {
    //regexp for matching nls (i18n) module names.
    var nlsRegExp = /(^.*(^|\.)nls(\.|$))([^\.]*)\.?([^\.]*)/,
        empty = {};

    function getWaiting(context, name) {
        var nlswAry = context.nlsWaiting;
        return nlswAry[name] ||
               //Push a new waiting object on the nlsWaiting array, but also put
               //a shortcut lookup by name to the object on the array.
               (nlswAry[name] = nlswAry[(nlswAry.push({ _name: name}) - 1)]);
    }
    /**
     * Does the work to integrate the bundle into the nls scheme.
     */
    function integrateBundle(name, obj, context) {
        var i, bundle, parts, toLoad, nlsw, loc, val;

        //dep is an object, so it is an i18n nls thing.
        //Track it in the nls section of the context.
        //It may have already been created via a specific locale
        //request, so just mixin values in that case, to preserve
        //the specific locale bundle object.
        bundle = context.nls[name];
        if (bundle) {
            run.mixin(bundle, obj);
        } else {
            context.nls[name] = obj;
        }

        //Break apart the locale to get the parts.
        parts = context.config.locale.split("-");

        //Now see what bundles exist for each country/locale.
        //Want to walk up the chain, so if locale is en-us-foo,
        //look for en-us-foo, en-us, en, then root.
        toLoad = [];

        nlsw = getWaiting(context, name);

        for (i = parts.length; i > -1; i--) {
            loc = i ? parts.slice(0, i).join("-") : "root";
            val = obj[loc];
            if (val) {
                //Store which bundle to use for the default bundle definition.
                nlsw._match = nlsw._match || loc;

                //Track that the locale needs to be resolved with its parts.
                nlsw[loc] = true;

                //If locale value is a string, it means it is a resource that
                //needs to be loaded. Track it to load if it has not already
                //been asked for.
                if (typeof val === "string") {
                    //Strip off the plugin prefix.
                    val = val.substring(val.indexOf("!") + 1, val.length);
    
                    if (!context.specified[val] && !(val in context.loaded)) {
                        toLoad.push(val);
                    }
                }
            }
        }

        //Load any bundles that are still needed.
        if (toLoad.length) {
            context.defined.run(toLoad);
        }
    }

    run.plugin({
        prefix: "i18n",

        /**
         * This callback is prefix-specific, only gets called for this prefix
         */
        run: function (name, deps, callback, context, isFunction) {
            var match, nlsw, bundle, master;

            integrateBundle(name, context.defined[name], context);

            //All i18n modules must match the nls module name structure.
            match = nlsRegExp.exec(name);
            //Reconstruct the master bundle name from parts of the regexp match
            //nlsRegExp.exec("foo.bar.baz.nls.en-ca.foo") gives:
            //["foo.bar.baz.nls.en-ca.foo", "foo.bar.baz.nls.", ".", ".", "en-ca", "foo"]
            //nlsRegExp.exec("foo.bar.baz.nls.foo") gives:
            //["foo.bar.baz.nls.foo", "foo.bar.baz.nls.", ".", ".", "foo", ""]
            //so, if match[5] is blank, it means this is the top bundle definition,
            //so it does not have to be handled. Only deal with ones that have a locale
            //(a match[4] value but no match[5])
            if (match[5]) {
                master = match[1] + match[5];

                //Track what locale bundle need to be generated once all the modules load.
                nlsw = getWaiting(context, master);
                nlsw[match[4]] = true;

                bundle = context.nls[master];
                if (!bundle) {
                    //No master bundle yet, ask for it.
                    context.defined.run([master]);
                    bundle = context.nls[master] = {};
                }
                //For nls modules, the callback is just a regular object,
                //so save it off in the bundle now.
                bundle[match[4]] = callback;
            }
        },

        /**
         * Called when a new context is defined. Use this to store
         * context-specific info on it.
         */
        newContext: function (context) {
            run.mixin(context, {
                nlsWaiting: [],
                nls: {}
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
            //Just call regular load.
            run.load(name, contextName); 
        },

        /**
         * Called when the dependencies of a module are checked.
         */
        checkDeps: function (name, deps, context) {
            //If no dependencies, it means the bundle has already been
            //defined in the run call and skip it.
            if (!deps) {
                return;
            }

            integrateBundle(name, deps, context);
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
                modulePrefix, loc, defLoc, locPart, nlsWaiting = context.nlsWaiting;
            context.nlsWaiting = [];

            //First, properly mix in any nls bundles waiting to happen.
            //Use an empty object to detect other bad JS code that modifies
            //Object.prototype.
            for (i = 0; (msWaiting = nlsWaiting[i]); i++) {
                //Each property is a master bundle name.
                master = msWaiting._name;
                bundle = context.nls[master];
                defLoc = null;

                //Create the module name parts from the master name. So, if master
                //is foo.nls.bar, then the parts should be prefix: "foo.nls",
                // suffix: "bar", and the final locale's module name will be foo.nls.locale.bar
                parts = master.split(".");
                modulePrefix = parts.slice(0, parts.length - 1).join(".");
                moduleSuffix = parts[parts.length - 1];
                //Cycle through the locale props on the waiting object and combine
                //the locales together.
                for (loc in msWaiting) {
                    if (loc !== "_name" && !(loc in empty)) {
                        if (loc === "_match") {
                            //Found default locale to use for the top-level bundle name.
                            defLoc = msWaiting[loc];
                        } else {
                            //Mix in the properties of this locale together.
                            //Split the locale into pieces.
                            mixed = {};
                            parts = loc.split("-");
                            for (j = parts.length; j > 0; j--) {
                                locPart = parts.slice(0, j).join("-");
                                if (locPart !== "root" && bundle[locPart]) {
                                    run.mixin(mixed, bundle[locPart]);
                                }
                            }
                            if (bundle.root) {
                                run.mixin(mixed, bundle.root);
                            }

                            context.defined[modulePrefix + "." + loc + "." + moduleSuffix] = mixed;
                        }
                    }
                }

                //Finally define the default locale. Wait to the end of the property
                //loop above so that the default locale bundle has been properly mixed
                //together.
                context.defined[master] = context.defined[modulePrefix + "." + defLoc + "." + moduleSuffix];
            }
        }
    });
}());
