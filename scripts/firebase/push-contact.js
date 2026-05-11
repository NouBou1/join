import { database } from './firebase.js';
import { ref, push } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

/**
 *
 *
 * @param {string} contactData
 */
export async function pushContact(contactData) {
  try {
    const contactsRef = ref(database, "contacts");
    const newContactRef = await push(contactsRef, contactData);
  } catch (error) {
    console.error("Fehler beim speichern des Contacts:", error.message);
  }
}
