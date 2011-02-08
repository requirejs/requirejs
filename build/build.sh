#!/bin/sh

MYDIR=`cd \`dirname "$0"\`; pwd`
$MYDIR/../bin/x $MYDIR/build.js "$@"
