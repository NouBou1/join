/**
 * @file Handles authentication logic for email/password login and anonymous guest login.
 *
 * Binds UI event listeners after the DOM is loaded and provides helper
 * functions for logging in with Firebase Authentication.
 *
 * @module join-login
 */
import { auth } from "../scripts/firebase/firebase.js";
import { signInWithEmailAndPassword, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


document.addEventListener("DOMContentLoaded", initLoginPage);

/**
 * Initializes all login page interactions.
 *
 * Loads the required DOM references, prepares the splash logo animation target,
 * binds the login and guest actions, and clears the password error state
 * while the user is typing in the email or password field.
 *
 * @returns {void}
 */
function initLoginPage() {
  const elements = getLoginElements();
  syncSplashLogoTarget(elements);
  bindLoginButton(elements);
  bindGuestButton(elements);
  elements.emailInput?.addEventListener("input", clearPasswordError);
  elements.passwordInput?.addEventListener("input", clearPasswordError);
}

/**
 * Collects and returns all DOM elements required by the login page.
 *
 * @returns {{
 *   loginBtn: HTMLButtonElement|null,
 *   guestBtn: HTMLButtonElement|null,
 *   emailInput: HTMLInputElement|null,
 *   passwordInput: HTMLInputElement|null,
 *   splashLogo: HTMLElement|null,
 *   targetLogo: HTMLElement|null
 * }} Object containing the relevant login page elements.
 */
function getLoginElements() {
  return {
    loginBtn: document.getElementById("loginBtn"),
    guestBtn: document.getElementById("guestBtn"),
    emailInput: document.getElementById("email"),
    passwordInput: document.getElementById("password"),
    splashLogo: document.querySelector(".logo-splash__img"),
    targetLogo: document.querySelector(".join__logo")
  };
}

/**
 * Updates CSS custom properties for the splash logo animation target.
 *
 * Reads the position and width of the target logo and writes the values
 * to CSS variables on the document root.
 *
 * @param {{
 *   splashLogo: HTMLElement|null,
 *   targetLogo: HTMLElement|null
 * }} elements - Object containing the splash and target logo elements.
 * @returns {void}
 */
function syncSplashLogoTarget(elements) {
  if (!elements.splashLogo || !elements.targetLogo) return;
  const { top, left, width } = elements.targetLogo.getBoundingClientRect();
  const root = document.documentElement;
  root.style.setProperty("--logo-target-top", `${top}px`);
  root.style.setProperty("--logo-target-left", `${left}px`);
  root.style.setProperty("--logo-target-width", `${width}px`);
}

/**
 * Binds the click event for the login button.
 *
 * Starts the email/password login flow when the login button is pressed.
 *
 * @param {{
 *   loginBtn: HTMLButtonElement|null
 * }} elements - Object containing the login button reference.
 * @returns {void}
 */
function bindLoginButton(elements) {
  if (!elements.loginBtn) return;
  elements.loginBtn.addEventListener("click", (event) => {
    void handleLoginClick(event, elements);
  });
}

/**
 * Binds the click event for the guest login button.
 *
 * Starts the anonymous login flow when the guest button is pressed.
 *
 * @param {{
 *   guestBtn: HTMLButtonElement|null
 * }} elements - Object containing the guest button reference.
 * @returns {void}
 */
function bindGuestButton(elements) {
  if (!elements.guestBtn) return;
  elements.guestBtn.addEventListener("click", () => {
    void loginAsGuest();
  });
}

/**
 * Handles the login button click event.
 *
 * Prevents the default form behavior, reads the entered credentials,
 * validates them, and starts the email/password login process.
 *
 * @async
 * @param {Event} event - The click event triggered by the login button.
 * @param {{
 *   emailInput: HTMLInputElement|null,
 *   passwordInput: HTMLInputElement|null
 * }} elements - Object containing the login input fields.
 * @returns {Promise<void>} Resolves when the login handling is complete.
 */
async function handleLoginClick(event, elements) {
  event.preventDefault();
  const email = elements.emailInput.value.trim();
  const password = elements.passwordInput.value;
  if (!hasLoginData(email, password)) return;
  await loginWithEmail(email, password);
}

/**
 * Checks whether both login credentials are present.
 *
 * Clears any previous password error state before validating the inputs.
 * Shows the password error state if either the email or password is missing.
 *
 * @param {string} email - The entered email address.
 * @param {string} password - The entered password.
 * @returns {boolean} True if both values are present, otherwise false.
 */
function hasLoginData(email, password) {
  clearPasswordError();
  if (email && password) return true;
  showPasswordError();
  return false;
}

/**
 * Logs in a user with email and password.
 *
 * Clears any previous password error state before attempting login.
 * On success, the user is redirected to the member summary page.
 * On failure, the password error state is shown.
 *
 * @param {string} email - The email address used for login.
 * @param {string} password - The password used for login.
 * @returns {Promise<void>} Resolves when the login flow is finished.
 */
export function loginWithEmail(email, password) {
  clearPasswordError();
  return signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      window.location.href = "./member/summary.html";
    })
    .catch(() => {
      showPasswordError();
    });
}

/**
 * Logs in a user anonymously as a guest.
 *
 * On success, the user is redirected to the member summary page.
 * On failure, an error is logged and shown in an alert.
 *
 * @returns {Promise<void>} Resolves when the guest login flow is finished.
 */
export function loginAsGuest() {
  return signInAnonymously(auth)
    .then(userCredential => {
      window.location.href = "./member/summary.html";
    })
    .catch(error => {
      console.error("Gast Login Fehlgeschlagen:", error.message);
      alert("Gast Login Fehlgeschlagen:" + error.message);
    });
}

function showPasswordError() {
  const passwordInput = document.getElementById("password");
  const errorText = document.getElementById("passwordError");

  if (!passwordInput || !errorText) return;

  passwordInput.classList.add("login__input--error");
  errorText.classList.add("show");
}

function clearPasswordError() {
  const passwordInput = document.getElementById("password");
  const errorText = document.getElementById("passwordError");

  if (!passwordInput || !errorText) return;

  passwordInput.classList.remove("login__input--error");
  errorText.classList.remove("show");
}
