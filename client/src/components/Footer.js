export default function Footer() {
  return (
    <footer>
      <div className="usa-footer__secondary-section">
        <div className="grid-container">
          <div className="usa-footer__logo grid-row grid-gap-2">
            <div className="grid-col-auto">
              <a href="https://www.codeforasheville.org">
                <img
                  src="code-for-asheville-logo.png"
                  alt="Code for Asheville logo"
                />
              </a>
            </div>
              <div style={{textAlign: "center", width: "100%"}}>
                <span style={{paddingRight: "2em"}}>
                  <a href="https://docs.google.com/forms/d/e/1FAIpQLSfraeD1Uwlz10Mr_t4mbV96Hdwb0njm-kTQofQbNjucMw8KAQ/viewform?usp=sf_link" target="_blank" rel="noreferrer">Contact</a>
                </span>
                <span style={{paddingRight: "2em"}}>
                  <a href="https://docs.google.com/document/d/19M2zCxx4gICCmjgVx1bKSHlC92Gnb2SCmkmrclLIq3Y/" rel="noreferrer" target="_blank">Privacy Policy</a>
                </span>
                <span>
                  <a href="https://github.com/CodeForAsheville/court-notifications" target="_blank" rel="noreferrer">Github</a>
                </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
