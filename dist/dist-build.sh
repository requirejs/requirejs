#!/bin/bash

#@license RequireJS Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
#Available via the MIT or new BSD license.
#see: http://github.com/jrburke/requirejs for details

#version should be something like 0.9.0beta or 0.9.0
version=$1
if [ -z $version ]; then
    echo "Please pass in a version number"
    exit 1
fi

myDir=`cd \`dirname "$0"\`; pwd`

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

# Copy over basic script deliverables
cd requirejs-$version
cp require.js ../$version/comments/require.js
cp text.js ../$version/comments/text.js
cp order.js ../$version/comments/order.js
cp i18n.js ../$version/comments/i18n.js

# Build the sample jQuery project
cd docs/jquery-require-sample
./dist.sh
cp dist/jquery-require-sample.zip ../../../$version

# Create node integration layer
cd ../../
cd adapt
node dist.js
mkdir ../../$version/node
cp r.js ../../$version/
cp tests/node/index.js ../../$version/node
cd ../

# Minify any of the browser-based JS files
cd ../$version/comments
java -jar ../../requirejs-$version/build/lib/closure/compiler.jar --js require.js --js_output_file ../minified/require.js
java -jar ../../requirejs-$version/build/lib/closure/compiler.jar --js text.js --js_output_file ../minified/text.js
java -jar ../../requirejs-$version/build/lib/closure/compiler.jar --js order.js --js_output_file ../minified/order.js
java -jar ../../requirejs-$version/build/lib/closure/compiler.jar --js i18n.js --js_output_file ../minified/i18n.js

cd ../../../
