#!/bin/bash

source virtualenvs/backend/bin/activate
pip3 install -r backend/requirements.txt
uwsgi --ini backend/uwsgi.ini
deactivate

if [ "$ONTASK_DEVELOPMENT" = "true" ]
then
    npm start --prefix frontend
else
    npm install --prefix frontend
    npm run build --prefix frontend
    sudo rm -rf /var/www/html/ontask
    sudo mv frontend/build /var/www/html/ontask

    echo "-------------------------------------------------------------------"
    echo "- Servers are now running. To terminate, enter '. ./terminate.sh' -"
    echo "-------------------------------------------------------------------"
fi
