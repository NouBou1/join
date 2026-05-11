/**
 * @file Protects member-only pages by verifying Firebase Authentication state.
 *
 * This module listens for auth state changes. If no user is signed in, it
 * redirects to the public login page. If a user exists, it logs whether the
 * session is anonymous (guest) or authenticated (member).
 *
 * Expected usage:
 * - Import/execute this module on pages that should only be accessible after login.
 *
 * @module member-auth-guard
 */

import { auth } from "../scripts/firebase/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


/**
 * Registers the Firebase auth state listener.
 *
 * @returns {Unsubscribe} Call this function to unsubscribe the auth listener.
 */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../index.html";
    return;
  }
});
