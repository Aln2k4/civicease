@echo off
echo Starting client > client_log.txt
npm run dev >> client_log.txt 2>&1
