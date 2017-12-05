# onTask v2.5

## Initial setup
1. Set up & run a python [virtual environment](https://packaging.python.org/guides/installing-using-pip-and-virtualenv/)
2. Pip install `/backend/requirements.txt`
3. Create django super user in terminal
4. Create environment files in `/backend/config` as `dev.py` and `prod.py`
5. Provide environment variables for each file as follows:
```python
SECRET_KEY = ''
ALLOWED_HOSTS = ['']
SQL_DATABASE = {
  'ENGINE': '',
  'NAME': ''
}
NOSQL_URI = '' # Connection string e.g. 'mongodb://localhost/dbname'
```

## Development
1. Seed data using `to be done`
2. Add `export DJANGO_DEVELOPMENT=true` to your `~/.bash_profile` (Mac OS) or `~/.bashrc` (Linux)

### Example API interactions
Examples are provided for use with [Postman](https://www.getpostman.com/). To get started:
1. Import the API requests into Postman from `/dev/postman.json`
2. Configure the token variable as one of the authenticated user's tokens 
    - Tokens can be created/viewed via Django admin page
3. Modify the API calls to refer to the IDs of documents created in the dev NOSQL database


## Production
- https://docs.djangoproject.com/en/1.11/howto/deployment/checklist/