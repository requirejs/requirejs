#!/bin/sh
rm -rf ./build/
export OPTIMIZE=none

../build.sh baseUrl=../.. name=require includeRequire=true out=build/require.js optimize=$OPTIMIZE
../build.sh baseUrl=../.. name=require includeRequire=true include=i18n,text,order, out=build/allplugins-require.js optimize=$OPTIMIZE

find ./build/ -name "*.js" -exec cp {} {}z \;
find ./build/ -name "*.jsz" -exec gzip {} \;
