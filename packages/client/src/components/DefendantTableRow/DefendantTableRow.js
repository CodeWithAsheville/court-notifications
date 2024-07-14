
import "./DefendantTableRow.scss";
import { useTranslation } from 'react-i18next';


export default function DefendantTableRow({ state, courtCase, dispatch }) {

  const { t } = useTranslation();


  function selectDefendant(courtCase) {
    dispatch({
      type: "select-defendant",
      value: courtCase.defendant + '.' + courtCase.sex + '.' + courtCase.race,
    });
  }
  console.log(courtCase);
  return (
    <tr className="case-row">
      <td data-label="Select"><button onClick={() => selectDefendant(courtCase)}>{t('defendantsTable.columns.select')}</button></td>
      <td data-label="Defendant">{courtCase.defendant}</td>
      <td data-label="Sex/Race">{courtCase.sex + '/' + courtCase.race}</td>
      <td data-label="Number of Cases">{courtCase.cases.length}</td>
    </tr>
  );
}
