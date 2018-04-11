#!/bin/bash

source backend/virtualenv/bin/activate

uwsgi --stop tmp/ontask.pid
circusctl quit --waiting

deactivate

echo "---------------------------------"
echo "- Server termination completed. -"
echo "---------------------------------"
