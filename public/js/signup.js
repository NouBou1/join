/**
 * @file Handles user registration, validation, Firebase auth, and contact persistence.
 * @module signup
 */

import { auth } from "../../scripts/firebase/firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { pushContact } from "../../scripts/firebase/push-contact.js";

const signupName = document.getElementById("signupName");
const signupEmail = document.getElementById("loginEmail");
const signupPassword = document.getElementById("loginPassword");
const signupConfirmPassword = document.getElementById("signupConfirmPassword");
const signupPasswordError = document.getElementById("signupPasswordError");
const termsCheckbox = document.getElementById("termsCheckbox");
const signupBtn = document.getElementById("signupBtn");
const signupForm = document.getElementById("signupForm");

/**
 * Initializes signup validation and submit listeners.
 *
 * @returns {void}
 */
function initSignup() {
  addInputListeners();
  termsCheckbox?.addEventListener("change", validateForm);
  signupForm?.addEventListener("submit", handleSignup);
  validateForm();
}

/**
 * Adds validation listeners to all inputs.
 *
 * @returns {void}
 */
function addInputListeners() {
  signupName?.addEventListener("input", validateForm);
  signupEmail?.addEventListener("input", validateForm);
  signupPassword?.addEventListener("input", validateForm);
  signupConfirmPassword?.addEventListener("input", validateForm);
}

/**
 * Validates the signup form and updates the related error states.
 *
 * Checks whether all required fields are filled, validates the email format,
 * verifies that both password fields match, updates the corresponding
 * error messages, and enables or disables the signup button.
 *
 * @returns {void}
 */
function validateForm() {
  const nameFilled = signupName.value.trim() !== '';
  const emailValue = signupEmail.value.trim();
  const emailFilled = emailValue !== '';
  const emailValid = isValidEmail(emailValue);

  const passwordFilled = signupPassword.value !== '';
  const confirmFilled = signupConfirmPassword.value !== '';
  const passwordsMatch = signupPassword.value === signupConfirmPassword.value && confirmFilled;
  const termsAccepted = termsCheckbox.checked;

  if (emailFilled && !emailValid) {
    showSignupEmailError();
  } else {
    clearSignupEmailError();
  }

  if (confirmFilled && !passwordsMatch) {
    showPasswordError();
  } else {
    clearPasswordError();
  }

  const formIsValid =
    nameFilled &&
    emailFilled &&
    emailValid &&
    passwordFilled &&
    confirmFilled &&
    passwordsMatch &&
    termsAccepted;

  signupBtn.disabled = !formIsValid;
}

/**
 * Checks if the form is ready to submit.
 *
 * @returns {boolean} True if valid.
 */
function isFormReady() {
  return isFilled(signupName)
    && isFilled(signupEmail)
    && isFilled(signupPassword)
    && isFilled(signupConfirmPassword)
    && passwordsMatch()
    && termsCheckbox.checked;
}

/**
 * Checks if input has a value.
 *
 * @param {HTMLInputElement} input - Input element.
 * @returns {boolean} True if filled.
 */
function isFilled(input) {
  return input?.value.trim() !== "";
}

/**
 * Handles form submit.
 *
 * @async
 * @param {SubmitEvent} event - Submit event.
 * @returns {Promise<void>}
 */
async function handleSignup(event) {
  event.preventDefault();
  if (!validateBeforeSubmit()) return;
  await registerUser();
}

/**
 * Runs final validation before signup.
 *
 * @returns {boolean} True if valid.
 */
function validateBeforeSubmit() {
  const fieldsValid = validateRequiredFields();
  const emailValid = validateEmail();
  const passwordValid = validatePasswordMatch();
  return fieldsValid && emailValid && passwordValid && termsCheckbox.checked;
}

/**
 * Validates that all required signup fields are filled.
 *
 * Shows the corresponding field-specific error messages
 * when required inputs are empty and returns the overall validation result.
 *
 * @returns {boolean} True if all required fields are filled, otherwise false.
 */
function validateRequiredFields() {
  let isValid = true;

  if (!isFilled(signupName)) {
    showInputError(signupName, "This field is required.");
    isValid = false;
  }

  if (!isFilled(signupEmail)) {
    showSignupEmailError("This field is required.");
    isValid = false;
  }

  if (!isFilled(signupPassword)) {
    showInputError(signupPassword, "This field is required.");
    isValid = false;
  }

  if (!isFilled(signupConfirmPassword)) {
    showPasswordError("This field is required.");
    isValid = false;
  }

  return isValid;
}

/**
 * Validates one required input.
 *
 * @param {HTMLInputElement} input - Input element.
 * @returns {boolean} True if input is filled.
 */
function validateRequiredInput(input) {
  if (isFilled(input)) return true;
  showInputError(input, "This field is required.");
  return false;
}

/**
 * Shows an error below an input.
 *
 * @param {HTMLInputElement} input - Input element.
 * @param {string} message - Error message.
 * @returns {void}
 */
function showInputError(input, message) {
  const error = getInputError(input);
  error.textContent = message;
  error.classList.add("show");
  input.classList.add("signup__input--error");
}

/**
 * Gets or creates an input error element.
 *
 * @param {HTMLInputElement} input - Input element.
 * @returns {HTMLSpanElement} Error element.
 */
function getInputError(input) {
  const errorId = `${input.id}Error`;
  const existing = document.getElementById(errorId);
  if (existing) return existing;
  return createInputError(input, errorId);
}

/**
 * Creates an input error element.
 *
 * @param {HTMLInputElement} input - Input element.
 * @returns {HTMLSpanElement} Error element.
 */
