set MYDIR=%~dp0
java -classpath %MYDIR%..\build\lib\rhino\js.jar;%MYDIR%..\build\lib\closure\compiler.jar org.mozilla.javascript.tools.debugger.Main %MYDIR%x.js %MYDIR% %*
