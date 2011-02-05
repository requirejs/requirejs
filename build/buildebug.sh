#!/bin/sh

MYDIR=`cd \`dirname "$0"\`; pwd`
node --debug-brk $MYDIR/../adapt/node/r.js debug $MYDIR/build.js $MYDIR "$@"
