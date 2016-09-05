#!/bin/bash

#version should be something like 0.9.0beta or 0.9.0
version=$1
if [ -z $version ]; then
    echo "Please pass in a version number"
    exit 1
fi

myDir=`cd \`dirname "$0"\`; pwd`

# First update the sub-projects with the latest.
cd ..
./updatesubs.sh
cd dist

# Setup a build directory
rm -rf ../../requirejs-build
mkdir ../../requirejs-build

# Create the version output dir
cd ../../requirejs-build
mkdir $version
mkdir $version/minified
mkdir $version/comments

# Copy over the r.js file, and set up that project for a dist checkin.
cp ../r.js/r.js $version/r.js
cp ../r.js/r.js ../r.js/dist/r-$version.js

# Copy over basic script deliverables
cp $myDir/../require.js $version/comments/require.js

# Minify any of the browser-based JS files
cd $version/comments

uglifyjs require.js -mc --comments -o ../minified/require.js

cd ../../../
