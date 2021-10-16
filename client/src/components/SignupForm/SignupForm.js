import "./SignupForm.scss";
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
    dispatch({ type: "phone-message", value: { phone_message: "" } });

    if (tphone) {
      tphone = tphone.replace(/\D/g, "");
      if (tphone.length !== 10) {
        dispatch({
          type: "phone-message",
          value: { phone_message: "Not a valid 10-digit phone number" },
        });
      } else {
        doit = true;
      }
    } else {
      dispatch({
        type: "phone-message",
        value: { phone_message: "Phone number cannot be blank" },
      });
    }

    if (doit) {
      const result = await subscribeToDefendant(state);
      console.log(result);
      dispatch({
        type: "phone-message",
        value: { phone_message: result.message },
      });
      dispatch({ type: "signupSuccess", value: true });
    }
  }

  let phoneMessageText = "";

  if (state.phone_message.length > 0) {
    console.log('Phone message ' + state.phone_message);
    phoneMessageText = <div>&nbsp;&nbsp;&nbsp;{state.phone_message}</div>;
  }

  const explanationText = (
    <p>Enter your cell phone to subscribe to text message reminders of any Buncombe County court dates for this defendant. You will receive two reminders, one a week in advance and one a couple days before the court date.</p>
  );

  let inputBox = (
    <div className={`usa-form-group ${phoneMessageText ? 'usa-form-group--error': ''}`}>
      <label className={`usa-label ${phoneMessageText ? 'usa-label--error' : ''}`} htmlFor="input-type-text">
        Cell Phone Number
      </label>
      <span className="usa-error-message" id="input-error-message">
        {phoneMessageText}
      </span>
      <input
        className={`usa-input ${phoneMessageText ? 'usa-input-error' : ''}`}
        id="input-type-text"
        name="input-type-text"
        type="text"
        value={state.phone_number}
        onChange={(e) => updatePhone(e, "phone_number")}
      />
    </div>
  );

  let signupButton = (
    <button type="button" className="usa-button" onClick={doSubscription}>
      Sign Up For Notifications
    </button>
  );

  if (state.signupSuccess) {
    inputBox = (
      <div><span className="usa-error-message" id="input-error-message">
        {phoneMessageText}
      </span></div>);
      signupButton = "";
  }

  function unSelectDefendant() {
    dispatch({
      type: "select-defendant",
      value: null,
    });
    dispatch({ type: "phone-message", value: { phone_message: "" } });
    dispatch({ type: "signupSuccess", value: false });
  }

  return (
    <div>
      <button
        type="button"
        className="usa-button btn-back-arrow"
        onClick={() => unSelectDefendant()}
      >
        <i className="fa fa-chevron-left"></i>
        Return to all defendants
      </button>
      {explanationText}

      <form className="usa-form lookup-form signup-form">
        {inputBox}
        {signupButton}
      </form>
    </div>
  );
}
