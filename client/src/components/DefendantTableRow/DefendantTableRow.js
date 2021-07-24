import { useState } from "react";

import "./DefendantTableRow.scss";
import copy from "copy-to-clipboard";
import {
  updateStoredCourtCase,
  openCourtNotificationSite,
} from "../../scripts/appState";

export default function DefendantTableRow({ state, courtCase, dispatch }) {
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
      <td data-label="Select"><button onClick={() => selectDefendant(courtCase)}>Select</button></td>
      <td data-label="Defendant">{courtCase.defendant}</td>
      <td data-label="Date of Birth">{courtCase.dob}</td>
      <td data-label="Number of Cases">{courtCase.cases.length}</td>
    </tr>
  );
}
