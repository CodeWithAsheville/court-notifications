import CaseTableRow from "../CaseTableRow/CaseTableRow";
import './CaseTable.scss'

export default function CaseTable({ state, dispatch }) {
  const caseRows = state.cases.map((courtCase, index) => (
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
          <th scope="col">Signed Up?</th>
          <th scope="col">Defendant</th>
          <th scope="col">Date of Birth</th>
          <th scope="col">Court Date</th>
          <th scope="col">File Number</th>
          <th scope="col" style={{minWidth: '110px'}}>Copy File Number & Sign Up</th>
        </tr>
      </thead>
      <tbody>{caseRows}</tbody>
    </table>
  );

  const emptyTable = (<div className="empty"><em>No results found</em></div>)

  const caseTable = caseRows.length > 0 ? populatedTable : emptyTable;

  return caseTable
}
