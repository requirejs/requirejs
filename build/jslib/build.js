/**
 * @license Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
 * Available via the MIT, GPL or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

/*jslint regexp: false, plusplus: false, nomen: false */
/*global java: false, lang: false, fileUtil: false, print: false,
logger: false, require: false, pragma: false */

"use strict";

var build;
(function () {
    var baseConfig = {
            requireBuildPath: "../",
            appDir: "",
            pragmas: {
                useStrict: true
            },
            paths: {},
            optimize: "closure",
            optimizeCss: "standard.keepLines",
            inlineText: true,
            execModules: false
        };

    build = {
        /**
         * Creates a config object for an optimization build.
         * It will also read the build profile if it is available, to create
         * the configuration.
         *
         * @param {Object} cfg config options that take priority
         * over defaults and ones in the build file. These options could
         * be from a command line, for instance.
         *
         * @param {Object} the created config object.
         */
        createConfig: function (cfg) {
            /*jslint evil: true */
            var config = {}, baseUrl, buildFileContents, buildFileConfig,
                paths, props, i, prop;

            lang.mixin(config, baseConfig);
            lang.mixin(config, cfg, true);

            //Normalize build directory location, and set up path to require.js
            if (config.requireBuildPath.charAt(config.requireBuildPath.length - 1) !== "/") {
                config.requireBuildPath += "/";
                //Also adjust the override config params, since it
                //may be re-applied later after reading the build file.
                if (cfg.requireBuildPath) {
                    cfg.requireBuildPath = config.requireBuildPath;
                }
            }
            config.requireUrl = cfg.requireBuildPath + "../require.js";

            if (config.buildFile) {
                //A build file exists, load it to get more config.
                config.buildFile = new java.io.File(config.buildFile).getAbsoluteFile();

                //Find the build file, and make sure it exists, if this is a build
                //that has a build profile, and not just command line args with an in=path
                if (!config.buildFile.exists()) {
                    throw new Error("ERROR: build file does not exist: " + config.buildFile.getAbsolutePath());
                }

                config.baseUrl = fileUtil.absPath(config.buildFile.getParentFile());
                config.buildFile = fileUtil.absPath(config.buildFile);
                config.dir = config.baseUrl + "/build/";

                //Load build file options.
                buildFileContents = fileUtil.readFile(config.buildFile);
                buildFileConfig = eval("(" + buildFileContents + ")");
                lang.mixin(config, buildFileConfig, true);

                //Re-apply the override config values, things like command line
                //args should take precedence over build file values.
                lang.mixin(config, cfg, true);
            } else {
                //Base URL is relative to the in file.
                if (!config.name) {
                    throw new Error("ERROR: name= argument missing.");
                }
                if (!config.out) {
                    throw new Error("ERROR: out= argument missing.");
                } else {
                    config.out = config.out.replace(lang.backSlashRegExp, "/");
                }
                if (!cfg.baseUrl) {
                    throw new Error("ERROR: baseUrl= argument missing.");
                }

                //Set up dummy module layer to build.
                config.modules = [
                    {
                        name: config.name,
                        include: config.include
                    }
                ];

                //Does not have a build file, so set up some defaults.
                //Optimizing CSS should not be allowed, unless explicitly
                //asked for on command line. In that case the only task is
                //to optimize a CSS file.
                if (!cfg.optimizeCss) {
                    config.optimizeCss = "none";
                }
            }

            //Adjust the path properties as appropriate.
            //First make sure build paths use front slashes and end in a slash
            props = ["appDir", "dir", "baseUrl"];
            for (i = 0; (prop = props[i]); i++) {
                if (config[prop]) {
                    config[prop] = config[prop].replace(lang.backSlashRegExp, "/");
                    if (config[prop].charAt(config[prop].length - 1) !== "/") {
                        config[prop] += "/";
                    }
                }
            }

            //Make sure paths has a setting for require, so support plugins
            //can be loaded for the build.
            paths = config.paths;
            if (!paths.require) {
                paths.require = config.requireUrl.substring(0, config.requireUrl.lastIndexOf("/")) + "/require";
            }

            return config;
        },

        resumeRegExp: /require\s*\.\s*resume\s*\(\s*\)(;)?/g,

        /**
         * Uses the module build config object to create an flattened version
         * of the module, with deep dependencies included.
         * 
         * @param {Object} module the module object from the build config info.
         * @param {Object} the build config object.
         *
         * @returns {Object} with two properties: "text", the text of the flattened
         * module, and "buildText", a string of text representing which files were
         * included in the flattened module text.
         */
        flattenModule: function (module, config) {
            var include, override, prop, url, buildFileContents = "", requireContents = "",
                pluginContents = "", pluginBuildFileContents = "", includeRequire,
                specified, path, reqIndex, fileContents, currContents,
                i, placeHolderModName, needPause,
                context = require.s.contexts[require.s.ctxName];

            //Reset some state set up in requirePatch.js
            require._buildReset();
    
            logger.trace("\nTracing dependencies for: " + module.name);
            include = [module.name];
            if (module.include) {
                include = include.concat(module.include);
            }

            //If there are overrides to basic config, set that up now.
            baseConfig = context.config;
            if (module.override) {
                override = lang.delegate(baseConfig);
                lang.mixin(override, module.override, true);
                require(override);
            }

            //Figure out module layer dependencies by calling require to do the work.
            require(include);
    
            //Add any other files that did not have an explicit name on them.
            //These are files that do not call back into require when loaded.
            for (prop in require.buildPathMap) {
                if (require.buildPathMap.hasOwnProperty(prop)) {
                    url = require.buildPathMap[prop];
                    if (!require.loadedFiles[url]) {
                        require.buildFileToModule[url] = prop;
                        //Do not add plugins to build file paths since they will
                        //be added later, near the top of the module layer.
                        if (prop.indexOf("require/") !== 0) {
                            require.buildFilePaths.push(url);
                        }
                        require.loadedFiles[url] = true;
                    }
                }
            }
    
            //Reset config
            if (module.override) {
                require(baseConfig);
            }
    
            //Start build output for the module.
            buildFileContents += "\n" +
                                 (config.dir ? module._buildPath.replace(config.dir, "") : module._buildPath) +
                                 "\n----------------\n";

            //If the file wants require.js added to the module, add it now
            requireContents = "";
            pluginContents = "";
            pluginBuildFileContents = "";
            includeRequire = false;
            if ("includeRequire" in module) {
                includeRequire = module.includeRequire;
            }
            if (includeRequire) {
                requireContents = pragma.process(config.requireUrl, fileUtil.readFile(config.requireUrl), context.config);
                if (require.buildFilePaths.length) {
                    requireContents += "require.pause();\n";
                }
                buildFileContents += "require.js\n";
            }
    
            //Check for any plugins loaded, and hoist to the top, but below
            //the require() definition.
            specified = context.specified;
            for (prop in specified) {
                if (specified.hasOwnProperty(prop)) {
                    if (prop.indexOf("require/") === 0) {
                        path = require.buildPathMap[prop];
                        //Path may be null, context.specified is populated by
                        //all module layers at the moment, but buildPathMaps are reset
                        //for each module layer. TODO: fix this.
                        if (path) {
                            pluginBuildFileContents += path.replace(config.dir, "") + "\n";
                            pluginContents += pragma.process(path, fileUtil.readFile(path), context.config);
                        }
                    }
                }
            }
            if (includeRequire) {
                //require.js will be included so the plugins will appear right after it.
                buildFileContents += pluginBuildFileContents;
            }
    
            //If there was an existing file with require in it, hoist to the top.
            if (!includeRequire && require.existingRequireUrl) {
                reqIndex = require.buildFilePaths.indexOf(require.existingRequireUrl);
                if (reqIndex !== -1) {
                    require.buildFilePaths.splice(reqIndex, 1);
                }
                require.buildFilePaths.unshift(require.existingRequireUrl);
            }
    
            //Write the built module to disk, and build up the build output.
            fileContents = "";
            for (i = 0; (path = require.buildFilePaths[i]); i++) {
                //Add the contents but remove any pragmas and require.pause/resume calls.
                currContents = pragma.process(path, fileUtil.readFile(path), context.config);
                needPause = build.resumeRegExp.test(currContents);
    
                //If this is the first file, and require() is not part of the file
                //and require() is not added later at the end to the top of the file,
                //need to start off with a require.pause() call.
                if (i === 0 && require.existingRequireUrl !== path && !includeRequire) {
                    fileContents += "require.pause()\n";
                }

                fileContents += currContents;

                buildFileContents += path.replace(config.dir, "") + "\n";
                //Some files may not have declared a require module, and if so,
                //put in a placeholder call so the require does not try to load them
                //after the module is processed.
                placeHolderModName = require.buildFileToModule[path];
                //If we have a name, but no defined module, then add in the placeholder.
                if (placeHolderModName && !require.modulesWithNames[placeHolderModName]) {
                    fileContents += 'require.def("' + placeHolderModName + '", function(){});\n';
                }
    
                //If we have plugins but are not injecting require.js,
                //then need to place the plugins after the require definition,
                //if it was found.
                if (require.existingRequireUrl === path && !includeRequire) {
                    fileContents += pluginContents;
                    buildFileContents += pluginBuildFileContents;
                    pluginContents = "";
                    fileContents += "require.pause();\n";
                }

                //If the file contents had a require.resume() we need to now pause
                //dependency resolution for the rest of the files. Multiple require.pause()
                //calls are OK.
                if (needPause) {
                    fileContents += "require.pause();\n";
                }
            }
    
            //Resume dependency resolution
            if (require.buildFilePaths.length) {
                fileContents += "\nrequire.resume();\n";
            }

            //Add the require file contents to the head of the file.
            fileContents = (requireContents ? requireContents + "\n" : "") +
                           (pluginContents ? pluginContents + "\n" : "") +
                           fileContents;
    
            return {
                text: fileContents,
                buildText: buildFileContents
            };
        }
    };
}());