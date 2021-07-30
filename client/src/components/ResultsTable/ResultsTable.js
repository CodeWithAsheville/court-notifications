import CaseTableRow from "../CaseTableRow/CaseTableRow";
import DefendantTableRow from "../DefendantTableRow/DefendantTableRow";
import stepper from "../../scripts/stepper"

import './ResultsTable.scss'

function computeFullSearchUrl(name) {
  return `https://www1.aoc.state.nc.us/www/calendars.Criminal.do?county=100&court=BTH+&defendant=${name}&start=0&navindex=0&fromcrimquery=yes&submit=Search`;
}

export default function ResultsTable({ state, dispatch }) {
  let caseRows = null;
  let caseTable = null;

  function unSelectDefendant() {
    dispatch({
      type: "select-defendant",
      value: null,
    });
  }

  function prepareSignUp(courtCase) {
    dispatch({
      type: "select-case",
      value: courtCase,
    });
    stepper.scrollToStep(3);
  }

  if (state.selectedDefendant !== null) {

    let cases = state.cases.filter(item => {
      return (item.defendant+'.'+item.dob === state.selectedDefendant);
    });

    caseRows = cases[0].cases.map((courtCase, index) => (
      <CaseTableRow
        key={courtCase.caseNumber}
        index={index}
        state={state}
        courtCase={courtCase}
        dispatch={dispatch}
      />
    ));

    const populatedTable = (
      <table className="usa-table usa-table--stacked">
        <thead>
          <tr>
            <th scope="col">Court Date</th>
            <th scope="col">Case Number</th>
            <th scope="col">Court</th>
            <th scope="col">Room</th>
          </tr>
        </thead>
        <tbody>{caseRows}</tbody>
      </table>
    );
    return (
      <div>
        <p>Below is a list of your cases. For details on charges, you may view on the <a href={computeFullSearchUrl(cases[0].defendant)} target="_blank" rel="noreferrer">NC Courts site</a> by clicking on the individual file number links.</p>
        <div width='100%'>
          <div style={{float:"right"}}><button onClick={() => unSelectDefendant()}>Return to all defendants</button></div>
          <div style={{float:"left"}}><button onClick={() => prepareSignUp(cases[0])}>Sign up for notifications</button></div>
        </div>
        <br/>
        <p>
          <b>Cases for {cases[0].defendant} </b>&nbsp;&nbsp;&nbsp;
        </p>
        {populatedTable}
      </div>
    );

  } else {
    const defendantRows = state.cases.map((courtCase, index) => (
      <DefendantTableRow
        key={courtCase.caseNumber}
        index={index}
        state={state}
        courtCase={courtCase}
        dispatch={dispatch}
      />
    ));
    const populatedTable = (
      <table className="usa-table usa-table--stacked">
        <thead>
          <tr>
            <th scope="col">Select</th>
            <th scope="col">Defendant</th>
            <th scope="col">Date of Birth</th>
            <th scope="col">Number of Cases</th>
          </tr>
        </thead>
        <tbody>{defendantRows}</tbody>
      </table>
    );
  
    const emptyTable = (<div className="empty"><em>No results found</em></div>)
    caseTable = (defendantRows && defendantRows.length > 0) ? populatedTable : emptyTable;
    return (
      <div>
        <p>
          Defendants who match your search are listed below. Select one to sign up.
        </p>
        {caseTable}
      </div>
    );
  }

}
