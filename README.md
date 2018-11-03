# OnTask v2.5

## Running the application

### For development
1. Perform the configuration steps outlined [here](#general-configuration)
2. Install [Docker](https://store.docker.com/search?type=edition&offering=community) and [docker-compose](https://docs.docker.com/compose/install/#install-compose)
3. From your terminal, run `docker-compose build` followed by `docker-compose up` in the root OnTask directory
4. If this is the first time running, you must attach to the **backend** container and perform the following:
    - Initialise the relational database structure by running `python manage.py migrate`
    - Create a user by running `python manage.py createsuperuser`
        - Note that only **local** authentication is supported in development mode, which is why the above user is created

### For production
1. Install the system packages required to compile the backend dependencies
    - `sudo yum install python36 python36-setuptools python36-devel` (or equivalent for your OS)
2. Install [MongoDB](https://www.mongodb.com/download-center#community) in which to store application data
3. Install an RDS such as [PostgreSQL](https://www.postgresql.org/download/) or [MySQL](https://dev.mysql.com/downloads/mysql/) in which to store user data
4. Install [RabbitMQ](https://www.rabbitmq.com/download.html) for task scheduling
5. Install the Python3 [virtual environment](https://packaging.python.org/guides/installing-using-pip-and-virtualenv/) module via `python3 -m pip install virtualenv`
6. Clone the OnTask repository to your machine
    - **Note:** all of the below commands should take place within the `ontask/` directory
7. Create a virtual environment in the backend directory by running `virtualenv backend/virtualenv`
    - Note that the virtual environment *must* be called 'virtualenv' and be located in the `backend/` directory, as denoted above
8. Ensure that the following are running as a service:
    - RabbitMQ
    - MongoDB
    - The chosen RDS (e.g. PostgreSQL)
9. Perform the configuration steps outlined [here](#general-configuration) and [here](#additional-configuration-for-production)
10. Compile the frontend files by running `npm install` followed by `npm run build` in the `frontend/` directory
11. Install nginx and configure the `/etc/nginx/nginx.conf` as follows:
```
http {
    sendfile on;

    gzip                    on;
    gzip_http_version       1.0;
    gzip_proxied            any;
    gzip_min_length         500;
    gzip_disable            "MSIE [1-6]\.";
    gzip_types              text/plain text/xml text/css
                            text/comma-separated-values
                            text/javascript
                            application/x-javascript
                            application/atom+xml;

    set $domain YOUR_DOMAIN_NAME;

    server {
        server_name         $domain;
        listen 80;
        return 301 https://$server_name$request_uri;
    }

    server {
        server_name         $domain;
        listen 443;

        ssl on;
        ssl_certificate     YOUR_SSL_CERT_PATH;
                    
        proxy_redirect      off;
        proxy_set_header    Host $host;
        proxy_set_header    X-Real-IP $remote_addr;
        proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Host $server_name;

        root                /var/www/html/ontask/;
        include             /etc/nginx/mime.types;

        location / {
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
            try_files $uri /index.html;
        }

        location ^~ /api/ {
            proxy_pass      http://127.0.0.1:8000/api/;
        }
    }
}
```
12. Reload nginx after updating the configuration file
13. Launch OnTask by running `. ./startup.sh` whilst in the `ontask` directory
    - This script will fail if ran from any other directory
    - The default port used by the backend is `8000`
    - This port can be changed by running `export ONTASK_PORT=YOUR_DESIRED_PORT` prior to running the startup script
        - The proxy_pass in the nginx configuration file will also need to be changed to reflect a different port
    - Log files are located in the `ontask/logs/` directory
14. The application should now be accessible via the domain that was specified in the `nginx` configuration file
15. OnTask can be stopped by running `. ./terminate.sh` whilst in the `ontask` directory


## Configuration

### General configuration
1. Create environment files `dev.py` (for development) and/or `prod.py` (for production) in the `backend/config/` directory
2. Run `pip install cryptography`
3. In a Python shell run the following:
```python
from cryptography.fernet import Fernet
# The following generated secret key will be used for encrypting sensitive data
# Loss or change of the secret key will result in the loss of all datasource passwords
# This is a breaking issue for dynamic data sources, as update attempts will fail
Fernet.generate_key().decode("utf-8")
```
4. Configure the environment file(s) created in step 1 as follows:
```python
SECRET_KEY = 'YOUR_SECRET_KEY' # Generated above

# AWS credentials to allow users to import datasources from S3 buckets
AWS_ACCESS_KEY_ID = 'YOUR_AWS_ACCESS_KEY_ID'
AWS_SECRET_ACCESS_KEY = 'YOUR_AWS_SECRET_ACCESS_KEY'
AWS_REGION = 'ap-southeast-2'

# SMTP credentials to enable email sending from OnTask
SMTP = {
    'HOST': 'YOUR_SMTP_HOST',
    'PORT': 587,
    'USER': 'YOUR_SMTP_USER',
    'PASSWORD': 'YOUR_SMTP_PASSWORD',
    'USE_TLS': True
}
```
5. Create environment files `.env.development` (for development) and/or `.env.production` (for production) in the `frontend/` directory
6. Configure the environment file(s) created in step 5 as follows:
```javascript
REACT_APP_API_DOMAIN = 'YOUR_BACKEND_DOMAIN_NAME' // Including the protocol E.g. "http://localhost:8000/api" for development
REACT_APP_AWS_ID = 'YOUR_AWS_ACCESS_KEY_ID'
```

### Additional configuration for production
- In addition to the previous section, the following parameters **must** also be added to the configuration files:
    - Add to `prod.py` in the `backend/config/` directory:
    ```python
    FRONTEND_DOMAIN = 'https://YOUR_FRONTEND_DOMAIN_NAME' # For whitelisting CORS and authentication, including the protocol (http:// or https://)
    ALLOWED_HOSTS = ['YOUR_FRONTEND_DOMAIN_NAME'] # Note that the URL should be in an array and without the protocol

    # For task scheduling
    CELERY_BROKER_URL = 'amqp://YOUR_RABBITMQ_HOST'

    # For storing user data
    SQL_DATABASE = { 
        # PostgreSQL is only provided as an example
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'YOUR_SQL_DATABASE',
        'USER': 'YOUR_SQL_USER',
        'PASSWORD': 'YOUR_SQL_PASSWORD',
        'HOST': 'YOUR_SQL_HOST',
        'PORT': 'YOUR_SQL_PORT'
    }

    # For storing application data
    NOSQL_DATABASE = {
        'HOST': 'mongodb://YOUR_NOSQL_HOST/',
        'DB': 'YOUR_NOSQL_DATABASE'
    }

    CIPHER_SUITE_KEY = 'YOUR_CIPHER_KEY' # 30 byte secret key for authenticating users from third party IDPs

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
    - Add to `.env.production` in the `frontend/` directory:
    ```javascript
    REACT_APP_AAF_URL = 'YOUR_AAF_LOGIN_URL'
    ```

## Packages Used
### Frontend Dependencies
|Package Name|License|
|---|---|
|React.js|[MIT](https://github.com/facebook/react/blob/master/LICENSE)|
|create-react-app|[MIT](https://github.com/facebook/create-react-app/blob/next/LICENSE)|
|react-router|[MIT](https://github.com/ReactTraining/react-router/blob/master/LICENSE)|
|react-redux|[MIT](https://github.com/reduxjs/redux/blob/master/LICENSE.md)|
|redux-thunk|[MIT](https://github.com/reduxjs/redux-thunk/blob/master/LICENSE.md)|
|Ant Design|[MIT](https://github.com/ant-design/ant-design/blob/master/LICENSE)|
|BizCharts|[MIT](https://github.com/alibaba/BizCharts/blob/master/LICENSE)|
|data-set|[MIT](https://github.com/antvis/data-set/blob/master/LICENSE)|
|Slate|[MIT](https://github.com/ianstormtaylor/slate/blob/master/License.md)
|is-hotkey|[MIT](https://github.com/ianstormtaylor/is-hotkey/blob/master/License.md)|
|react-dnd|[BSD](https://github.com/react-dnd/react-dnd/blob/master/LICENSE)|
|react-draggable|[MIT](https://github.com/mzabriskie/react-draggable/blob/master/LICENSE)|
|lodash|[MIT](https://github.com/lodash/lodash/blob/master/LICENSE)|
|moment|[MIT](https://github.com/moment/moment/blob/develop/LICENSE)|
|query-string|[MIT](https://github.com/sindresorhus/query-string/blob/master/license)|

### Backend Dependencies
|Package Name|License|
|---|---|
|Django|[BSD](https://github.com/django/django/blob/master/LICENSE)|
|djangorestframework|[BSD](https://github.com/encode/django-rest-framework/blob/master/LICENSE.md)|
|mongoengine|[MIT](https://github.com/MongoEngine/mongoengine/blob/master/LICENSE)|
|django-rest-framework-mongoengine|[MIT](https://github.com/umutbozkurt/django-rest-framework-mongoengine/blob/master/LICENSE)|
|django-cors-headers|[License](https://github.com/ottoyiu/django-cors-headers/blob/master/LICENSE)|
|uWSGI|[GPL](https://github.com/unbit/uwsgi/blob/master/LICENSE)|
|requests|[Apache](https://github.com/requests/requests/blob/master/LICENSE)|
|SQLAlchemy|[MIT](https://github.com/zzzeek/sqlalchemy/blob/master/LICENSE)|
|pymongo|[Apache](https://github.com/mher/pymongo/blob/master/LICENSE)|
|pyjwt|[MIT](https://github.com/jpadilla/pyjwt/blob/master/LICENSE)|
|boto3|[Apache](https://github.com/boto/boto3/blob/develop/LICENSE)|
|celery|[BSD](https://github.com/celery/celery/blob/master/LICENSE)|
|django-celery-beat|[BSD](https://github.com/celery/django-celery-beat/blob/master/LICENSE)|
|circus|[Apache](https://github.com/circus-tent/circus/blob/master/LICENSE)|
|cryptography|[Apache/BSD](https://github.com/pyca/cryptography/blob/master/LICENSE)|
|python-dateutil|[Apache](https://github.com/dateutil/dateutil/blob/master/LICENSE)|
|xlrd|[License](https://github.com/python-excel/xlrd/blob/master/LICENSE)|
|numexpr|[MIT](https://github.com/pydata/numexpr/blob/master/LICENSE.txt)|