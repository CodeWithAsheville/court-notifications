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
  phone_error: "",
  searchError: false
};

function reducer(state, action) {
  switch (action.type) {
    case "update-name":
      return {
        ...state,
        ...action.value,
      };
    case "update-phone":
      return {
        ...state,
        ...action.value,
      };
    case "phone-error":
      return {
        ...state,
        ...action.value,
      }
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
    case "select-case":
      return {
        ...state,
        selectedCase: action.value,
      };
      default:
      return state;
  }
}

function getSignupForm(state, step3, dispatch) {
  if (state.selectedDefendant) return (
    <li className="usa-process-list__item">
    <h4 className="usa-process-list__heading" ref={step3}>
        Sign up for notifications
      </h4>
      <p>
        Enter phone number and such.
      </p>
      <SignupForm state={state} dispatch={dispatch} />
  </li>
  );
  return "";
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const step1 = useRef(null);
  const step2 = useRef(null);
  const step3 = useRef(null);

  stepper.setSteps([step1, step2, step3]);
  const signup = getSignupForm(state, step3, dispatch);

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
            Select a Defendant and Sign Up
          </h4>
          <ResultsTable state={state} dispatch={dispatch} />
        </li>
        {signup}
      </ol>
      <Footer/>
    </div>
  );
}

export default App;
