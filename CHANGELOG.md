# Court Reminders Change Log

## 1.1.? - TBD

## 1.1.1 - October 28, 2022
### New features
- Add new /api/version endpoint to determine, based on hostname, whether to provide the in-custody version, the regular version, or the agency version

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