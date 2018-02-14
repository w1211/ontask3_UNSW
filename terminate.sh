#!/bin/bash

uwsgi --stop tmp/ontask.pid
uwsgi --stop tmp/scheduler.pid

echo "---------------------------------"
echo "- Server termination completed. -"
echo "---------------------------------"