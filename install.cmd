@echo off

echo node.js:
cmd /c node --version
echo npm:
cmd /c npm --version

echo.
echo ===================
echo Server installation
pause
cd server
cmd /c npm install
cd ..

echo.
echo ===================
echo Client installation
pause
cd client
cmd /c npm install
cd ..
pause

echo.
echo ===================
echo Done
echo on
