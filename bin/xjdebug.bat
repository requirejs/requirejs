set MYDIR=%~dp0
java -classpath %MYDIR%..\build\lib\rhino\js.jar org.mozilla.javascript.tools.debugger.Main %MYDIR%x.js %MYDIR% %*
