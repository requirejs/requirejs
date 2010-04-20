#!/bin/sh

# This script preps the jquery-require-sample for distribution.

# Make the dist directory
rm -rf dist
mkdir dist
mkdir dist/jquery-require-sample
cd dist/jquery-require-sample

# Copy the sample files.
cp -r ../../webapp ./webapp

# Do a build of requirejs with jquery
cd ../../../../build/jquery
../build.sh require-jquery.build.js
cp dist/require-jquery.js ../../docs/jquery-require-sample/dist/jquery-require-sample/webapp/scripts/require-jquery.js
rm -rf dist/
cd ../../docs/jquery-require-sample/dist/jquery-require-sample

# Copy over the build system for requirejs and basic require files, used by the build.
mkdir requirejs
mkdir requirejs/build
cp -r ../../../../build/jslib requirejs/build/jslib
cp -r ../../../../build/lib requirejs/build/lib
cp ../../../../build/example.build.js requirejs/build/example.build.js
cp ../../../../build/build.bat requirejs/build/build.bat
cp ../../../../build/build.js requirejs/build/build.js
cp ../../../../build/build.sh requirejs/build/build.sh

cp ../../../../require.js requirejs/
cp -r ../../../../require requirejs/require
cp ../../../../LICENSE requirejs/LICENSE

# Start the build.
cd webapp/scripts
../../requirejs/build/build.sh app.build.js
cd ../../..

# Mac weirdness
find . -name .DS_Store -exec rm {} \;

# Package it.
zip -r jquery-require-sample.zip jquery-require-sample/*
