set MYDIR=%~dp0
node --debug-brk %MYDIR%/../adapt/node/r.js %MYDIR%/build.js %MYDIR% %*
