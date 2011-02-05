#!/bin/sh

MYDIR=`cd \`dirname "$0"\`; pwd`
node $MYDIR/../adapt/r.js $MYDIR/build.js $MYDIR "$@"
