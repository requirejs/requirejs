#!/bin/sh

MYDIR=`cd \`dirname "$0"\`; pwd`
$MYDIR/../bin/xdebug $MYDIR/build.js "$@"
