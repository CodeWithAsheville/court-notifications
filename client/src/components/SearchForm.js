import stepper from '../scripts/stepper'

export default function SearchForm({ state, dispatch }) {
  function updateName($event, param) {
    dispatch({ type: "update-name", value: { [param]: $event.target.value } });
  }

  async function reloadCaseLookUp() {
    const response = await fetch("/api/court-search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(state),
    });

    const body = await response.json();

    dispatch({ type: "reload-cases", value: body });

    stepper.scrollToStep(2)
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
          Middle Name Or Initial
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
