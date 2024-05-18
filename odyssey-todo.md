# Tasks to convert to use the new file that will be delivered daily by AOC

- Create a new database in AWS to store daily data from AOC
    - Is there any reason not to go with just a single DB instance of minimum size? We might expand later if we support multiple counties, but I doubt it's worth it now, and information is updated daily.
- Create table(s).
    - Suggest having columns that correspond 1:1 to AOC file records PLUS a constructed docket number (case number) for direct use in the reminders
        - This may change depending on how they refer to cases after the switchover. For now just have the routine there to convert to something like what is used now.
        - Do we want to have 2 tables to save space (defendants + cases), or just duplicate defendant info?

- Create a job to move the AOC file from Buncombe server to S3
    - This should wait until we get actual credentials and test file from Buncombe County
    - Probably just use [Bedrock](https://github.com/DeepWeave/bedrock2) for this.
- Create a job to convert file into new DB tables (Python or Node Lambda)
    - This should read from a file on S3 and process into DB
    - Important: get the full file converted and verify that it's ok before replacing records. Also, I would like to have a day-to-day diff of some sort since there are some interesting other applications for that information.
- Update server code
    - Pull case list from DB rather than website in search-court-records.js
        - Basically replace lines 94-110 with a single DB call to get cases that match the search string. As long as we return everything in the same format as today, no changes needed for the rest of the subscription process
        - However, we should probably add columns for race and gender to our current defendant table so that we can use those to help match cases when updating. That will require a modification to util/subscribe.js
    - Modify the update_defendants.js script to use DB and match using race and gender
        - Replace lines 29-33 with a DB call
        - Change line 34 to handle lack of birthday. Two options (maybe make configurable until we see real files):
            - Just match on full name and accept potential name collisions
            - Match on name plus one or both of race and gender

- 
