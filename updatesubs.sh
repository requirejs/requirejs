#!/bin/bash

# This script updates the sub projects that depend on the main requirejs
# project. It is assumed the sub projects are siblings to this project
# the the names specified below.

echo "Updating r.js"
cp require.js ../r.js/require.js
cd ../r.js
node dist.js
cd ../requirejs

# The CoffeeScript loader plugin and example
echo "CoffeeScript plugin"
cp require.js ../require-cs/require.js

# The RequireJS+jQuery sample project.
echo "Updating jQuery sample project"
cp require.js ../require-jquery/parts/require.js
cd ../require-jquery/parts
./update.sh
cd ../../requirejs
