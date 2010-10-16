#!/bin/bash

#@license RequireJS Copyright (c) 2010, The Dojo Foundation All Rights Reserved.
#Available via the MIT or new BSD license.
#see: http://github.com/jrburke/requirejs for details

#version should be something like 0.9.0beta or 0.9.0
version=$1
if [ -z $version ]; then
    echo "Please pass in a version number"
    exit 1
fi

jqueryName=jquery-1.4.3.js

# Setup a build directory
rm -rf ../../requirejs-build
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
cd requirejs-$version/build/require
./build.sh
cd build
cp require.js ../../../../$version/comments/require.js
cp allplugins-require.js ../../../../$version/comments/allplugins-require.js

# Build jquery options
cd ../../jquery
../build.sh require-jquery.build.js
../build.sh requireplugins-jquery.build.js

mv dist/require-jquery.js ../../../$version/comments/require-$jqueryName
mv dist/requireplugins-jquery.js ../../../$version/comments/requireplugins-$jqueryName

# Build the sample jQuery project
cd ../../
cd docs/jquery-require-sample
./dist.sh
cp dist/jquery-require-sample.zip ../../../$version

# Create node integration layer
cd ../../
cd build/convert/node
java -jar ../../lib/rhino/js.jar dist.js
mkdir ../../../../$version/node
cp r.js ../../../../$version/node
cp index.js ../../../../$version/node
cd ../../../

# Minify any of the browser-based JS files
cd ../$version/comments
java -jar ../../requirejs-$version/build/lib/closure/compiler.jar --js require.js --js_output_file ../minified/require.js
java -jar ../../requirejs-$version/build/lib/closure/compiler.jar --js allplugins-require.js --js_output_file ../minified/allplugins-require.js
java -jar ../../requirejs-$version/build/lib/closure/compiler.jar --js require-$jqueryName --js_output_file ../minified/require-$jqueryName
java -jar ../../requirejs-$version/build/lib/closure/compiler.jar --js requireplugins-$jqueryName --js_output_file ../minified/requireplugins-$jqueryName

cd ../../../
