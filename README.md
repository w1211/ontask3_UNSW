# onTask v2.5

## Initial setup
1. Run `xcode-select --install` (Mac OS) or `sudo apt-get install build-essential` (Linux)
2. Install MongoDB
3. Set up & run a Python3 [virtual environment](https://packaging.python.org/guides/installing-using-pip-and-virtualenv/)
    - Always ensure that you are in the created virtual environment when running the backend or performing these initial setup steps
4. Run `pip3 install -r backend/requirements.txt`
5. Create a django super user by running `python3 backend/manage.py createsuperuser`
6. Create environment files `dev.py` and `prod.py` in `backend/config`
7. In a Python shell, run the following:
```python
from cryptography.fernet import Fernet
# This key will be stored as DATASOURCE_SECRET in the config files
# Generate two keys: one for development and the other for production
# BE CAREFUL! Modifying or losing the key will make it impossible to unencrypt any datasource db passwords stored
# I.e. major data loss, as users will be forced to re-enter their passwords for every data source
Fernet.generate_key()
```
8. Provide environment variables for each environment file (created in step 5) as follows:
```python
SECRET_KEY = '' # https://docs.djangoproject.com/en/1.11/ref/settings/#secret-key
DATASOURCE_KEY = '' # Used for encrypting datasource db passwords, generated in step 6
ALLOWED_HOSTS = ['localhost'] # https://docs.djangoproject.com/en/1.11/ref/settings/#allowed-hosts
SQL_DATABASE = { # https://docs.djangoproject.com/en/1.11/ref/settings/#databases
  'ENGINE': '',
  'NAME': ''
}
NOSQL_URI = '' # Connection string e.g. 'mongodb://localhost/dbname'
```

## Running the application
1. Ensure that the virtual environment in which the backend python dependencies were installed is currently active
2. Start the backend by running `python3 backend/manage.py runserver`
3. Ensure that the frontend dependencies are installed by changing the working directory to `frontend` and running `npm install`
4. Start the frontend `npm start` while in the `frontend` working directory

## Development
1. Download and install [postgresql](https://www.postgresql.org/)
2. Create a postgresql database with name `ontask_seed` by running `createdb ontask_seed`
3. Create a postgresql user with name `ontask` by running `createuser ontask --password`
4. Store the created user's password in the `PASSWORD` variable in `dev/seed.py`
5. Run `pip3 install -r dev/requirements.txt`
6. Seed data using by running `python3 dev/seed.py`
    - Now there is a populated database with which we can create our first data sources & workflows
7. Add `export DJANGO_DEVELOPMENT=true` to your `~/.bash_profile` (Mac OS) or `~/.bashrc` (Linux)
8. Run `python3 backend/manage.py runserver`

## Production
- https://docs.djangoproject.com/en/1.11/howto/deployment/checklist/