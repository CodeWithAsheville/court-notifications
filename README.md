# Court Notifications
A project through Code for Asheville to help streamline the process to sign up for court date notifications.

Supposedly online at [https://code-4-avl-court-notifications.herokuapp.com/](https://code-4-avl-court-notifications.herokuapp.com/), but probably crashed already.

## Getting Started

[TODO] Add environment notes (postgres version, nvm, etc)

First, setup your environment variables before attempting to run the app

```
cp .env .env.sample
```

You will need to modify several variables, including the password and username that match your local database, the Twilio account sid, auth token and phone number for your personal Twilio account (see below), and your personal number for local testing.

```
npm install
npm install -g knex
createdb court-notifications
knex migrate:latest
npm run dev
```



## Setting Up Twilio For Local Testing
You will need your own account for dev testing. Create a Twilio account and generate a phone number. Ensure you add these values to your local .env file.

The gist is that you'll need to expose your localhost via ngrok, and setup your Twilio number to respond to incoming messages via webhook. Twilio posts to the `/sms` endpoint in `app.js`, which allows you to handle their incoming webhooks.

Follow the instructions [here](https://www.twilio.com/docs/sms/tutorials/how-to-receive-and-reply-node-js#generating-twiml-in-your-web-application)

Download and install [ngrok](https://www.twilio.com/blog/2015/09/6-awesome-reasons-to-use-ngrok-when-testing-webhooks.html)

## Setting up Twilio in Production
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
