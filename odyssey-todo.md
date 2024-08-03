# To do
- Note - changed 'days_before_purge' to 180, was 30
- In purge-and-update-subscriptions.js in purgeSubscriptions, we delete defendants (line 32), but don't do anything with cases. Looking at update_defendants.js (line 38), if there are no cases we don't actually delete the existing ones (that happens in addCases, which is only called if we have new ones). So we leave orphaned cases in the system (as I saw).
- Need to purge records that are not relevant after the conversion - see (this doc)[https://docs.google.com/document/d/1ijcuE6kf-HXMi3hgWs_rhLd-uayaNNBMy1YZCusPK7w/edit#heading=h.n21lu0tsmzo1].

