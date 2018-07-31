#!/bin/bash

source backend/virtualenv/bin/activate
pip3 install -r backend/requirements.txt

uwsgi --ini backend/uwsgi.prod.ini

if [ "$ONTASK_DEMO" = "true" ]
then
    sudo rm -rf /var/www/html/ontask_demo
    sudo cp -R frontend/build /var/www/html/ontask_demo
else
    circusd backend/circus.prod.ini --daemon
    sudo rm -rf /var/www/html/ontask
    sudo cp -R frontend/build /var/www/html/ontask

    echo "-------------------------------------------------------------------"
    echo "- Servers are now running. To terminate, enter '. ./terminate.sh' -"
    echo "-------------------------------------------------------------------"
fi

deactivate
