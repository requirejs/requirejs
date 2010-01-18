#!/bin/sh

# This script preps the jquery-run-sample for distribution.

# Make the dist directory
rm -rf dist
mkdir dist
mkdir dist/jquery-run-sample
cd dist/jquery-run-sample

# Copy the sample files.
cp -r ../../webapp ./webapp

# Do a build of runjs, using the minimum feature set and place it in scripts dir
cd ../../../../build/run
./build.sh
cp build/nomodifypluginspagecontext-run.js ../../docs/jquery-run-sample/dist/jquery-run-sample/webapp/scripts/run.js
rm -rf build/
cd ../../docs/jquery-run-sample/dist/jquery-run-sample

# Copy over the build system for runjs and basic run files, used by the build.
mkdir runjs
mkdir runjs/build
cp -r ../../../../build/jslib runjs/build/jslib
cp -r ../../../../build/lib runjs/build/lib
cp ../../../../build/example.build.js runjs/build/example.build.js
# Windows thing not working yet.
# cp ../../../../build/runbuild.bat runjs/build/runbuild.bat
cp ../../../../build/runbuild.js runjs/build/runbuild.js
cp ../../../../build/runbuild.sh runjs/build/runbuild.sh

cp ../../../../run.js runjs/
cp -r ../../../../run runjs/run
cp ../../../../LICENSE runjs/LICENSE

# Change path to run in the build script.
cat webapp/scripts/app.build.js | sed 's/runUrl\:[^\,]*/runUrl: "..\/..\/runjs\/run.js"/' > webapp/scripts/app.build.js2
rm webapp/scripts/app.build.js
mv webapp/scripts/app.build.js2 webapp/scripts/app.build.js

# Run the build.
cd webapp/scripts
../../runjs/build/runbuild.sh app.build.js
cd ../../..

# Mac weirdness
find . -name .DS_Store -exec rm {} \;

# Package it.
zip -r jquery-run-sample.zip jquery-run-sample/*
