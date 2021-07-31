import "./SignupForm.scss"

import stepper from "../../scripts/stepper";
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
    let phone = null;
    let area_code = "828"
    let prefix = "";
    let suffix = "";
    dispatch({ type: "phone-error", value: {phone_error: ""}})

    if (tphone) {
      tphone = tphone.replace(/\D/g,'');
    }
    if (tphone && tphone.length !== 7 && tphone.length !== 10) {
      dispatch({ type: "phone-error", value: {phone_error: "Not a valid phone number"}})
    }
    else if (tphone.length === 7) {
      prefix = tphone.slice(0,3);
      suffix = tphone.slice(-4);
      doit = true;
      dispatch({ type: "phone-error", value: {phone_error: "Assuming 828 area code"}}) 
    }
    else {
      area_code = tphone.slice(0,3);
      prefix = tphone.slice(3,6);
      suffix = tphone.slice(-4);
      doit = true;
    }

    phone = area_code+'-'+prefix+'-'+suffix;
    console.log('Area code: ' + area_code + ", prefix: " + prefix + ', suffix: ' + suffix);
    console.log('Phone: ' + phone);
    console.log(state.phone_error);
    if (doit) { 
      const result = await subscribeToDefendant(state);
      console.log(result);
      //TODO Do something with the result in the state.
      stepper.scrollToStep(3);
    }
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
      <div>&nbsp;&nbsp;&nbsp;{state.phone_error}</div>
      <button type="button" className="usa-button" onClick={doSubscription}>
        Submit
      </button>
    </form>
  );
}
