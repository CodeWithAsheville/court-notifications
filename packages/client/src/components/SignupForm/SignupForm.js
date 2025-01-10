import "./SignupForm.scss";
import { subscribeToDefendant } from "../../scripts/appState";
import { useTranslation } from 'react-i18next';

function createPhoneUpdater(dispatch) {
  return function updatePhone($event, param) {
    dispatch({ type: "update-phone", value: { [param]: $event.target.value } });
  };
}

export default function SignupForm({ state, dispatch }) {
  const updatePhone = createPhoneUpdater(dispatch);
  const { t } = useTranslation();

  let isJailVersion = false;
  if (window.location.hostname.includes('jail') || (typeof process.env.REACT_APP_CONTEXT !== "undefined" && process.env.REACT_APP_CONTEXT === 'jail')) {
    isJailVersion = true;
  }

  async function doSubscription() {
    let doit = false;
    let tphone = state.phone_number;
    dispatch({ type: "phone-message", value: { phone_message: "" } });

    if (tphone) {
      tphone = tphone.replace(/\D/g, "");
      if (tphone.length !== 10) {
        dispatch({
          type: "phone-message",
          value: { phone_message: t('signup.validations.isInvalid') },
        });
      } else {
        doit = true;
      }
    } else {
      dispatch({
        type: "phone-message",
        value: { phone_message: t('signup.validations.isBlank') },
      });
    }

    if (doit) {
      const result = await subscribeToDefendant(state);
      console.log('Now in the signup form');
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

  const explanationText = isJailVersion ? '' : (
    <p>{t('signup.description')}</p>
  );

  let inputBox = (
    <div className={`usa-form-group ${phoneMessageText ? 'usa-form-group--error': ''}`}>
      <label className={`usa-label ${phoneMessageText ? 'usa-label--error' : ''}`} htmlFor="input-type-text">
        {t('signup.fields.phoneNumber')}
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
      {t('signup.button')}
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
        {t('signup.previousList')}
      </button>
      {explanationText}
      {!isJailVersion && (
        <form className="usa-form lookup-form signup-form">
          {inputBox}
          {signupButton}
        </form>
      )}
    </div>
  );
}
