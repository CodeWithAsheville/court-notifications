# Multi-County Planning

## General
- Add a table for counties, to start just the County name and code following [this document](https://www.nccourts.gov/assets/documents/publications/County-Codes-Numbers_07132021.pdf?VersionId=eLzhZKgNV9i8BOQPBi6Zfddbsi__LSkU).
- Add county code to the _criminal_dates_ table
## Search
- Add county parameter to search API (body.county = code).
- Add county parameter to search query
- I think add county code to each record returned in _cases_. That makes it easier later to implement multi-county searches if we choose.

## Register Subscription
- Add a county column to defendants table with single county code
- Change the long_id to include the county
- Should we add County code to cases table? Might make it easier to have the information handy
  for localizing the message.

## Check Subscription
I don't think any changes are needed here.

## Endpoints /sms and /send-status
I don't think any changes are needed here.

## Purge and update
I don't think any changes are needed here other than straightforward ones in unsubscribe

## Update Defendants
Should just parallel what we do in register subscription with cases.

# Notify
This may get more complicated because of a combination of language and local courtroom practice issues.

One possibility is to create a default messaging system in all the appropriate languages and then test if "county.msgid" versions exist. Another is to convert everything to database basis. Or even just to identify the language and then set up the content indexing myself. That's probably relatively straightforward on the server side.




