#!/bin/sh

MYDIR=`cd \`dirname "$0"\`; pwd`
node --debug-brk $MYDIR/convert/node/r.js debug $MYDIR/build.js $MYDIR "$@"
