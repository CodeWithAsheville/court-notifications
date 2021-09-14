import "./CaseTableRow.scss";

export default function CaseTableRow({ state, courtCase, dispatch }) {
  return (
    <tr className="case-row">
      <td data-label="Court Date">{courtCase.courtDate}</td>
      <td data-label="File Number">{courtCase.caseNumber}</td>
      <td data-label="Court">{courtCase.court}</td>
      <td data-label="Room">{courtCase.courtRoom}</td>
    </tr>
  );
}
