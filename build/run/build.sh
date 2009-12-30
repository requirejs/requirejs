#!/bin/sh
rm -rf ./build/
../runbuild.sh run.build.js
find ./build/ -name "*.js" -exec cp {} {}z \;
find ./build/ -name "*.jsz" -exec gzip {} \;
