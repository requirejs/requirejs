set MYDIR=%~dp0
java -classpath %MYDIR%..\build\lib\rhino\js.jar org.mozilla.javascript.tools.shell.Main %MYDIR%x.js %MYDIR% %*
