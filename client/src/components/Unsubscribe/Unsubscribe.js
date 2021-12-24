import "./Unsubscribe.scss";
import Footer from "../Footer";
import { unsubscribe } from "../../scripts/appState";
import { useTranslation } from 'react-i18next';

function createPhoneUpdater(dispatch) {
  return function updatePhone($event, param) {
    dispatch({ type: "update-phone", value: { [param]: $event.target.value } });
  };
}

function UnsubscribeForm({ state, dispatch }) {
  const updatePhone = createPhoneUpdater(dispatch);
  const { t } = useTranslation();
//  dispatch({ type: "phone-message", value: { phone_message: "" } });

  async function doUnsubscribe() {
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
      const result = await unsubscribe(state);
      console.log(result);
      dispatch({
        type: "phone-message",
        value: { phone_message: result.message },
      });
      dispatch({ type: "unsubscribeDone", value: true });
    }
  }

  let phoneMessageText = "";

  if (state.phone_message.length > 0) {
    console.log('Phone message ' + state.phone_message);
    phoneMessageText = <div>&nbsp;&nbsp;&nbsp;{state.phone_message}</div>;
  }

  const explanationText = (
    <p>{t('unsubscribe.intro')}</p>
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

  let unsubscribeButton = (
    <button type="button" className="usa-button" onClick={doUnsubscribe}>
      {t('unsubscribe.button')}
    </button>
  );
  
  return (
    <div>
      {explanationText}

      <form className="usa-form lookup-form signup-form">
        {inputBox}
        {unsubscribeButton}
      </form>
    </div>
  )
}

export default function Unsubscribe({ state, dispatch }) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="usa-prose">
        <UnsubscribeForm state={state} dispatch={dispatch} />

      </div>
      <Footer/>
    </div>
  )
}
