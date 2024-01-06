# Court Reminders Change Log
## 2.0.0 - In Progress
- Upgraded Node to 18.19.x
- Added a note about installing Node and Yarn to the section on getting started with development



## 1.1.2 - December 30, 2023
- Changed sample.env in ./packages/server to set Twilio credentials to null, then added test for non-null before initializing. It was crashing the server to run directly off the sample env file.
- Upgraded axios, axios-cookiejar-support, and tough-cookie to latest versions.

## 1.1.1 - October 28, 2022
### New features
- Add new /api/version endpoint to determine, based on hostname, whether to provide the in-custody (jail) version or the regular version
- Front-end jail version changes - suppress all external links and signup functionality, leaving just ability to look up cases.

## 1.1.0 - September 5, 2022
### New features
- Only delete subscriptions 30 days after ```last_valid_cases_date```

## 1.0.1 - September 4, 2022
### New features
- Added unsubscribe instructions to initial sign-up text
- Added server-side test for subscription to defendant
### Bug fixes
- Various ```await``` fixes
### Code Style
- Added ESLint with AirBnB style guide and fixed all errors
- Various fixes to eliminate ```var```, implicit variable declaration, etc.

## 1.0.0 - August 20, 2022

### New features:
- Add environment DISABLE_SMS flag to disable SMS for testing and local development
- Start this changelog