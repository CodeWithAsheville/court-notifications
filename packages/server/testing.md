# Approaches to Testing

## Notification (scripts/notify.js)

The easiest way to test notifications is to change the court date in the test database and either run the notify.js script directly or, if working on the staging server, temporarily set the corresponding scheduler to run every 10 minutes.

```
    update cases set court_date = CURRENT_DATE + {notification days_before} where {clause to select which cases to update}
```

Was 4pm UTC
