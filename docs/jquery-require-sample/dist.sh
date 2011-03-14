#!/bin/sh

# This script preps the jquery-require-sample for distribution.

# Make the dist directory
rm -rf dist
mkdir dist
mkdir dist/jquery-require-sample
cd dist/jquery-require-sample

# Copy the sample files.
cp -r ../../webapp ./webapp

# Copy over require.js
cp ../../../../require.js webapp/scripts/require.js

# Copy over the build system for requirejs and basic require files, used by the build.
mkdir requirejs
mkdir requirejs/adapt
mkdir requirejs/build
mkdir requirejs/build/convert
mkdir requirejs/build/convert/node
cp -r ../../../../bin requirejs/bin
cp -r ../../../../build/jslib requirejs/build/jslib
cp -r ../../../../build/lib requirejs/build/lib
cp ../../../../build/example.build.js requirejs/build/example.build.js
cp ../../../../build/build.bat requirejs/build/build.bat
cp ../../../../build/build.js requirejs/build/build.js
cp ../../../../build/build.sh requirejs/build/build.sh
cp ../../../../build/buildj.bat requirejs/build/buildj.bat
cp ../../../../build/buildj.sh requirejs/build/buildj.sh
cp ../../../../adapt/node.js requirejs/adapt/node.js
cp ../../../../adapt/rhino.js requirejs/adapt/rhino.js

cp ../../../../require.js requirejs
cp ../../../../LICENSE requirejs/LICENSE

# Start the build.
cd webapp/scripts
../../requirejs/build/build.sh app.build.js
cd ../../..

# Mac weirdness
find . -name .DS_Store -exec rm {} \;

# Package it.
zip -r jquery-require-sample.zip jquery-require-sample/*
