# Tasks to convert to use the new file that will be delivered daily by AOC

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
