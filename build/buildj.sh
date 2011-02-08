#!/bin/sh

MYDIR=`cd \`dirname "$0"\`; pwd`
$MYDIR/../bin/xj $MYDIR/build.js "$@"
