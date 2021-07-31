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
    dispatch({ type: "phone-error", value: {phone_error: ""}})

    if (tphone) {
      tphone = tphone.replace(/\D/g,'');
    }
    if (tphone && tphone.length !== 10) {
      dispatch({ type: "phone-error", value: {phone_error: "Not a valid 10-digit phone number"}})
    }
    else {
      doit = true;
    }

    if (doit) { 
      const result = await subscribeToDefendant(state);
      dispatch({ type: "phone-error", value: {phone_error: result.message}});
    }
  }
  let phoneErrorText = "";
  if (state.phone_error && state.phone_error.length > 0) {
    phoneErrorText = (<div>&nbsp;&nbsp;&nbsp;{state.phone_error}</div>);
  }

  return (
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
      {phoneErrorText}
      <button type="button" className="usa-button" onClick={doSubscription}>
        Sign Up For Notifications
      </button>
    </form>
  );
}
