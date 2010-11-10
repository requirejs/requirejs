set MYDIR=%~dp0
java -classpath %MYDIR%/lib/rhino/js.jar;%MYDIR%/lib/closure/compiler.jar org.mozilla.javascript.tools.debugger.Main %MYDIR%/build.js %MYDIR% %*
