#!/bin/bash

#@license RequireJS Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
#Available via the MIT, GPL or new BSD license.
#see: http://github.com/jrburke/requirejs for details

build/
    minified/
    comments/
        xrequire.js
        xallplugins-require.js
        xrequirejs.zip
        xjquery.js
        jquery-sample.zip
        xjquery+plugins.js

#version should be something like 0.9.0beta or 0.9.0
version=$1

jqueryName=jquery-1.4.2

# Setup a build directory
rm ../../requirejs-build
mkdir ../../requirejs-build
cp -r ../ ../../requirejs-build/requirejs-$version

# Zip up the full source
cd ../../requirejs-build
zip -r requirejs-$version.zip requirejs-$version/*

# Create the version output dir
mkdir $version
mkdir $version/minified
mkdir $version/comments
mv requirejs-$version.zip $version

# Build requirejs
cd build/require
./build.sh
cd build
cp require.js ../../../$version/comments/require.js
cp allplugins-require.js ../../../$version/comments/allplugins-require.js

# Build jquery options
cd ../../jquery
./build.sh
jqueryRequire=($(cat dist/jquery-require.js))
jqueryPluginRequire=($(cat dist/jquery-allplugins-require.js))
jquery=($(cat $jqueryName.js))
simpleJQuery=$jquery | sed s/\/\/REQUIREJS/$jqueryRequire/
pluginJQuery=$jquery | sed s/\/\/REQUIREJS/$jqueryPluginRequire/

# Save jQuery options
cd ../../
simpleJQuery > docs/jquery-require-sample/webapp/scripts/jquery.js
simpleJQuery > $version/comments/$jqueryName.js
pluginJQuery > $version/comments/plugins-$jqueryName.js

# 