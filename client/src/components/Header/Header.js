import "./Header.scss";
import { useTranslation } from 'react-i18next';

export default function Header() {

  const { t, i18n } = useTranslation();

  return (
    <header>
      <div className="language-toggles">
       <button className ="language-button" onClick={() => i18n.changeLanguage("en")}>{t('languages.english')}</button>
       <button className ="language-button" onClick={() => i18n.changeLanguage("es")}>{t('languages.spanish')}</button>
       <button className ="language-button" onClick={() => i18n.changeLanguage("ru")}>{t('languages.russian')}</button>
      </div>
      <div className="header-container">
          <h1>{t('title')}</h1>
          <p>{t('description')}</p>
      </div>
    </header>
  );
}
