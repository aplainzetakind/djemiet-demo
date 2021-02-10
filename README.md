# cemiyet #
#### A tool for communities ####

### Getting set-up ###

* Obtain Python 3.8.x
* Run `$ pip3.8 install --user pipenv`. This will install `pipenv` in `~/.local/bin`. Make sure it's in your `$PATH`.
* Clone the repo
* Go to the project root. Run `pipenv install`. This should install the dependencies (`django` and `psycopg2`) in a virtual environment. You will likely be missing some build dependencies for `psycopg`. Read here to install them on your system (scroll down to Build prequisites): https://www.psycopg.org/docs/install.html
* Install postgresql and postgresl-client if you're running a Debian-based linux distro. Otherwise, figure out the corresponding package names on your system.
* Running `# su - postgres` will switch you to the user `postgres` (a privileged user with access to all postgresql databases). As `postgres`, run `psql`. This will drop you into the postgressql shell.
* Follow the instructions under the heading _Create A PostgreSQL User and Database_ here: https://djangocentral.com/using-postgresql-with-django/ for the username `cemiyet`, databasename `cemiyetdb` and password `sibercan` (these values can be found in `cemiyet/cemiyet/settings.py` in the value of the constant `DATABASES`).
* If everything went well, the django app should be able to talk to the database. Go to the project root and issue `$ pipenv shell`. This will drop you into a virtual environment shell. Chenge to the directory `cemiyet`, where `manage.py` lives. Run `$ python manage.py migrate`. This should do some stuff, which, if completed without errors, should mean that django can talk to your database. To verify this, swith to the `postgres` user as you did before on another terminal, __not from the virtual environment__, and drop to the postgresql shell as you did before. There, the command `\c cemiyetdb` followed by `\d` should show you some django-related stuff. This means all is good.
* Run (from the python virtual environment) `$ python manage.py runserver`. This should serve the site, which you should be able to access from your browser at `127.0.0.1:8000`. This local site should be enough for development.
* Make yourself a branch and think of something to do. Push to your branch when you complete something.
