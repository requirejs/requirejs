#!/bin/sh

MYDIR=`cd \`dirname "$0"\`; pwd`
node $MYDIR/convert/node/r.js $MYDIR/build.js $MYDIR "$@"
