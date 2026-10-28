#!/bin/sh
pkill -f "node server/index.js"
sleep 1
cd /home/tilux/Documents/star-gold-limited
setsid nohup node server/index.js > /tmp/sg.log 2>&1 < /dev/null &
