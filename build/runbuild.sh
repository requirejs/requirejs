#!/bin/sh

java -classpath lib/rhino/js.jar:lib/closure/compiler.jar org.mozilla.javascript.tools.shell.Main runbuild.js "$@"
