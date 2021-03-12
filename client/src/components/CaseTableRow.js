import stepper from "../scripts/stepper";
import copyToClipboard from '../scripts/copyToClipboard'

export default function CaseTableRow({ courtCase }) {
  function copyAndScroll(text) {
    const success = copyToClipboard(text)

    if (success) stepper.scrollToStep(3);
  }

  return (
    <tr>
      <td data-label="Defendant" scope="row">
        {courtCase.defendant}
      </td>
      <td data-label="Court">{courtCase.court}</td>
      <td data-label="Date of Birth">{courtCase.dob}</td>
      <td data-label="Court Date">{courtCase.courtDate}</td>
      <td data-label="Court Room">{courtCase.courtRoom}</td>
      <td data-label="Session">{courtCase.session}</td>
      <td data-label="File Number">{courtCase.caseNumber}</td>
      <td data-label="Copy File Number">
        <button
          className="usa-button usa-button--unstyled"
          onClick={() => copyAndScroll(courtCase.caseNumber)}
        >
          <i className="fas fa-copy"></i>Copy
        </button>
      </td>
    </tr>
  );
}
