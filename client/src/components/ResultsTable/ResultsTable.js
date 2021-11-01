import CaseTableRow from "../CaseTableRow/CaseTableRow";
import DefendantTableRow from "../DefendantTableRow/DefendantTableRow";
import { useTranslation } from 'react-i18next';


import './ResultsTable.scss'

export default function ResultsTable({ state, dispatch }) {
  let caseRows = null;
  let caseTable = null;

  const { t } = useTranslation();


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
            <th scope="col">{t('casesTable.columns.courtDate')}</th>
            <th scope="col">{t('casesTable.columns.caseNumber')}</th>
            <th scope="col">{t('casesTable.columns.court')}</th>
            <th scope="col">{t('casesTable.columns.room')}</th>
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
          <b>{t('casesTable.description')} {df} </b>&nbsp;&nbsp;&nbsp;
          <br/>
           {t('casesTable.help')} <a href={computeFullSearchUrl(df)} target="_blank" rel="noreferrer">NC Courts</a>.
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
            <th scope="col">{t('defendantsTable.columns.select')}</th>
            <th scope="col">{t('defendantsTable.columns.defendant')}</th>
            <th scope="col">{t('defendantsTable.columns.birthDate')}</th>
            <th scope="col">{t('defendantsTable.columns.numberOfCases')}</th>
          </tr>
        </thead>
        <tbody>{defendantRows}</tbody>
      </table>
    );
  
    const emptyTable = (<div className="empty"><em>{t('casesTable.emptyTable')}</em></div>)
    caseTable = (defendantRows && defendantRows.length > 0) ? populatedTable : emptyTable;
    return (
      <div>
        <p>
          {t('select.description')}
        </p>
        {caseTable}
      </div>
    );
  }

}
