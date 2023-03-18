import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  let privacyStatementWithLinks = 'https://docs.google.com/document/d/19M2zCxx4gICCmjgVx1bKSHlC92Gnb2SCmkmrclLIq3Y/';

  let isJailVersion = false;
  if (window.location.hostname.includes('jail') || (typeof process.env.REACT_APP_CONTEXT !== "undefined" && process.env.REACT_APP_CONTEXT === 'jail')) {
    isJailVersion = true;
  }

  return (
    <footer>
      <div className="usa-footer__secondary-section">
        <div className="grid-container">
          <div className="usa-footer__logo grid-row grid-gap-2">
            <div className="grid-col-auto">
              {!isJailVersion && (
                <a href="https://www.codeforasheville.org">
                  <img
                    src="code-for-asheville-logo.png"
                    alt="Code for Asheville logo"
                  />
                </a>
              )}
              {isJailVersion && (
                <img
                  src="code-for-asheville-logo.png"
                  alt="Code for Asheville logo"
                />
              )}
            </div>
              <div style={{textAlign: "center", width: "100%"}}>
                {!isJailVersion && (
                  <span style={{paddingRight: "2em"}}>
                    <a href="https://docs.google.com/forms/d/e/1FAIpQLSfraeD1Uwlz10Mr_t4mbV96Hdwb0njm-kTQofQbNjucMw8KAQ/viewform?usp=sf_link" target="_blank" rel="noreferrer">{t('footer.contact')}</a>
                  </span>
                )}
                {!isJailVersion && (
                  <span style={{paddingRight: "2em"}}>
                    <a href={privacyStatementWithLinks} rel="noreferrer" target="_blank">{t('footer.privacy-policy')}</a>
                  </span>
                )}
                {!isJailVersion && (
                <span>
                  <a href="https://github.com/CodeForAsheville/court-notifications" target="_blank" rel="noreferrer">Github</a>
                </span>
              )}                
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
