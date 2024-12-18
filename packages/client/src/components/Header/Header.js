import { useEffect, useState } from "react";
import "./Header.scss";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { checkMaintenanceMode } from "../../scripts/appState";

function StatusHeader() {
  const [configuration, setConfiguration] = useState();

  useEffect(() => {
    checkMaintenanceMode().then(config => {
      console.log(config)
      setConfiguration(config)
    });
  }, [])

  if (configuration?.value !== "0") {
    return (
      <div className="usa-alert usa-alert--warning margin-0">
      <div className="usa-alert__body padding-205 cn-maintenance-alert">
        <h4 className="usa-alert__heading">Alert</h4>
        <div className="usa-alert__text" dangerouslySetInnerHTML={{__html: configuration.detail}}></div>

      </div>
    </div>
    )
  } else {
    return null
  }
}

export default function Header({ state, dispatch }) {
  const { t, i18n } = useTranslation();
  function changeLanguage(language) {
    i18n.changeLanguage(language);
  }

  return (
    <div>
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
      <StatusHeader />
    </div>
  );
}
