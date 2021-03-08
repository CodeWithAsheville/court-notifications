import { useReducer, useRef } from "react";

import "./App.scss";
import SearchForm from "./components/SearchForm";
import CaseTable from "./components/CaseTable";
import NotificationsFrame from './components/NotificationsFrame'
import stepper from './stepper'

const initialState = {
  firstName: "",
  lastName: "",
  middleName: "",
  cases: [],
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

  const step1 = useRef(null)
  const step2 = useRef(null)
  const step3 = useRef(null)

  stepper.setSteps([step1, step2, step3])

  return (
    <div className="App">
      <ol class="usa-process-list">
        <li class="usa-process-list__item">
          <h4 class="usa-process-list__heading" ref={step1}>Search For Your Case</h4>
          <p class="margin-top-05">
            Enter your first, middle and last name to search for your court case
          </p>
          <SearchForm state={state} dispatch={dispatch} />
        </li>
        <li class="usa-process-list__item">
          <h4 class="usa-process-list__heading" ref={step2}>Copy Your File Number</h4>
          <p>Once you find your case, click the copy button</p>
          <CaseTable cases={state.cases} dispatch={dispatch} />
        </li>
        <li class="usa-process-list__item">
          <h4 class="usa-process-list__heading" ref={step3}>Sign Up For Notifications</h4>
          <p>
           You will need to finish through the state's notification sign up process below.
          </p>
          <ul>
            <li>
              Select <b>Buncombe</b> from the county picker and paste in your file number
            </li>
            <li>
              If your search is successful, you will see your information and a selector that reads "Notify Me By" 
            </li>
            <li>You may choose to be notified by email or by text</li>
            <li>You must either enter your email address or phone number, then check the box to agree to the terms of service in order to subscribe to any notifications</li>
          </ul>
          <NotificationsFrame />
        </li>
      </ol>
    </div>
  );
}

export default App;
