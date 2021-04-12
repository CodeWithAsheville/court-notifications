import { useState } from "react";

import "./CaseTableRow.scss";
import copy from 'copy-to-clipboard'
import {
  updateStoredCourtCase,
  openCourtNotificationSite,
} from "../../scripts/appState";

export default function CaseTableRow({ state, courtCase, dispatch }) {
  const initialTooltipText = "Copy File Number & Sign Up";
  const [tooltipText, setTooltipText] = useState(initialTooltipText);
  const [pulsing, setPulsing] = useState(false);

  function copyAndScroll(text) {
    if (!copy(text)) return;

    setPulsing(true);
    setTooltipText(`Copied! Opening sign up site...`);

    setTimeout(() => {
      dispatch({
        type: "reload-cases",
        value: updateStoredCourtCase(state, {
          ...courtCase,
          completed: true,
        }),
      });

      openCourtNotificationSite();

      setTooltipText(initialTooltipText);
      setPulsing(false);
    }, 700);
  }

  return (
    <tr className="case-row">
      <td data-label="Signed Up?" className="completed">
        <i
          className={`fas ${courtCase.completed ? "fa-check" : "fa-times"}`}
        ></i>
        {courtCase.completed ? "Yes" : "No"}
      </td>
      <td data-label="Defendant">{courtCase.defendant}</td>
      <td data-label="Date of Birth">{courtCase.dob}</td>
      <td data-label="Court Date">{courtCase.courtDate}</td>
      <td data-label="File Number">{courtCase.caseNumber}</td>
      <td data-label="Copy File Number & Sign Up">
        <div className="tooltip">
          <button
            data-clipboard-text={`${courtCase.caseNumber}`}
            className="usa-button usa-button--unstyled"
            onClick={() => copyAndScroll(courtCase.caseNumber)}
          >
            <span
              className={`tooltiptext ${pulsing ? "pulse" : ""}`}
              id={`tooltip-${courtCase.caseNumber}`}
            >
              {tooltipText}
            </span>
            Sign Up&nbsp;<i className="fas fa-external-link-alt"></i>
          </button>
        </div>
      </td>
    </tr>
  );
}
