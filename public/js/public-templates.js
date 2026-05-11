/**
 * @file Provides HTML template factory functions for public pages.
 *
 * Includes templates for the public header, sidebar, signup success message,
 * and mobile footer.
 *
 * @module public-templates
 */

/**
 * Generates the header HTML for public pages.
 *
 * @returns {string} HTML string representing the public header.
 */
export function getHeaderTemplate() {
  return `
        <div class="topbar-left">Kanban Project Management Tool</div>
        <div class="topbar__mobile">
          <img class="topbar__mobile--logo" src="../assets/img/logo-dark.svg" alt="Logo">
        </div>
      `;
}

/**
 * Generates the sidebar HTML for public pages.
 *
 * Includes the login navigation item and legal links.
 *
 * @returns {string} HTML string representing the public sidebar.
 */
export function getSidebarTemplate() {
  const path = window.location.pathname;
  const privacyActive = path.includes("privacy-policy") ? "nav-item--active" : "";
  const legalActive = path.includes("legal-notice") ? "nav-item--active" : "";

  return `
      <div class="logo">
        <img src="../assets/img/logo-bright.svg" alt="" srcset="">
      </div>
      <nav class="nav nav__sidebar--footer">
        <a href="../index.html" class="nav-item">
          <img src="../assets/icons/side-menu/login-icon.svg" alt="Summary" class="nav-icon">
          Log In
        </a>
      </nav>
      <footer class="footer footer__sidebar">
        <a href="./privacy-policy-public.html" class="nav-item legal-nav-item ${privacyActive}">
          Privacy Policy
        </a>
        <a href="./legal-notice-public.html" class="nav-item legal-nav-item ${legalActive}">
        Legal Notice
        </a>
      </footer>
    `;
}

/**
 * Generates a success message shown after a successful signup.
 *
 * @returns {string} HTML string representing the signup success message.
 */
export function signupMassegeTemplate() {
  return `
        <aside class="signup-massege-box">
          <p>
            You Signed Up successfully
          </p>
        </aside>
    `;
}

/**
 * Generates the mobile footer HTML for public pages.
 *
 * @returns {string} HTML string representing the public mobile footer.
 */
export function getPublicFooterTemplate() {
  return `
    <a href="../../index.html" class="button button__mobile button__mobile--public">
      <img class="icon__mobile" src="../../assets/icons/menu/login__mobile.svg" alt="login mobile">
    </a>
    <div class="footer__mobile--right">
      <a href="../../public/privacy-policy-public.html" class="button button__mobile button__mobile--public">
        <span class="footer__mobile--font">Privacy Policy</span>
      </a>
      <a href="../../public/legal-notice-public.html" class="button button__mobile button__mobile--public">
        <span class="footer__mobile--font">Legal Notice</span>
      </a>
    </div>
  `;
}
