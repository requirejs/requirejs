set MYDIR=%~dp0
java -classpath %MYDIR%..\build\lib\rhino\js.jar;%MYDIR%..\build\lib\closure\compiler.jar org.mozilla.javascript.tools.shell.Main %MYDIR%x.js %MYDIR% %*
