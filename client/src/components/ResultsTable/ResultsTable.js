import CaseTableRow from "../CaseTableRow/CaseTableRow";
import DefendantTableRow from "../DefendantTableRow/DefendantTableRow";

import './ResultsTable.scss'

export default function ResultsTable({ state, dispatch }) {
  let caseRows = null;
  let caseTable = null;

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
    function computeFullSearchUrl(name) {
      return `https://www1.aoc.state.nc.us/www/calendars.Criminal.do?county=100&court=BTH+&defendant=${name}&start=0&navindex=0&fromcrimquery=yes&submit=Search`;
    }
    const df = cases[0].defendant;
    return (
      <div>
        <p>
          <b>Cases for {df} </b>&nbsp;&nbsp;&nbsp;
          <br/>
          You may view details on charges on the <a href={computeFullSearchUrl(df)} target="_blank" rel="noreferrer">NC Courts site</a>.
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