function createInputError(input, errorId) {
  const error = document.createElement("span");
  error.id = errorId;
  error.className = "signup__error--text";
  input.insertAdjacentElement("afterend", error);
  return error;
}

/**
 * Registers user in Firebase.
 *
 * @async
 * @returns {Promise<void>}
 */
async function registerUser() {
  try {
    signupBtn.disabled = true;
    const credential = await createUser();
    await saveContact(credential.user.uid);
    showSuccessOverlay();
  } catch (error) {
    handleSignupError(error);
  }
}

/**
 * Creates Firebase user.
 *
 * @returns {Promise<UserCredential>}
 */
function createUser() {
  return createUserWithEmailAndPassword(auth, getEmail(), signupPassword.value);
}

/**
 * Saves user contact data.
 *
 * @param {string} uid - User ID.
 * @returns {Promise<void>}
 */
function saveContact(uid) {
  return pushContact({
    uid: uid,
    name: signupName.value.trim(),
    email: getEmail(),
    createdAT: Date.now()
  });
}

/**
 * Returns trimmed email.
 *
 * @returns {string}
 */
function getEmail() {
  return signupEmail.value.trim();
}

/**
 * Checks if email contains @.
 *
 * @returns {boolean}
 */
// function emailHasAt() {
//   return getEmail().includes("@");
// }

function isValidEmail(email) {
  return /^(?!.*\.\.)[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates the signup email field.
 *
 * Returns true when the email field is empty or contains a valid "@"
 * character. Otherwise shows the email error state and returns false.
 *
 * @returns {boolean} True if the email field passes validation, otherwise false.
 */
function validateEmail() {
  if (!isFilled(signupEmail)) return true;

  if (isValidEmail(getEmail())) {
    clearSignupEmailError();
    return true;
  }

  showSignupEmailError("Please enter a valid email address.");
  return false;
}

/**
 * Validates password match.
 *
 * @returns {boolean}
 */
function validatePasswordMatch() {
  if (passwordsMatch() || !signupConfirmPassword.value) {
    clearPasswordError();
    return true;
  }
  showPasswordError();
  return false;
}

/**
 * Checks password equality.
 *
 * @returns {boolean}
 */
function passwordsMatch() {
  return signupPassword.value === signupConfirmPassword.value;
}


/**
 * Displays the signup email error message.
 *
 * Adds the error styling to the signup email input,
 * updates the email error text, and shows the error message.
 *
 * @param {string} [message="Email must contain an @ character."] - The email error message to display.
 * @returns {void}
 */
function showSignupEmailError(message = "Email must contain an @ character.") {
  const emailError = document.getElementById("signupEmailError");
  signupEmail.classList.add("signup__input--error");
  emailError.textContent = message;
  emailError.classList.add("show");
}

/**
 * Clears the signup email error state.
 *
 * Hides the email error message and removes the error styling
 * from the signup email input.
 *
 * @returns {void}
 */
function clearSignupEmailError() {
  document.getElementById("signupEmailError")?.classList.remove("show");
  signupEmail.classList.remove("signup__input--error");
}

/**
 * Displays the signup password confirmation error message.
 *
 * Adds the error styling to the password confirmation input,
 * updates the password error text, and shows the error message.
 *
 * @param {string} [message="Your passwords do not match. Please try again."] - The password error message to display.
 * @returns {void}
 */
function showPasswordError(message = "Your passwords do not match. Please try again.") {
  signupConfirmPassword.classList.add("signup__input--error");
  signupPasswordError.textContent = message;
  signupPasswordError.classList.add("show");
}

/**
 * Clears the signup password confirmation error state.
 *
 * Hides the password error message and removes the error styling
 * from the password confirmation input.
 *
 * @returns {void}
 */
function clearPasswordError() {
  signupConfirmPassword.classList.remove("signup__input--error");
  signupPasswordError.classList.remove("show");
}

/**
 * Shows success overlay.
 *
 * @returns {void}
 */
function showSuccessOverlay() {
  const overlay = createOverlay();
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("signup-success--visible"));
  redirectToLogin();
}

/**
 * Creates overlay element.
 *
 * @returns {HTMLDivElement}
 */
function createOverlay() {
  const el = document.createElement("div");
  el.className = "signup-success";
  el.textContent = "You signed up successfully";
  return el;
}

/**
 * Redirects to login page.
 *
 * @returns {void}
 */
function redirectToLogin() {
  setTimeout(() => {
    window.location.href = "../index.html";
  }, 1500);
}


/**
 * Handles signup errors and shows the matching validation feedback.
 *
 * Re-enables the signup button, logs the Firebase error,
 * resolves the corresponding user-facing message, and displays it
 * on the affected signup field.
 *
 * @param {{code: string, message: string}} error - The Firebase signup error object.
 * @returns {void}
 */
function handleSignupError(error) {
  signupBtn.disabled = false;
  console.error(error.code, error.message);

  const message = getErrorMessage(error.code);

  if (error.code === "auth/weak-password") {
    showInputError(signupPassword, message);
    return;
  }

  if (error.code === "auth/email-already-in-use" || error.code === "auth/invalid-email") {
    showSignupEmailError(message);
    return;
  }

  showSignupEmailError(message);
}

/**
 * Returns error message.
 *
 * @param {string} code - Firebase error code.
 * @returns {string}
 */
function getErrorMessage(code) {
  const messages = {
    "auth/email-already-in-use": "This email is already registered.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/network-request-failed": "Network error. Please try again."
  };
  return messages[code] || "Signup failed. Please try again.";
}

initSignup();
