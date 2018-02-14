#!/bin/bash

source virtualenvs/backend/bin/activate
uwsgi --stop tmp/ontask.pid
uwsgi --stop tmp/scheduler.pid
deactivate

echo "---------------------------------"
echo "- Server termination completed. -"
echo "---------------------------------"