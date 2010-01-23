#!/bin/sh
rm -rf ./build/
../build.sh require.build.js
find ./build/ -name "*.js" -exec cp {} {}z \;
find ./build/ -name "*.jsz" -exec gzip {} \;
