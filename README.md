# onTask v2.5

## Getting Started
### Dependencies
1. Install the system packages required to compile dependencies
    - Mac OS
        - `xcode-select --install`
    - CentOS 
        - `sudo yum install python36`
        - `sudo yum install python36-setuptools`
        - `sudo yum install python36-devel`
2. Install MongoDB in which to store application data
3. Install an RDS such as PostgreSQL or MySQL in which to store user data
4. Install the Python3 [virtual environment] module(https://packaging.python.org/guides/installing-using-pip-and-virtualenv/) module by `python3 -m pip install virtualenv`
5. Set up & run a Python3 virtual environment
    - Ensure the virtual environment is active during the next step and whilst attempting to serve the backend server
6. Run `pip3 install -r backend/requirements.txt`

### Configurations
1. Create a django super user by running `python3 backend/manage.py createsuperuser`
2. Create environment files `dev.py` (for development) and/or `prod.py` (for production) in `backend/config`
3. In a Python shell, run the following:
```python
from cryptography.fernet import Fernet
# The following generated secret key will be used for encrypting sensitive data
# Loss or change of the secret key will result in the loss of all datasource passwords
# This is a breaking issue for dynamic data sources, as update attempts will fail
Fernet.generate_key()
```
4. Configure the environment file(s) created in step 2 as follows:
```python
# Example configurations are provided for each attribute
FRONTEND_DOMAIN = 'YOUR_FRONTEND_DOMAIN_NAME' # For whitelisting CORS and authentication
ALLOWED_HOSTS = ['localhost', 'https://YOUR_DOMAIN_NAME']

SECRET_KEY = 'YOUR_SECRET_KEY' # Generated in step 3
CIPHER_SUITE_KEY = 'YOUR_CIPHER_KEY' # 30 byte secret key for authenticating users from third party IDPs

SQL_DATABASE = { # For storing user data
    'ENGINE': 'django.db.backends.postgresql',
    'NAME': 'ontask',
    'USER': 'ontask',
    'PASSWORD': 'YOUR_PASSWORD',
    'HOST': '127.0.0.1',
    'PORT': '5432'
}
NOSQL_URI = 'mongodb://localhost/ontask' # For storing application data

# Configuration for AAF Rapid Connect
AAF_CONFIG = {
   'secret_key': 'YOUR_SECRET_KEY',
   'aaf.edu.au': {
       'iss': 'https://rapid.aaf.edu.au',
       'aud': 'https://YOUR_DOMAIN_NAME',
       'idp': 'https://rapid.aaf.edu.au/jwt/authnrequest/research/YOUR_REQUEST_ID'
       },
   'role_mappings': {
           'staff': ['staff@sydney.edu.au', 'faculty@unisa.edu.au', 'staff@unsw.edu.au'],
           'student': ['student@unsw.edu.au']
       },
   'AAF_DEFAULT_PASSWORD': 'YOUR_DEFAULT_PASSWORD'
}

# Configuration for LTI
LTI_CONFIG = {
   'role_mappings': {
           'staff': ['Instructor'],
           'student': ['Student']
       }
}
```
5. Create environment files `.env.development` (for development) and/or `.env.production` (for production) in `frontend`
6. Configure the environment file(s) created in step 5 as follows:
```javascript
REACT_APP_API_DOMAIN = 'YOUR_BACKEND_DOMAIN_NAME'
```

### Development
1. Download and install [postgresql](https://www.postgresql.org/)
2. Create a postgresql database with name `ontask_seed` by running `createdb ontask_seed`
3. Create a postgresql user with name `ontask` by running `createuser ontask --password`
4. Store the created user's password in the `PASSWORD` variable in `dev/seed.py`
5. Run `pip3 install -r dev/requirements.txt`
6. Seed data using by running `python3 dev/seed.py`
    - The postgresql database created in step 2 has been given seed data
    - An example csv file has been created at `/dev/students.csv`
7. Add `export DJANGO_DEVELOPMENT=true` to your `~/.bash_profile` (Mac OS) or `~/.bashrc` (Linux)

## Running the application
### For development
1. Ensure that the virtual environment in which the backend python dependencies were installed is currently active
2. Start the backend by running `python3 backend/manage.py runserver`
3. Ensure that the frontend dependencies are installed by changing the working directory to `frontend` and running `npm install`
4. Start the frontend by running `npm start` while in the `frontend` working directory

### For production
1. Clone the repository to your server and perform the setup steps outlined above
2. Ensure that MongoDB is running as a service
3. Ensure that the RDS chosen for storing user data is running as a service
4. Build the frontend into production files by running `npm build` in the `frontend` working directory
5. (?) Copy the files from the newly created `frontend/build` directory to `/var/www/html/ontask`
6. Run the backend as a service
7. nginx config

```
http {
    sendfile on;

    gzip              on;
    gzip_http_version 1.0;
    gzip_proxied      any;
    gzip_min_length   500;
    gzip_disable      "MSIE [1-6]\.";
    gzip_types        text/plain text/xml text/css
                      text/comma-separated-values
                      text/javascript
                      application/x-javascript
                      application/atom+xml;

    server {
        server_name uat-ontask2.teaching.unsw.edu.au;
        listen 443;

        ssl on;
        ssl_certificate /home/ec2-user/Ontask/SSL/uat-ontask2_teaching_unsw_edu_au.crt;
                    
        proxy_redirect      off;
        proxy_set_header    Host $host;
        proxy_set_header    X-Real-IP $remote_addr;
        proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Host $server_name;

        root /var/www/html/ontask/;
        include /etc/nginx/mime.types;

        location ~ ^/api/(.*)$ {
            proxy_pass http://127.0.0.1:8000/api/$1;
        }

        location ~ ^/user/(.*)$ {
            proxy_pass http://127.0.0.1:8000/api/user/$1;
        }
    }
}
```