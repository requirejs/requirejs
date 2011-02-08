#!/bin/sh

MYDIR=`cd \`dirname "$0"\`; pwd`
$MYDIR/../bin/xjdebug $MYDIR/build.js "$@"
