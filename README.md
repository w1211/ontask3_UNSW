# onTask v2.5

## Initial setup
1. Set up & run python [virtual environment](https://packaging.python.org/guides/installing-using-pip-and-virtualenv/)
2. Pip install `backend/requirements.txt`
3. Create django super user in terminal

## Postman
- Example API requests can be made via [Postman](https://www.getpostman.com/)
- Import the routes from `dev/postman.json`


<!-- 4. Create file `backend/app/config.py` with settings like:
```
SECRET_KEY = secret
ALLOWED_HOSTS = []
Database connection settings
Auth types
```

## For development
1. Create ~/.bashrc
2. Add line `export DJANGO_DEVELOPMENT=true`
3. Seed data 
  - Specify the dev db in `backend/data/seed.py`
  - Run `seed.py` in python shell -->