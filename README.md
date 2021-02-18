# cemiyet #
_A tool for communities_

### Getting set-up ###

* Obtain Python 3.8.x
* Run `$ pip3.8 install --user pipenv`. This will install `pipenv` in `~/.local/bin`. Make sure it's in your `$PATH`.
* Clone the repo
* Go to the project root. Run `pipenv install`. This should install the dependencies (`django` and `psycopg2`) in a virtual environment. You will likely be missing some build dependencies for `psycopg`. Read here to install them on your system (scroll down to Build prequisites): https://www.psycopg.org/docs/install.html
* Install postgresql and postgresl-client if you're running a Debian-based linux distro. Otherwise, figure out the corresponding package names on your system.
* Running `# su - postgres` will switch you to the user `postgres` (a privileged user with access to all postgresql databases). As `postgres`, run `psql`. This will drop you into the postgressql shell.
* Follow the instructions under the heading _Create A PostgreSQL User and Database_ here: https://djangocentral.com/using-postgresql-with-django/ for the username `cemiyet`, databasename `cemiyetdb` and password `sibercan` (these values can be found in `cemiyet/cemiyet/settings.py` in the value of the constant `DATABASES`). If you want to use your own values, look into the usage of the `local_settings.py` file (it will be `.gitignore`d), for instance here: https://stackoverflow.com/questions/4909958/django-local-settings .
* If everything went well, the django app should be able to talk to the database. Go to the project root and issue `$ pipenv shell`. This will drop you into a virtual environment shell. Chenge to the directory `cemiyet`, where `manage.py` lives. Run `$ python manage.py migrate`. This should do some stuff, which, if completed without errors, should mean that django can talk to your database. To verify this, swith to the `postgres` user as you did before on another terminal, __not from the virtual environment__, and drop to the postgresql shell as you did before. There, the command `\c cemiyetdb` followed by `\d` should show you some django-related stuff. This means all is good.
* Run (from the python virtual environment) `$ python manage.py runserver`. This should serve the site, which you should be able to access from your browser at `127.0.0.1:8000`. This local site should be enough for development.
* Make yourself a branch and think of something to do. Push to your branch when you complete something.

### Convenience ###
* Add the line `213.164.205.34  cemiyet.vps` to `/etc/hosts`. This will allow you to use `http://cemiyet.vps` in the browser to access the live site or to `$ ssh <username>@cemiyet.vps`. If you use any other name than `cemiyet.vps`, the site won't respond, because the name is in the configuration of the server.

### Version history ###
(None) Out of the box Django installation with database setting changes.

### TODO ###
Have an authentication wall before accessing a static welcome page.

### Docker ###
Postgres : 
- Create dir for persistence data ($HOME/django/postgres/data)
- Run command : 
docker run --rm  --name pg -p 5432:5432 -e POSTGRES_PASSWORD=XXX -e POSTGRES_USER=XXX -e POSTGRES_DB=XXX -v $HOME/django/postgres/data:/var/lib/postgresql/data postgres

# Sample local_settings.py(located at the level of manage.py)
DEBUG = True
ALLOWED_HOSTS = ['localhost','0.0.0.0','127.0.0.1']
