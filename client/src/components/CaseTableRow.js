import stepper from "../stepper";

export default function CaseTableRow({ courtCase, index, dispatch }) {
  function copyToClipboard() {
    const value = courtCase.caseNumber;
    const type = "text/plain";
    const blob = new Blob([value], { type });
    let data = [new window.ClipboardItem({ [type]: blob })];

    navigator.clipboard.write(data).then(console.log, console.log);

    stepper.scrollToStep(3);
  }

  const copyTextCellStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

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
      <td data-label="File Number" style={{width: '100px'}}>
        <div style={copyTextCellStyles}>
          <button
            className="usa-button usa-button--unstyled"
            onClick={copyToClipboard}
          >
            {courtCase.caseNumber}
            <i className="fas fa-copy"></i>
          </button>
        </div>
      </td>
      <td data-label="Details">
        <a href={courtCase.linkToCaseDetails} target="_blank">
          Details
        </a>
      </td>
      <td data-label="Citation Number">{courtCase.citationNumber}</td>
    </tr>
  );
}
