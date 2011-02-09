set MYDIR=%~dp0
node --debug-brk %MYDIR%x.js %MYDIR% %*
