import "./Header.scss";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

export default function Header({ state, dispatch }) {
  const { t, i18n } = useTranslation();
  function changeLanguage(language) {
    i18n.changeLanguage(language);
  }
  return (
    <header>
      <div>
        <div className="basic-nav">
          <ul>
            <li>
              <NavLink exact={true} activeClassName="active-link" to="/">
                {t("menu.home")}
              </NavLink>
            </li>
            <li>
              <NavLink activeClassName="active-link" to="tips">
              {t("menu.tips")}
              </NavLink>
            </li>
          </ul>
        </div>
        <div className="language-toggles">
          <button
            className="language-button"
            onClick={() => changeLanguage("en")}
          >
            {t("languages.english")}
          </button>
          <button
            className="language-button"
            onClick={() => changeLanguage("es")}
          >
            {t("languages.spanish")}
          </button>
          <button
            className="language-button"
            onClick={() => changeLanguage("ru")}
          >
            {t("languages.russian")}
          </button>
        </div>
      </div>
      <div className="header-container">
        <div className="header-logo">
          <img
            src="scale-icon-detailed-blue.png"
            alt="Scales of justice inside a text message bubble"
          />
        </div>
        <div className="header-text">
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
      </div>
    </header>
  );
}
