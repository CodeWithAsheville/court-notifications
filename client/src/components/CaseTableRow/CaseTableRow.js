import { useState } from "react";

import "./CaseTableRow.scss";
import copy from "copy-to-clipboard";
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

  function selectDefendant(courtCase) {
    dispatch({
      type: "select-defendant",
      value: courtCase.defendant + '.' + courtCase.dob,
    });
  }

  return (
    <tr className="case-row">
      <td data-label="Court Date">{courtCase.courtDate}</td>
      <td data-label="File Number">{courtCase.caseNumber}</td>
      <td data-label="Court">{courtCase.court}</td>
      <td data-label="Room">{courtCase.courtRoom}</td>
    </tr>
  );
}
