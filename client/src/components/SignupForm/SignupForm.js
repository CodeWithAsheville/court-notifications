import "./SignupForm.scss"
import { subscribeToDefendant } from "../../scripts/appState";

function createPhoneUpdater(dispatch) {
  return function updatePhone($event, param) {
    dispatch({ type: "update-phone", value: { [param]: $event.target.value } });
  };
}

export default function SignupForm({ state, dispatch }) {
  const updatePhone = createPhoneUpdater(dispatch);

  async function doSubscription() {
    let doit = false;
    let tphone = state.phone_number;
    dispatch({ type: "phone-message", value: {phone_message: ""}})

    if (tphone) {
      tphone = tphone.replace(/\D/g,'');
    }
    if (tphone && tphone.length !== 10) {
      dispatch({ type: "phone-message", value: {phone_message: "Not a valid 10-digit phone number"}})
    }
    else {
      doit = true;
    }

    if (doit) { 
      const result = await subscribeToDefendant(state);
      console.log('we have the result ' + JSON.stringify(result.message));
      dispatch({ type: "phone-message", value: {phone_message: result.message}});
    }
  }
  let phoneMessageText = "";
  console.log('state: ' + state.phone_message + ' - ' + state.phone_message.length);
  console.log(JSON.stringify(state.phone_message));
  if (state.phone_message.length > 0) {
    phoneMessageText = (<div>&nbsp;&nbsp;&nbsp;{state.phone_message}</div>);
  }

  function unSelectDefendant() {
    dispatch({
      type: "select-defendant",
      value: null,
    });
    dispatch({ type: "phone-message", value: {phone_message: ""}})
  }

  return (
    <div>
      <div width='100%'>
        <button type="button" className="usa-button--secondary" style={{float:"right"}}
                onClick={() => unSelectDefendant()}>
          Return to all defendants
        </button>
      </div>

      <form className="usa-form lookup-form">
        <div>
          <label className="usa-label" htmlFor="input-type-text">
            Cell Phone Number
          </label>
          <input
            className="usa-input"
            id="input-type-text"
            name="input-type-text"
            type="text"
            value={state.phone_number}
            onChange={(e) => updatePhone(e, "phone_number")}
          />
        </div>
        {phoneMessageText}
        <button type="button" className="usa-button" onClick={doSubscription}>
          Sign Up For Notifications
        </button>
      </form>
    </div>
  );
}
