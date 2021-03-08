import CaseTableRow from "./CaseTableRow";

export default function CaseTable({ cases, dispatch }) {
  const caseRows = cases.map((courtCase, index) => (
    <CaseTableRow
      key={courtCase.caseNumber}
      index={index}
      courtCase={courtCase}
      dispatch={dispatch}
    />
  ));

  return (
    <table className="usa-table usa-table--stacked">
      <thead>
        <tr>
          <th scope="col">Court</th>
          <th scope="col">Defendant</th>
          <th scope="col">Date of Birth</th>
          <th scope="col">Court Date</th>
          <th scope="col">Court Room</th>
          <th scope="col">Session</th>
          <th scope="col">File Number</th>
          <th scope="col">Details</th>
          <th scope="col">Citation Number</th>
        </tr>
      </thead>
      <tbody>{caseRows}</tbody>
    </table>
  );
}
