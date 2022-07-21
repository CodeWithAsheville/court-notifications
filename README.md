# Court Notifications
A project through Code for Asheville to help streamline the process to sign up for court date notifications.

Production instance online at [https://buncombenc.courtdates.org/](https://buncombenc.courtdates.org/). 

Staging instance online at [https://bc-court-reminders-dev.herokuapp.com/](https://bc-court-reminders-dev.herokuapp.com/).

We maintain three active branches: 
- main (auto-deployed to production instance)
- staging (autodeployed to staging instance)
- development (default branch where changes are accepted for eventual deployment to staging and then production)

Standard development approach is to fork this repository and work in a branch off the latest version of development. When ready, submit a pull request into development for review.

## Getting Started with Local Development

You will need to install ```node``` and ```yarn```. As of this writing we are on Node 16, but you can check the latest requirement by looking at the _engine_ in ```package.json``` in the top-level directory.

### Initial Build
To verify that you are able to build and run the front-end, run the following commands, starting in the top-level directory:

````
cp packages/server/sample.env packages/server/.env
yarn && yarn dev
````

This will bring up the main page of the site and should allow you to perform a by-name search. Any further steps require setting up connections to a database and to a Twilio account (you will need to re-run ```yarn dev``` after changing any environment variables).

### Set Up a Database Connection
The court notifications system assumes the use of PostgreSQL. As of this writing the production instance is running on version 13. Once you have a PostgreSQL instance ready, edit the ```packages/server/.env``` and set the ```DB_USER```,```DB_PASSWORD```, ```DB_HOST```, and ```DATABASE_NAME``` environment variables. If you are setting up a production instance you should change ```DB_CRYPTO_SECRET```, but you can leave as is for development.

If the database has been set up for the first time, you need to create the database and initialize tables by running

````
createdb court-notifications      # This assumes you have PostgreSQL installed locally
yarn dlx knex migrate:latest
````

At this point you should be able to actually subscribe, although no text messages will be sent without setting up Twilio.

### Set Up Twilio to Send Text Messages

You will need to modify several variables, including the password and username that match your local database, the Twilio account sid, auth token and phone number for your personal Twilio account (see below), and your personal number for local testing.


### Setting Up Twilio For Local Testing
You will need your own account for dev testing. Create a Twilio account and generate a phone number. Ensure you add these values to your local .env file.

The gist is that you'll need to expose your localhost via ngrok, and set up your Twilio number to respond to incoming messages via webhook. Twilio posts to the `/sms` endpoint in `app.js`, which allows you to handle their incoming webhooks.

Follow the instructions [here](https://www.twilio.com/docs/sms/tutorials/how-to-receive-and-reply-node-js#generating-twiml-in-your-web-application)

Download and install [ngrok](https://www.twilio.com/blog/2015/09/6-awesome-reasons-to-use-ngrok-when-testing-webhooks.html)

## Heroku Production Setup

### Create the Application

In the Heroku console, create a new app. In the _Deploy_ tab, select Github as the deployment method, connect to Github, select the court-notifications repository, and click _Connect_. In the next section, select the branch to be used for automatic deployment. For production it will be _main_.

### Add a Database

In the _Resources_ tab, search for and add the _Heroku Postgres_ add-on. Go to the add-on's _Settings_ tab and click _View Credentials_ to obtain the database host, name, user and password. You will need them to set the appropriate environment variables in the application.

First, though, you will need to initialize the database. Set the database-related environment variables (DB_USER, DB_PASSWORD, DB_HOST, DATABASE_NAME, DB_POOL_MIN, DB_POOL_MAX, DB_MIGRATIONS_TABLE) and make sure that you have _knexjs_ installed, then run:
```
knex migrate:latest
```
This will create all the tables in the new Postgres database.

### Set Environment Variables
In the _Settings_ tab of the application, click _Reveal Config Vars_. Initially the only variable will be the ```DATABASE_URL``` set automatically when you install the Postgres add-on. 

Add all of the environment variables listed in the _.env.sample_ file, making sure that you change ```NODE_ENV``` to ```production``` (this is required for the node server to serve static pages).

### Deploy
The application has been set to redeploy when changes are committed to the selected branch of the repository, but you will need to do it manually the first time. Go to the _Settings_ tab, scroll to the bottom, and press _Deploy Branch_ under _Manual Deploy_. This will take a few minutes.

### Set Up Scheduled Jobs
In the _Resources_ tab of the application, search for and add the _Heroku Scheduler_ add-on. Go to the add-on and click _Add Job_ to add a scheduled task. You will need to create three jobs:
- Purge expired jobs and generate a list of defendents due for updates
  - Command: ```node packages/server/scripts/purge-and-update-subscriptions.js```
  - Schedule: Once per day
- Update defendant cases. Cases are drawn from a table populated by the previous command and run a few at a time (the value of _updates_per_call_ in the _cn_configuration_ table).
  - Command ```node packages/server/scripts/update_defendants.js```
  - Schedule: Once every 10 minutes
- Send notifications. Notifications are configured in the _notify_configuration_ table. A configuration consists of the number of days prior to the court date that the notifications hould be sent and the text of the notification (i.e., you may send distinct reminders 7 days, 3 days and 1 day before the date, for example). The notification text may contain variables enclosed in {{_variable_name_}}. Allowed variables are name and date. Case information will be added automatically.
  - Command ```node packages/server/scripts/notify.js```
  - Schedule: Once per day _after_ purge




### Setting up Twilio in Production
Once you have created a Twilio account, you will need to add the Twilio environment variables (see .env file) as environment variables in your hosting provider.

## Planning Notes

If we want to run on Lambda, check out [this article](https://aws.amazon.com/blogs/compute/going-serverless-migrating-an-express-application-to-amazon-api-gateway-and-aws-lambda/).

To use Postgres only while developing (on Mac), install using Homebrew and use:
```
   pg_ctl -D /opt/homebrew/var/postgres start
   pg_ctl -D /opt/homebrew/var/postgres stop
```

## Contributing

When contributing to this repository, please first discuss the change you wish to make via issue,
email, or any other method with the owners of this repository before making a change. 

Please note we have a code of conduct, please follow it in all your interactions with the project.

### Pull Request Process

1. Create a branch, and issue your pull request against the main branch
2. Fill out the pull request template 
3. Link the issue to your pull request in the sidebar
4. Someone will review your PR and move it along in the process, either providing feedback or accepting the changes.

## Code of Conduct

### Our Pledge

In the interest of fostering an open and welcoming environment, we as
contributors and maintainers pledge to making participation in our project and
our community a harassment-free experience for everyone, regardless of age, body
size, disability, ethnicity, gender identity and expression, level of experience,
nationality, personal appearance, race, religion, or sexual identity and
orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment
include:

* Using welcoming and inclusive language
* Being respectful of differing viewpoints and experiences
* Gracefully accepting constructive criticism
* Focusing on what is best for the community
* Showing empathy towards other community members

Examples of unacceptable behavior by participants include:

* The use of sexualized language or imagery and unwelcome sexual attention or
advances
* Trolling, insulting/derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information, such as a physical or electronic
  address, without explicit permission
* Other conduct which could reasonably be considered inappropriate in a
  professional setting

### Our Responsibilities

Project maintainers are responsible for clarifying the standards of acceptable
behavior and are expected to take appropriate and fair corrective action in
response to any instances of unacceptable behavior.

Project maintainers have the right and responsibility to remove, edit, or
reject comments, commits, code, wiki edits, issues, and other contributions
that are not aligned to this Code of Conduct, or to ban temporarily or
permanently any contributor for other behaviors that they deem inappropriate,
threatening, offensive, or harmful.

### Scope

This Code of Conduct applies both within project spaces and in public spaces
when an individual is representing the project or its community. Examples of
representing a project or community include using an official project e-mail
address, posting via an official social media account, or acting as an appointed
representative at an online or offline event. Representation of a project may be
further defined and clarified by project maintainers.

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported by contacting the project team at [INSERT EMAIL ADDRESS]. All
complaints will be reviewed and investigated and will result in a response that
is deemed necessary and appropriate to the circumstances. The project team is
obligated to maintain confidentiality with regard to the reporter of an incident.
Further details of specific enforcement policies may be posted separately.

Project maintainers who do not follow or enforce the Code of Conduct in good
faith may face temporary or permanent repercussions as determined by other
members of the project's leadership.

### Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage], version 1.4,
available at [http://contributor-covenant.org/version/1/4][version]

[homepage]: http://contributor-covenant.org
[version]: http://contributor-covenant.org/version/1/4/
