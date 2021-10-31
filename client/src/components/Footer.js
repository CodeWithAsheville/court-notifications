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
              <div style={{textAlign: "right", width: "100%", float: "right",  paddingRight: "2em"}}>
                <p>
                  <a href="https://docs.google.com/document/d/19M2zCxx4gICCmjgVx1bKSHlC92Gnb2SCmkmrclLIq3Y/" target="_blank">Privacy Policy</a>
                </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
