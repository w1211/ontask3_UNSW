# onTask v2.5

## Initial setup
1. Run `xcode-select --install` (Mac OS) or `sudo apt-get install build-essential` (Linux)
2. Set up & run a Python [virtual environment](https://packaging.python.org/guides/installing-using-pip-and-virtualenv/)
    - Always ensure that you are in the created virtual environment when running the backend or performing these initial setup steps
3. Run `pip install -r backend/requirements.txt`
4. Create a django super user by running `python backend/manage.py createsuperuser`
5. Create environment files `dev.py` and `prod.py` in `backend/config`
6. In a Python shell, run the following:
```python
from cryptography.fernet import Fernet
# This key will be stored as DATASOURCE_SECRET in the config files
# Generate two keys: one for development and the other for production
# BE CAREFUL! Modifying or losing the key will make it impossible to unencrypt any datasource db passwords stored
# I.e. major data loss, as users will be forced to re-enter their passwords for every data source
Fernet.generate_key()
```
7. Provide environment variables for each file as follows:
```python
SECRET_KEY = '' # https://docs.djangoproject.com/en/1.11/ref/settings/#secret-key
DATASOURCE_SECRET = '' # Used for encrypting datasource db passwords, generated in step 6
ALLOWED_HOSTS = [''] # https://docs.djangoproject.com/en/1.11/ref/settings/#allowed-hosts
SQL_DATABASE = { # https://docs.djangoproject.com/en/1.11/ref/settings/#databases
  'ENGINE': '',
  'NAME': ''
}
NOSQL_URI = '' # Connection string e.g. 'mongodb://localhost/dbname'
```

## Development
1. Download and install [postgresql](https://www.postgresql.org/)
2. Create a postgresql database with name `ontask_seed` by running `createdb ontask_seed`
3. Create a postgresql user with name `ontask` by running `createuser ontask --password`
4. Store the created user's password in the `PASSWORD` variable in `dev/seed.py`
5. Run `pip install -r dev/requirements.txt`
6. Seed data using by running `python dev/seed.py`
    - Now there is a populated database with which we can create our first data sources & matrices
7. Add `export DJANGO_DEVELOPMENT=true` to your `~/.bash_profile` (Mac OS) or `~/.bashrc` (Linux)
8. Run `python backend/manage.py runserver`

### Example API interactions
Examples are provided for use with [Postman](https://www.getpostman.com/). To get started:
1. Import the API requests into Postman from `dev/postman.json`
2. Configure the "token" [environment variable](https://www.getpostman.com/docs/postman/environments_and_globals/manage_environments) in Postman as one of the authenticated user's tokens 
    - Tokens can be created/viewed via Django admin page
3. Modify the API calls to refer to the IDs of documents created in the dev NOSQL database


## Production
- https://docs.djangoproject.com/en/1.11/howto/deployment/checklist/