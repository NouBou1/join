/**
 * @file Validation and error handling for signup form.
 *
 * @module signup-validation
 */

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
 * Checks password equality.
 *
 * @returns {boolean}
 */
export function passwordsMatch() {
  const signupPassword = document.getElementById("loginPassword");
  const signupConfirmPassword = document.getElementById("signupConfirmPassword");
  return signupPassword.value === signupConfirmPassword.value;
}

/**
 * Checks if email contains @ and a domain.
 *
 * @param {string} email - Email to validate.
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return /^(?!.*\.\.)[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Returns trimmed email.
 *
 * @returns {string}
 */
function getEmail() {
  const signupEmail = document.getElementById("loginEmail");
  return signupEmail.value.trim();
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
export function validateForm() {
  const signupName = document.getElementById("signupName");
  const signupEmail = document.getElementById("loginEmail");
  const signupPassword = document.getElementById("loginPassword");
  const signupConfirmPassword = document.getElementById("signupConfirmPassword");
  const termsCheckbox = document.getElementById("termsCheckbox");
  const signupBtn = document.getElementById("signupBtn");

  const nameFilled = signupName.value.trim() !== '';
  const emailValue = signupEmail.value.trim();
  const emailFilled = emailValue !== '';
  const emailValid = isValidEmail(emailValue);

  const passwordFilled = signupPassword.value !== '';
  const confirmFilled = signupConfirmPassword.value !== '';
  const passwordsMatchResult = signupPassword.value === signupConfirmPassword.value && confirmFilled;
  const termsAccepted = termsCheckbox.checked;

  if (emailFilled && !emailValid) {
    showSignupEmailError();
  } else {
    clearSignupEmailError();
  }

  if (confirmFilled && !passwordsMatchResult) {
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
    passwordsMatchResult &&
    termsAccepted;

  signupBtn.disabled = !formIsValid;
}

/**
 * Runs final validation before signup.
 *
 * @returns {boolean} True if valid.
 */
export function validateBeforeSubmit() {
  const fieldsValid = validateRequiredFields();
  const emailValid = validateEmail();
  const passwordValid = validatePasswordMatch();
  const termsCheckbox = document.getElementById("termsCheckbox");
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
  const signupName = document.getElementById("signupName");
  const signupEmail = document.getElementById("loginEmail");
  const signupPassword = document.getElementById("loginPassword");
  const signupConfirmPassword = document.getElementById("signupConfirmPassword");

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
 * Validates the signup email field.
 *
 * Returns true when the email field is empty or contains a valid "@"
 * character. Otherwise shows the email error state and returns false.
 *
 * @returns {boolean} True if the email field passes validation, otherwise false.
 */
function validateEmail() {
  const signupEmail = document.getElementById("loginEmail");
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
  const signupConfirmPassword = document.getElementById("signupConfirmPassword");
  if (passwordsMatch() || !signupConfirmPassword.value) {
    clearPasswordError();
    return true;
  }
  showPasswordError();
  return false;
}

/**
 * Shows an error below an input.
 *
 * @param {HTMLInputElement} input - Input element.
 * @param {string} message - Error message.
 * @returns {void}
 */
export function showInputError(input, message) {
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
 * @param {string} errorId - Error element id.
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
 * Displays the signup email error message.
 *
 * Adds the error styling to the signup email input,
 * updates the email error text, and shows the error message.
 *
 * @param {string} [message="Please enter a valid email address."] - The email error message to display.
 * @returns {void}
 */
export function showSignupEmailError(message = "Please enter a valid email address.") {
  const signupEmail = document.getElementById("loginEmail");
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
export function clearSignupEmailError() {
  const signupEmail = document.getElementById("loginEmail");
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
export function showPasswordError(message = "Your passwords do not match. Please try again.") {
  const signupConfirmPassword = document.getElementById("signupConfirmPassword");
  const signupPasswordError = document.getElementById("signupPasswordError");
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
export function clearPasswordError() {
  const signupConfirmPassword = document.getElementById("signupConfirmPassword");
  const signupPasswordError = document.getElementById("signupPasswordError");
  signupConfirmPassword.classList.remove("signup__input--error");
  signupPasswordError.classList.remove("show");
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
export function handleSignupError(error) {
  const signupPassword = document.getElementById("loginPassword");
  const signupBtn = document.getElementById("signupBtn");

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
