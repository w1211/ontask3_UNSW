# onTask v2.5

## Initial setup
1. Set up & run a python [virtual environment](https://packaging.python.org/guides/installing-using-pip-and-virtualenv/)
    - Ensure that you are in a virtual environment whenever trying to run the server
2. Pip install `backend/requirements.txt`
3. Create a django super user by running `python backend/manage.py createsuperuser`
4. Create environment files `dev.py` and `prod.py` in `backend/config`
5. Provide environment variables for each file as follows:
```python
SECRET_KEY = '' # https://docs.djangoproject.com/en/1.11/ref/settings/#secret-key
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