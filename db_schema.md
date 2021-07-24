# Proposed Database Schema

## subscribers

| Column    | Type  | Description        |Notes|
|-----------|-------|--------------------|-----|
|id         |integer|Unique subscriber ID|     |
|phone      |text   |Phone number        |Require form ###-###-####|
|next_notify|date   |Date of next court notification||

## defendants
| Column    | Type  | Description        |Notes|
|-----------|-------|--------------------|-----|
|id         |integer|Unique defendant ID |     |
|first_name |text   |First name          |     |
|middle_name|text   |Middle name         |     |
|last_name  |text   |Last name           |     |
|suffix     |text   |Suffix (e.g., Jr.)  |     |
|birth_date |text   |Month/day of birth  |Must be in form ##/##|

## subscriptions
| Column      | Type  | Description  |Notes|
|-------------|-------|--------------|-----|
|subscriber_id|integer|Subscriber ID |     |
|defendant_id |integer|Defendant ID  |     |
|sub_date   |date   |Initial subscription date||


## cases
| Column     | Type  | Description        |Notes|
|------------|-------|--------------------|-----|
|defendant_id|integer|Defendant ID        |     |
|case_number |text   |Case number         |Same as "file number"|
|court_date  |date   |Court date          ||
|court       |text   |District or Superior|Values: district or superior|
|room        |text   |Court room          |Typical values: ADMN, 003B, 001A, etc.|
|session     |text   |AM or PM            ||
