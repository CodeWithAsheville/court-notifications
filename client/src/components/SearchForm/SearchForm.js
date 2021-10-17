import "./SearchForm.scss"

import stepper from "../../scripts/stepper";
import { getCaseData } from "../../scripts/appState";
import { useTranslation } from 'react-i18next';

function createNameUpdater(dispatch) {
  return function updateName($event, param) {
    dispatch({ type: "update-name", value: { [param]: $event.target.value } });
  };
}

export default function SearchForm({ state, dispatch }) {

  const { t } = useTranslation();

  const updateName = createNameUpdater(dispatch);
  // Reset things
  async function reloadCaseLookUp() {
    dispatch({
      type: "select-defendant",
      value: null,
    });
    dispatch({ type: "phone-message", value: {phone_message: ""}})
    dispatch({ type: "signupSuccess", value: false })

    // Do the search
    const cases = await getCaseData(state);
    dispatch({
      type: "reload-cases",
      value: cases,
    });
  
    stepper.scrollToStep(2);
  }

  return (
    <form className="usa-form lookup-form">
      <div>
        <label className="usa-label" htmlFor="input-type-text">
        {t('step1.inputfields.firstName')}
        </label>
        <input
          className="usa-input"
          id="input-type-text"
          name="input-type-text"
          type="text"
          value={state.firstName}
          onChange={(e) => updateName(e, "firstName")}
        />
      </div>
      <div>
        <label className="usa-label" htmlFor="input-type-text">
        {t('step1.inputfields.middleName')}
        </label>
        <input
          className="usa-input"
          id="input-type-text"
          name="input-type-text"
          type="text"
          value={state.middleName}
          onChange={(e) => updateName(e, "middleName")}
        />
      </div>
      <div>
        <label className="usa-label" htmlFor="input-type-text">
          {t('step1.inputfields.lastName')}
        </label>
        <input
          className="usa-input"
          id="input-type-text"
          name="input-type-text"
          type="text"
          value={state.lastName}
          onChange={(e) => updateName(e, "lastName")}
        />
      </div>
      <button type="button" className="usa-button" onClick={reloadCaseLookUp}>
        Submit
      </button>
    </form>
  );
}
