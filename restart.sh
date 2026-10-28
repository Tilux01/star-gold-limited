#!/bin/sh
cd "$(dirname "$0")" || exit 1
fuser -k 4100/tcp >/dev/null 2>&1
sleep 1
setsid nohup node server/index.js > /tmp/sg.log 2>&1 &
sleep 6
cat /tmp/sg.log
