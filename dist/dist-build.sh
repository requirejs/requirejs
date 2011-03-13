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

# Build requirejs
cd requirejs-$version/build/require
./build.sh
cd build
sed -i '' 's/\/\*jslint/\/\*jslint white\: false\,/' require.js
sed -i '' 's/\/\*jslint/\/\*jslint white\: false\,/' allplugins-require.js
cp require.js ../../../../$version/comments/require.js
cp allplugins-require.js ../../../../$version/comments/allplugins-require.js

# Build the sample jQuery project
cd ../../../
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
java -jar ../../requirejs-$version/build/lib/closure/compiler.jar --js allplugins-require.js --js_output_file ../minified/allplugins-require.js

cd ../../../
