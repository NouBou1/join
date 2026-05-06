/**
 * @file Provides Firebase data-loading helpers for contacts, tasks, and categories.
 *
 * Includes auth-state-based data initialization, live listeners for database data,
 * and a fetch-based task loader.
 *
 * @module get-firebase
 */

import { database, auth, BASE_URL } from './firebase.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { renderContactsList } from '../../member/js/contacts.js';

let contacts = {};
let tasks = {};
let category = {};

/**
 * Returns the cached contacts object.
 *
 * @returns {Object<string, Object>} Contacts indexed by contact id.
 */
export function getContacts() {
  return contacts;
}

/**
 * Starts data loading when an authenticated user is available.
 *
 * @listens Auth#onAuthStateChanged
 * @returns {void}
 */
auth.onAuthStateChanged((user) => {
  if (user) {
    loadData();
  } else {
    console.error('No user authenticated');
  }
});

/**
 * Loads contacts, tasks, and categories from Firebase using live listeners.
 *
 * Updates local caches and renders the contacts list when the contact list element exists.
 *
 * @async
 * @param {Function} [onContactsLoaded] - Optional callback invoked after contacts are loaded.
 * @returns {Promise<void>} Resolves after all listeners have been registered.
 */
export async function loadData(onContactsLoaded) {
  const contactsRef = ref(database, 'contacts');
  onValue(contactsRef, (firebaseData) => {
    contacts = firebaseData.val() || {};

    if (document.getElementById('contact_list')) {
      renderContactsList(contacts);
    }
    if (onContactsLoaded) onContactsLoaded();
  }, (error) => {
    console.error('Fehler beim Laden der Contacts:', error);
  });

  const tasksRef = ref(database, 'tasks');
  onValue(tasksRef, (firebaseData) => {
    tasks = firebaseData.val() || {};
  });

  const categoryRef = ref(database, 'category');
  onValue(categoryRef, (firebaseData) => {
    category = firebaseData.val() || {};
  });
}

/**
 * Loads tasks from the Firebase Realtime Database via fetch.
 *
 * Returns an empty object when no task data exists.
 *
 * @async
 * @returns {Promise<Object<string, Object>>} Tasks indexed by task id.
 */
export async function loadTasks() {
  const response = await fetch(`${BASE_URL}tasks.json`);
  const data = await response.json();
  if (!data) {
    return {};
  }
  return data;
}
