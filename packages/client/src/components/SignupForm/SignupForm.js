import "./SignupForm.scss";
import { subscribeToDefendant } from "../../scripts/appState";
import { useTranslation } from 'react-i18next';
import {
  useRouteMatch,
} from "react-router-dom";

function createPhoneUpdater(dispatch) {

  return function updatePhone($event, param) {
    dispatch({ 
      type: `update-${param === 'agency_code' ? 'agency' : 'phone'}`, 
      value: { [param]: $event.target.value } 
    });
  };
}

export default function SignupForm({ state, dispatch }) {

  const match = useRouteMatch();

  const updatePhone = createPhoneUpdater(dispatch);
  const { t } = useTranslation();

  async function doSubscription(e) {
    e.preventDefault();

    let doit = false;
    let tphone = state.phone_number;
    let tagency = state.agency_code;

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
    } else if (tagency.length) {
      // values are controlled by supplied options; if non-empty assume it's valid
      doit = true;
    } else {
      // Should probably make this error more generic - i.e. 'please provide a value' or something - could cover both phone and agency situations
      dispatch({
        type: "phone-message",
        value: { phone_message: t('signup.validations.isBlank') },
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
    <p>{t('signup.description')}</p>
  );

  let inputBox = (
    <div className={`usa-form-large ${phoneMessageText ? 'usa-form-group--error': ''}`}>

      {match.path === '/agency' ? (
        <>
          <label className={`usa-label ${phoneMessageText ? 'usa-label--error' : ''}`} htmlFor="input-type-select">
            {/* Need to add agency language here */}
            {t('signup.fields.phoneNumber')}
          </label>
          <span className="usa-error-message" id="input-error-message">
            {/* Need to add agency language here */}
            {phoneMessageText}
          </span>
          <select
            className={`usa-select ${phoneMessageText ? 'usa-input-error' : ''}`}
            id="input-type-select"
            name="input-type-text"
            onChange={(e) => updatePhone(e, "agency_code")}
          >
            <option value=''>Select an agency code</option>
            <option value='AHOPE'>AHOPE</option>
            <option value='SUNRISE'>SUNRISE</option>
            <option value='RBARLEY'>RB-TESTING</option>
          </select>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );

  let signupButton = (
    <button type="submit" className="usa-button">
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

      <form className="usa-form lookup-form signup-form" onSubmit={doSubscription}>
        {inputBox}
        {signupButton}
      </form>
    </div>
  );
}
