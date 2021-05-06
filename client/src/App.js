import { useReducer, useRef } from "react";

import "./App.scss";
import SearchForm from "./components/SearchForm/SearchForm";
import CaseTable from "./components/CaseTable/CaseTable";
import Header from "./components/Header/Header";
import Footer from "./components/Footer";
import stepper from "./scripts/stepper";

const initialState = {
  firstName: "",
  lastName: "",
  middleName: "",
  cases: [],
  searchError: false
};

function reducer(state, action) {
  switch (action.type) {
    case "update-name":
      return {
        ...state,
        ...action.value,
      };
    case "reload-cases":
      return {
        ...state,
        cases: action.value,
      };
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const step1 = useRef(null);
  const step2 = useRef(null);

  stepper.setSteps([step1, step2]);

  return (
    <div className="App">
      <Header />
      <ol className="usa-process-list">
        <li className="usa-process-list__item">
          <h4 className="usa-process-list__heading" ref={step1}>
            Search For Your Cases
          </h4>
          <p className="margin-top-05">
            Enter your first, middle and last name to search for your court cases.
            They will appear in a table below.
          </p>
          <SearchForm state={state} dispatch={dispatch} />
        </li>
        <li className="usa-process-list__item">
          <h4 className="usa-process-list__heading" ref={step2}>
            Copy File Numbers And Sign up on the NC Courts Site
          </h4>
          <p>
            Your cases are listed below. You must sign up for each separately.
          </p>
          <p>
            When you click the copy button on a case it will copy your file number to your
            clipboard and open the NC Courts notification signup in a new tab. Complete 
            the signup process as described below, then close the tab to return here. The case
            will now have a <em>Yes</em> in the <b>Signed Up?</b> column
          </p>
          <ul>
            <li>
              <b>County</b>: Select <em>Buncombe</em> from the county selector.
            </li>
            <li>
              <b>File Number</b>: Paste in your file number into the input box.
            </li>
            <li>
              Click the <b>Search Case</b> button
            </li>
            <li>
              If your search is successful, you will see your case information and a
              selector that reads <b>Notify Me By</b>. You may choose to be notified by
              email or by text.
            </li>
            <li>
              Enter your email address or phone number, depending on the method you chose,
              then check the box to agree to the terms of service in order to
              subscribe to any notifications.
            </li>
            <li>
              Close the tab to return to the list of cases.
            </li>
          </ul>
          <p>
            Repeat this procedure until you have signed up for notifications for every case.
          </p>
          <CaseTable state={state} dispatch={dispatch} />
        </li>
      </ol>
      <Footer/>
    </div>
  );
}

export default App;
