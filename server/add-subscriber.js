const knexConfig = require('../knexfile');
var env         = 'development';
var knex        = require('knex')(knexConfig[env]);

async function addCases(defendantId, casesIn) {
  let nextDate = null;
  const cases = casesIn.map(itm => {
    const cdate = new Date(itm.courtDate);
    if (nextDate === null || cdate < nextDate) nextDate = cdate;
    return {
      defendant_id: defendantId,
      case_number: itm.caseNumber,
      court_date: itm.courtDate,
      court: itm.court,
      room: itm.courtRoom,
      session: itm.session,
    }
  });
  try {
    // We could compare existing cases in DB to new ones, but ... why?
    let retVal = await knex('cases')
      .where('defendant_id', cases[0].defendant_id)
      .del();

    retVal = await knex('cases')
      .insert(cases)
      .returning('id');
  }
  catch (e) {
    throw 'Error adding or updating cases for subscription';
  }
  return nextDate;
}

async function addDefendant(defendant) {
  const defendantId = await knex('defendants')
  .select()
    .where('long_id', defendant.long_id)
    .then(async function(rows) {
      if (rows.length===0) {
        // no matching records found
        const retVal = await knex('defendants')
          .insert(defendant)
          .returning('id');
        if (retVal && retVal.length > 0) {
          return retVal[0]
        }
        throw new Error('Error inserting defendant ' + JSON.stringify(retVal));
      } else {
        return rows[0].id;
      }
    })
    .catch(function(ex) {
      // you can find errors here.
      throw 'Error adding or updating defendant';
    });

    return defendantId;
}

async function addSubscriber(body, callback, onError) {  
  const selectedDefendant = body.selectedDefendant;
  const phone = body.phone_number.replace(/\D/g,'');
  const details = body.details;
  let returnMessage = 'Successfully subscribed';
  cases = details.cases;
  if (cases == null || cases.length == 0) throw 'No cases selected';

  try {
    const defendant = {
      long_id: selectedDefendant,
      last_name: '',
      first_name: '',
      middle_name: null,
      suffix: null,
      birth_date: ''
    };
    defendant.birth_date = details.dob;
    const d = details.defendant.split(',');
    defendant.last_name = d[0];
    if (d.length >= 2) {
      defendant.first_name = d[1];
      if (d.length >= 3) { //TODO Could be lname,fname,suffix
        defendant.middle_name = d[2];
        if (d.length >= 4) {
          defendant.suffix = d[3];
        }
      }
    }

    let defendantId = await addDefendant(defendant);

    const nextDate = await addCases(defendantId, cases);
    const next_notify = (nextDate.getMonth()+1) + '/' + nextDate.getDate() + '/' + nextDate.getFullYear();
    let subscriberId = null;
    let retVal;
    let subscribers = null;
    try {
      subscribers = await knex('subscribers')
        .select()
        .where('phone', phone);
    } 
    catch (e) {
      throw 'Error in subscriber lookup';
    }
    if (subscribers.length > 0) {
      if (subscribers.length > 1) throw new Error('Ugh - duplicates for this phone');
      subscriberId = subscribers[0].id;
      const currentNext = new Date(subscribers[0].next_notify);
      if (nextDate != currentNext) {
        // Need to update the date
        try {
          knex('subscribers')
          .where('id', subscriberId)
          .update({
            next_notify,
          });
        }
        catch (e) {
          throw 'Error updating next court date';
        }
      }
    }
    else {
      try {
        retVal = await knex('subscribers')
          .insert({
            phone,
            next_notify,
          })
          .returning('id');
        subscriberId = retVal[0];
      }
      catch (e) {
        throw 'Error adding subscriber';
      }
    }
    // Now record the subscription
    try {
      retVal = await knex('subscriptions')
      .select()
      .where({
        subscriber_id: subscriberId,
        defendant_id: defendantId
      });
      if (retVal.length === 0) {
        retVal = await knex('subscriptions')
          .insert({
            subscriber_id: subscriberId,
            defendant_id: defendantId
          })
          .returning('created_at');
      }
    }
    catch (e) {
      throw 'Error adding subscription';
    }
  }
  catch (e) {
    returnMessage = (typeof e === 'string') ? e : e.message;
  }
  callback({message: returnMessage});
}
module.exports = {
  addSubscriber
}