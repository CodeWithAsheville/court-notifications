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
            Search For Your Case
          </h4>
          <p className="margin-top-05">
            Enter your first, middle and last name to search for your court case
          </p>
          <SearchForm state={state} dispatch={dispatch} />
        </li>
        <li className="usa-process-list__item">
          <h4 className="usa-process-list__heading" ref={step2}>
            Copy File Number And Go To State's Sign Up
          </h4>
          <p>
            Find your cases in the table below. When you click the copy button,
            your file number will be copied to your clipboard and the
            notifications sign up site will open in a new tab.
          </p>
          <ul>
            <li>
              You will need to finish through the state's notification sign up
              process below.
            </li>
            <li>
              Select <b>Buncombe</b> from the county picker and paste in your
              file number
            </li>
            <li>
              If your search is successful, you will see your information and a
              selector that reads "Notify Me By"
            </li>
            <li>You may choose to be notified by email or by text</li>
            <li>
              You must either enter your email address or phone number, then
              check the box to agree to the terms of service in order to
              subscribe to any notifications
            </li>
          </ul>
          <CaseTable state={state} dispatch={dispatch} />
        </li>
      </ol>
      <Footer/>
    </div>
  );
}

export default App;
