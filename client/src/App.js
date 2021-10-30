import { useReducer, useRef } from "react";
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

import "./App.scss";
import SearchForm from "./components/SearchForm/SearchForm";
import SignupForm from "./components/SignupForm/SignupForm";
import ResultsTable from "./components/ResultsTable/ResultsTable";
import Header from "./components/Header/Header";
import Footer from "./components/Footer";
import Intro from "./components/Intro/Intro";
import CourtGuide from "./components/CourtGuide/CourtGuide";
import stepper from "./scripts/stepper";
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

const initialState = {
  language: "en",
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
  searchInProgress: false,
  searchReturned: false,
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
      let val = false;
      if (state.lastName) val = true;
      return {
        ...state,
        searchError: state.lastName ? false : true,
        searchErrorMessage: state.lastName
          ? ""
          : `${i18next.t('search.validations.lastName')}`,
        searchSubmitted: true,
        searchInProgress: val,
      };
    case "search-returned":
      return {
        ...state,
        searchReturned: true,
        searchInProgress: false,
      };
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <Router>
      <div className="App">
        <Header state={state} dispatch={dispatch} />
        <Switch>
          <Route path="/go-to-court">
            <CourtGuide />
          </Route>
          <Route path="/">
            <Home state={state} dispatch={dispatch} />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

function GoToCourt() {
  return (
    <div>
      <CourtGuide />
    </div>
  )
}

function Home({ state, dispatch }) {
  const { t } = useTranslation();
  const step1 = useRef(null);
  const step2 = useRef(null);
  stepper.setSteps([step1, step2]);

  let signupForm = "";
  let headerText = `${t('select.title')}`
  let resultsItem = "";

  if (state.selectedDefendant) {
    let defendantName = state.cases.filter(item => item.defendant+'.'+item.dob === state.selectedDefendant)[0].defendant;
    headerText =
      `${t('signup.title')} ${defendantName}`;
    signupForm = <SignupForm state={state} dispatch={dispatch} />;
  }

  if (state.searchReturned) {
    resultsItem = (
      <li className="usa-process-list__item">
      <h4 className="usa-process-list__heading" ref={step2}>
        {headerText}
      </h4>
      {signupForm}
      <ResultsTable state={state} dispatch={dispatch} />
    </li>
    );
  }
  return (
      <div>
        <Intro />
        <ol className="usa-process-list">
          <li className="usa-process-list__item">
            <h4 className="usa-process-list__heading" ref={step1}>
              {t('search.title')}
            </h4>
            <p className="margin-top-05">
              {t('search.description')}
            </p>
            <SearchForm state={state} dispatch={dispatch} />
          </li>

          {resultsItem}
          
        </ol> 
        <Footer/>
      </div>
  );
}

export default App;
