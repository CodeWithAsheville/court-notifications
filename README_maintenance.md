# Maintaining the System

## Upgrade the Postgres DB
Assume the existing database is called _postgresql-horizontal-343434_.
```
  heroku login
  heroku addons:create -a bc-court-reminders heroku-postgresql:standard-0
  ```
  This will create a new database instance, for example _postgresql-triangular-121212_.
  ```
  heroku pg:wait -a bc-court-reminders 
  heroku maintenance:on -a bc-court-reminders
  heroku pg:copy -a bc-court-reminders postgresql-horizontal-343434 postgresql-triangular-121212
  heroku pg:promote -a bc-court-reminders postgresql-triangular-121212
  <UPDATE ALL THE ENVIRONMENT VARIABLES>
  heroku maintenance:off -a bc-court-reminders
  heroku addons:destroy -a bc-court-reminders-dev postgresql-horizontal-343434
```
Then set up daily backups:
```
  heroku pg:backups:schedule -a bc-court-reminders --at '03:00 America/New_York'
  heroku pg:backups -a bc-court-reminders
```



