import { useReducer, useRef } from "react";

import "./App.scss";
import SearchForm from "./components/SearchForm/SearchForm";
import SignupForm from "./components/SignupForm/SignupForm";
import ResultsTable from "./components/ResultsTable/ResultsTable";
import Header from "./components/Header/Header";
import Footer from "./components/Footer";
import stepper from "./scripts/stepper";

const initialState = {
  firstName: "",
  lastName: "",
  middleName: "",
  cases: [],
  selectedDefendant: null,
  selectedCase: null,
  phone_number: "",
  phone_message: "",
  signupSuccess: false,
  searchError: false,
  searchErrorMessage: "",
  searchSubmitted: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "update-name":
      return {
        ...state,
        ...action.value,
        ...{
          searchError: false,
          searchErrorMessage: false,
          searchSubmitted: false,
        },
      };
    case "update-phone":
      return {
        ...state,
        ...action.value,
      };
    case "phone-message":
      return {
        ...state,
        ...action.value,
      };
    case "signupSuccess":
      return {
        ...state,
        signupSuccess: action.value,
      };
    case "reload-cases":
      return {
        ...state,
        cases: action.value,
      };
    case "select-defendant":
      return {
        ...state,
        selectedDefendant: action.value,
      };
    case "submit-search":
      return {
        ...state,
        searchError: state.lastName ? false : true,
        searchErrorMessage: state.lastName
          ? ""
          : "You must give a last name to search",
        searchSubmitted: true,
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

  let signupForm = "";
  let headerText = "Select a Defendant and Sign Up";
  if (state.selectedDefendant) {
    headerText =
      "Sign Up for Case Notifications for " + state.cases[0].defendant;
    signupForm = <SignupForm state={state} dispatch={dispatch} />;
  }
  return (
    <div className="App">
      <Header />
      <ol className="usa-process-list">
        <li className="usa-process-list__item">
          <h4 className="usa-process-list__heading" ref={step1}>
            Search For Your Cases
          </h4>
          <p className="margin-top-05">
            Enter your first, middle and last name to search for your court
            cases. They will appear in a table below.
          </p>
          <SearchForm state={state} dispatch={dispatch} />
        </li>
        <li className="usa-process-list__item">
          <h4 className="usa-process-list__heading" ref={step2}>
            {headerText}
          </h4>
          {signupForm}
          <ResultsTable state={state} dispatch={dispatch} />
        </li>
      </ol>
      <Footer />
    </div>
  );
}

export default App;
