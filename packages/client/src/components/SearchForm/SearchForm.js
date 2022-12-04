import "./SearchForm.scss";

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
  let showError = state.searchError && state.searchSubmitted;

  // Reset things
  async function reloadCaseLookUp(e) {
    e.preventDefault();
    dispatch({ type: "submit-search", value: true });
    if (state.lastName) {
      dispatch({
        type: "select-defendant",
        value: null,
      });
      dispatch({ type: "phone-message", value: { phone_message: "" } });
      dispatch({ type: "signupSuccess", value: false });

      // Do the search
      const cases = await getCaseData(state);
      dispatch({ type: "search-returned", value: true });

      dispatch({
        type: "reload-cases",
        value: cases,
      });

      stepper.scrollToStep(2);
    }
  }
  let searchInProgressText = "";
  if (state.searchInProgress) {
    searchInProgressText = (
      <div><span>... {t('search.inProgress')} ...</span></div>
    );
  }
  let searchButton = (
    <div>
      <button disabled = {state.searchInProgress} type="submit" className="usa-button">
        {t('search.submitButton')}
      </button>
      {searchInProgressText}
    </div>
  );
  return (
    <form className="usa-form lookup-form" onSubmit={reloadCaseLookUp}>
      <div className="usa-form-group">
        <label className="usa-label" htmlFor="input-type-text">
        {t('search.inputfields.firstName')}
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
      <div className="usa-form-group">
        <label className="usa-label" htmlFor="input-type-text">
        {t('search.inputfields.middleName')}
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
      <div
        className={`usa-form-group ${showError ? "usa-form-group--error" : ""}`}
      >
        <label
          className={`usa-label ${showError ? "usa-label--error" : ""}`}
          htmlFor="input-type-text"
        >
          {t('search.inputfields.lastName')}
        </label>
        {showError && (
          <span className="usa-error-message" id="input-error-message">
            {state.searchErrorMessage}
          </span>
        )}
        <input
          className={`usa-input ${showError ? "usa-input--error" : ""}`}
          id="input-type-text"
          name="input-type-text"
          type="text"
          value={state.lastName}
          onChange={(e) => updateName(e, "lastName")}
        />
      </div>
      {searchButton}
    </form>
  );
}
