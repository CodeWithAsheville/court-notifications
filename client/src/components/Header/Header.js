import "./Header.scss";
import { useTranslation } from 'react-i18next';

export default function Header({ state, dispatch }) {

  const { t, i18n } = useTranslation();
  function changeLanguage(language) {
    i18n.changeLanguage(language);
    dispatch({
      type: "language",
      value: { language },
    });
  }
  return (
    <header>
      <div className="language-toggles">
       <button className ="language-button" onClick={() =>  changeLanguage("en")}>{t('languages.english')}</button>
       <button className ="language-button" onClick={() => changeLanguage("es")}>{t('languages.spanish')}</button>
       <button className ="language-button" onClick={() => changeLanguage("ru")}>{t('languages.russian')}</button>
      </div>
      <div className="header-container">
          <h1>{t('title')}</h1>
          <p>{t('description')}</p>
      </div>
    </header>
  );
}
