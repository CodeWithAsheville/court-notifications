import "./SearchForm.scss"

import stepper from "../../scripts/stepper";
import { getCaseData } from "../../scripts/appState";

function createNameUpdater(dispatch) {
  return function updateName($event, param) {
    dispatch({ type: "update-name", value: { [param]: $event.target.value } });
  };
}

export default function SearchForm({ state, dispatch }) {
  const updateName = createNameUpdater(dispatch);

  async function reloadCaseLookUp() {
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
          First Name
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
          Middle Name Or Initial (Optional)
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
          Last Name
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
