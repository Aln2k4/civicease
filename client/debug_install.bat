@echo off
echo Starting debug > debug_test.txt
echo Current dir: %CD% >> debug_test.txt
npm install tailwindcss-animate >> debug_test.txt 2>&1
echo npm finished with code %ERRORLEVEL% >> debug_test.txt
