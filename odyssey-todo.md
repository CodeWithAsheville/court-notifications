# Tasks to convert to use the new file that will be delivered daily by AOC

- Update server code
    - Modify the update_defendants.js script to use DB and match using race and gender
        - Replace lines 29-33 with a DB call
        - Change line 34 to handle lack of birthday. Two options (maybe make configurable until we see real files):
            - Just match on full name and accept potential name collisions
            - Match on name plus one or both of race and gender

- 
