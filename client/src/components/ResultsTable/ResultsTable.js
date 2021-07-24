import CaseTableRow from "../CaseTableRow/CaseTableRow";
import DefendantTableRow from "../DefendantTableRow/DefendantTableRow";
import './ResultsTable.scss'

export default function ResultsTable({ state, dispatch }) {
  let caseRows = null;
  let caseTable = null;

  function unSelectDefendant(courtCase) {
    dispatch({
      type: "select-defendant",
      value: null,
    });
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
            <th scope="col"> Case Details Link</th>
          </tr>
        </thead>
        <tbody>{caseRows}</tbody>
      </table>
    );
    return (
      <div>
        <p style={{float:"right"}} ><button onClick={() => unSelectDefendant()}>Return to all defendants</button></p><br/>
        <p>
          <b>List of cases for {cases[0].defendant} </b>&nbsp;&nbsp;&nbsp;
          <button onClick={() => unSelectDefendant()}>Sign up for notifications</button>
        </p>
        {populatedTable}
      </div>
    );

  } else {
    console.log('Doing defendant list ' + state.cases.length)
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
