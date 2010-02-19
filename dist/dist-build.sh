#!/bin/bash

#@license RequireJS Copyright (c) 2004-2010, The Dojo Foundation All Rights Reserved.
#Available via the MIT, GPL or new BSD license.
#see: http://github.com/jrburke/requirejs for details

#version should be something like 0.9.0beta or 0.9.0
version=$1

jqueryName=jquery-1.4.2.js

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
../build.sh jquery.build.js

cat dist/jquery-require.js $jqueryName > ../../docs/jquery-require-sample/webapp/scripts/jquery.js
cat dist/jquery-require.js $jqueryName > ../../../$version/comments/$jqueryName
cat dist/jquery-allplugins-require.js $jqueryName > ../../../$version/comments/requirejsplugins-$jqueryName

# Build the sample jQuery project
cd ../../
cd docs/jquery-require-sample
./dist.sh
cp dist/jquery-require-sample.zip ../../../$version

# Minify any of the JS files
cd ../../../$version/comments
java -jar ../../requirejs-$version/build/lib/closure/compiler.jar --js require.js --js_output_file ../minified/require.js
java -jar ../../requirejs-$version/build/lib/closure/compiler.jar --js allplugins-require.js --js_output_file ../minified/allplugins-require.js
java -jar ../../requirejs-$version/build/lib/closure/compiler.jar --js $jqueryName --js_output_file ../minified/$jqueryName
java -jar ../../requirejs-$version/build/lib/closure/compiler.jar --js requirejsplugins-$jqueryName --js_output_file ../minified/requirejsplugins-$jqueryName

cd ../../../
