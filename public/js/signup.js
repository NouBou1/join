/**
 * @file Handles user registration, validation, Firebase auth, and contact persistence.
 * @module signup
 */

import { auth } from "../../scripts/firebase/firebase.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { pushContact } from "../../scripts/firebase/push-contact.js";
import {
  validateForm,
  validateBeforeSubmit,
  showSignupEmailError,
  clearSignupEmailError,
  showPasswordError,
  clearPasswordError,
  showInputError,
  handleSignupError,
  isValidEmail
} from "./signup-validation.js";

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

initSignup();
