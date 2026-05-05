/**
 * @file Handles contact list rendering, add/edit overlays, and contact CRUD operations.
 *
 * @module contacts
 */
import { database, auth } from '../../scripts/firebase/firebase.js';
import { ref, push, set, update, remove } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getAddOverlayTemplate, getEditOverlayTemplate } from './member-templates.js';
import { renderContactsList as renderContactsListView, renderActiveContactTemplate, getContactDetailContainer, getInitials, getAvatarColor, getActiveContactId, setActiveContactId, closeMobileDetailView } from './contacts-render.js';

/**
 * Stores the current contacts object indexed by contact id.
 *
 * @type {Object<string, Object>}
 */
let contacts = {};

/**
 * Id of the contact currently being edited.
 *
 * @type {string|null}
 */
let editingContactId = null;

/**
 * Renders the contacts list using the shared contacts-render view module.
 *
 * Also updates the local contacts cache used by edit and delete operations.
 *
 * @param {Object<string, Object>} contactsObjects - Contacts indexed by contact id.
 * @returns {void}
 */
export function renderContactsList(contactsObjects) {
  contacts = contactsObjects || {};
  renderContactsListView(contacts);
}

/**
 * Opens the add-contact overlay and binds the add-contact form submit handler.
 *
 * @returns {void}
 */
export function showAddContactOverlay() {
  const overlay = document.getElementById('contact-add-overlay');
  if (!overlay) return;
  overlay.innerHTML = getAddOverlayTemplate();
  overlay.style.display = 'flex';
  const addBtn = document.querySelector('.contact_mobile_add_btn');
  if (addBtn) addBtn.style.display = 'none';
  setupAddContactOverlayBackdrop();
  const form = document.getElementById('add_contact_form');
  if (form) {
    setupContactFormValidation(form);
    form.onsubmit = handleAddContact;
  }
}

/**
 * Closes the add-contact overlay and restores the mobile add button if appropriate.
 *
 * @returns {void}
 */
export function hideAddContactOverlay() {
  const overlay = document.getElementById('contact-add-overlay');
  if (!overlay) return;
  overlay.style.display = 'none';
  overlay.innerHTML = '';
  const addBtn = document.querySelector('.contact_mobile_add_btn');
  if (addBtn && !document.body.classList.contains('contacts-mobile-detail-open')) {
    addBtn.style.display = '';
  }
}

/**
 * Sets up backdrop click listener for the add-contact overlay.
 * Closes overlay when clicking outside the modal content.
 *
 * @returns {void}
 */
function setupAddContactOverlayBackdrop() {
  const overlay = document.getElementById('contact-add-overlay');
  if (!overlay) return;

  overlay.addEventListener('click', (event) => {
    // Schließen nur wenn auf den Backdrop geklickt wird, nicht auf den Inhalt
    if (event.target === overlay || event.target.classList.contains('addContact_overlay')) {
      hideAddContactOverlay();
    }
  });
}

/**
 * Handles submission of the add-contact form.
 *
 * Validates the required fields, builds the contact payload,
 * stores the new contact in Firebase, closes the overlay,
 * and shows a success message.
 *
 * @async
 * @param {SubmitEvent|Event} [event] - The form submit event.
 * @returns {Promise<void>} Resolves when the add-contact flow is complete.
 */
async function handleAddContact(event) {
  if (event) event.preventDefault();
  const fields = getContactFormFields('add_contact_form');
  if (!hasRequiredContactFields(fields)) return;
  if (!validateContactFormFields(fields)) return;
  const payload = buildAddContactPayload(fields);
  if (!isValidAddContactPayload(payload)) return;
  const uid = getCurrentUserId();
  if (!uid) return;
  await saveNewContact(payload, uid);
  hideAddContactOverlay();
  showSuccessMessage('Contact successfully created!');
}

/**
 * Collects the DOM input fields used by the add-contact form.
 *
 * @returns {{
 *   nameInput: HTMLInputElement|null,
 *   emailInput: HTMLInputElement|null,
 *   phoneInput: HTMLInputElement|null
 * }} Object containing the add-contact form fields.
 */
function getContactFormFields(formId) {
  const form = document.getElementById(formId);
  return {
    form,
    nameInput: form?.querySelector('#contact_name') || null,
    emailInput: form?.querySelector('#contact_email') || null,
    phoneInput: form?.querySelector('#contact_phone') || null
  };
}

/**
 * Checks whether the required add-contact fields are present in the DOM.
 *
 * @param {{
 *   nameInput: HTMLInputElement|null,
 *   emailInput: HTMLInputElement|null,
 *   phoneInput: HTMLInputElement|null
 * }} fields - The collected add-contact form fields.
 * @returns {boolean} True if the required fields exist, otherwise false.
 */
function hasRequiredContactFields(fields) {
  const hasFields = Boolean(fields.nameInput && fields.emailInput);
  if (!hasFields) console.error('Formular-Felder nicht gefunden!');
  return hasFields;
}


function setupContactFormValidation(form) {
  const fields = {
    nameInput: form.querySelector('#contact_name'),
    emailInput: form.querySelector('#contact_email'),
    phoneInput: form.querySelector('#contact_phone')
  };

  [fields.nameInput, fields.emailInput, fields.phoneInput].forEach((field) => {
    field?.addEventListener('blur', () => {
      validateContactField(field);
    });
    field?.addEventListener('input', () => {
      if (field.classList.contains('input-error')) {
        validateContactField(field);
      }
    });
    field?.addEventListener('change', () => {
      if (field.classList.contains('input-error')) {
        validateContactField(field);
      }
    });
  });
}


function validateContactFormFields(fields) {
  const isNameValid = validateContactField(fields.nameInput);
  const isEmailValid = validateContactField(fields.emailInput);
  const isPhoneValid = validateContactField(fields.phoneInput);
  return isNameValid && isEmailValid && isPhoneValid;
}


function validateContactField(input) {
  if (!input) return false;

  const value = input.value.trim();

  if ((input.id === 'contact_name' || input.id === 'contact_email') && !value) {
    setContactFieldError(input, 'This field is required');
    return false;
  }

  if (input.type === 'email' && !isValidEmail(value)) {
    setContactFieldError(input, 'Please enter a valid email address');
    return false;
  }

  if (input.id === 'contact_phone' && value && !/^\+?[0-9]*$/.test(value)) {
    setContactFieldError(input, 'Please enter numbers only. A + is only allowed at the beginning.');
    return false;
  }

  clearContactFieldError(input);
  return true;
}

/**
 * Adds visual error styles and message to a contact field.
 *
 * @param {HTMLInputElement} input - Field with validation error.
 * @param {string} message - Error message to display.
 * @returns {void}
 */
function setContactFieldError(input, message) {
  const formField = input.closest('.form-field');
  const errorMessage = formField?.querySelector('.error-message');
  input.classList.add('input-error');
  formField?.classList.add('error');
  if (errorMessage) errorMessage.textContent = message;
}

/**
 * Removes visual error styles and restores default message.
 *
 * @param {HTMLInputElement} input - Field to reset.
 * @returns {void}
 */
function clearContactFieldError(input) {
  const formField = input.closest('.form-field');
  const errorMessage = formField?.querySelector('.error-message');
  const defaultMessage = errorMessage?.dataset.defaultMessage || '';
  input.classList.remove('input-error');
  formField?.classList.remove('error');
  if (errorMessage) errorMessage.textContent = defaultMessage;
}

/**
 * Tests whether a string is a valid email address.
 *
 * @param {string} email - Email value to validate.
 * @returns {boolean} True when email matches a basic email pattern.
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Builds the payload object for a new contact from the form fields.
 *
 * @param {{
 *   nameInput: HTMLInputElement,
 *   emailInput: HTMLInputElement,
 *   phoneInput: HTMLInputElement|null
 * }} fields - The collected add-contact form fields.
 * @returns {{name: string, email: string, phone: string}} The normalized contact payload.
 */
function buildAddContactPayload(fields) {
  return {
    name: fields.nameInput.value.trim(),
    email: fields.emailInput.value.trim(),
    phone: fields.phoneInput ? fields.phoneInput.value.trim() : ''
  };
}

/**
 * Validates the contact payload for required values.
 *
 * @param {{name: string, email: string, phone: string}} payload - The contact payload to validate.
 * @returns {boolean} True if the payload contains the required values.
 */
function isValidAddContactPayload(payload) {
  return Boolean(payload.name && payload.email);
}

/**
 * Returns the uid of the currently authenticated user.
 *
 * @returns {string|null} The current user id, or null if no user is signed in.
 */
function getCurrentUserId() {
  return auth.currentUser ? auth.currentUser.uid : null;
}

/**
 * Saves a new contact in Firebase under the contacts collection.
 *
 * Adds the creation timestamp and current user id to the stored contact object.
 *
 * @async
 * @param {{name: string, email: string, phone: string}} payload - The validated contact payload.
 * @param {string} uid - The id of the current authenticated user.
 * @returns {Promise<void>} Resolves when the contact has been saved.
 */
async function saveNewContact(payload, uid) {
  const contactsRef = ref(database, 'contacts');
  const newContactRef = push(contactsRef);
  const newContact = {
    ...payload,
    createdAT: Date.now(),
    uid: uid
  };
  try {
    await set(newContactRef, newContact);
  } catch (error) {
    console.error('Fehler beim Speichern:', error);
    throw error;
  }
}

/**
 * Shows a short-lived success message on the page.
 *
 * @param {string} message - The message text to display.
 * @returns {void}
 */
function showSuccessMessage(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success_message';
  successDiv.textContent = message;
  document.body.appendChild(successDiv);
  setTimeout(() => {
    successDiv.remove();
  }, 500);
}

/**
 * Animation duration used when closing the mobile actions menu.
 *
 * @type {number}
 */
const MOBILE_ACTION_CLOSE_MS = 140;

/**
 * Timer id used for delayed closing of the mobile actions menu.
 *
 * @type {number|null}
 */
let mobileActionsCloseTimer = null;

/**
 * Toggles the mobile contact actions menu.
 *
 * Opens the menu immediately when hidden and starts the close animation when visible.
 *
 * @returns {void}
 */
function toggleContactMobileActions() {
  const menu = document.getElementById('contact_mobile_actions_menu');
  if (!menu) return;
  const isHidden = menu.classList.contains('d_none');
  if (isHidden) {
    clearTimeout(mobileActionsCloseTimer);
    menu.classList.remove('d_none', 'is-closing');
    return;
  }
  closeContactMobileActions(true);
}

/**
 * Closes the mobile contact actions menu with a short animation delay.
 *
 * @returns {void}
 */
function closeContactMobileActions() {
  const menu = document.getElementById('contact_mobile_actions_menu');
  if (!menu || menu.classList.contains('d_none')) return;
  clearTimeout(mobileActionsCloseTimer);
  menu.classList.add('is-closing');
  mobileActionsCloseTimer = setTimeout(() => {
    menu.classList.remove('is-closing');
    menu.classList.add('d_none');
  }, MOBILE_ACTION_CLOSE_MS);
}

/**
 * Returns the empty-state template for the contact detail area.
 *
 * @returns {string} HTML string for an empty contact detail view.
 */
function getEmptyContactDetailTemplate() {
  return `
    `;
}

/**
 * Deletes a contact from Firebase and clears the active detail view if needed.
 *
 * @async
 * @param {string} contactId - The id of the contact to delete.
 * @returns {Promise<void>} Resolves when the delete flow is complete.
 */
async function deleteContact(contactId) {
  closeContactMobileActions();
  if (!isDeletableContact(contactId)) return;
  try {
    await removeContactFromDatabase(contactId);
    clearActiveContactIfDeleted(contactId);
  } catch (error) {
    logDeleteContactError(error);
  }
}

/**
 * Checks whether a contact id is valid for deletion.
 *
 * @param {string} contactId - The contact id to validate.
 * @returns {boolean} True if the contact can be deleted, otherwise false.
 */
function isDeletableContact(contactId) {
  return Boolean(contactId);
}

/**
 * Removes a contact from Firebase.
 *
 * @async
 * @param {string} contactId - The id of the contact to remove.
 * @returns {Promise<void>} Resolves when the contact has been removed.
 */
async function removeContactFromDatabase(contactId) {
  const contactRef = ref(database, `contacts/${contactId}`);
  await remove(contactRef);
}

/**
 * Clears the active contact detail view if the deleted contact is currently active.
 *
 * @param {string} contactId - The id of the deleted contact.
 * @returns {void}
 */
function clearActiveContactIfDeleted(contactId) {
  if (getActiveContactId() !== contactId) return;
  resetActiveContactDetail();
}

/**
 * Resets the active contact detail state and view.
 *
 * @returns {void}
 */
function resetActiveContactDetail() {
  setActiveContactId(null);
  closeMobileDetailView();
  renderEmptyContactDetail();
}

/**
 * Renders the empty contact detail state.
 *
 * @returns {void}
 */
function renderEmptyContactDetail() {
  const detailContainer = getContactDetailContainer();
  if (!detailContainer) return;
  detailContainer.innerHTML = getEmptyContactDetailTemplate();
}

/**
 * Logs an error that occurred during contact deletion.
 *
 * @param {unknown} error - The deletion error.
 * @returns {void}
 */
function logDeleteContactError(error) {
  console.error('Fehler beim Löschen des Kontakts:', error);
}

/**
 * Opens the edit overlay for a contact and prepares the edit form submission.
 *
 * @param {string} contactId - The id of the contact to edit.
 * @returns {void}
 */
function editContact(contactId) {
  if (!isEditableContact(contactId)) return;
  editingContactId = contactId;
  const overlay = getEditOverlayElement();
  if (!overlay) return;
  renderEditOverlay(overlay, contactId);
  bindEditFormSubmit();
}

/**
 * Checks whether a contact can be edited.
 *
 * @param {string} contactId - The id of the contact to validate.
 * @returns {boolean} True if the contact exists and can be edited.
 */
function isEditableContact(contactId) {
  return Boolean(contactId && contacts[contactId]);
}

/**
 * Returns the edit overlay element.
 *
 * @returns {HTMLElement|null} The edit overlay element, if found.
 */
function getEditOverlayElement() {
  return document.getElementById('editC_overlay');
}

/**
 * Renders the edit-contact overlay with the current contact data.
 *
 * @param {HTMLElement} overlay - The edit overlay container.
 * @param {string} contactId - The id of the contact to render in edit mode.
 * @returns {void}
 */
function renderEditOverlay(overlay, contactId) {
  const contact = contacts[contactId];
  const initials = getInitials(contact.name || '');
  const color = getAvatarColor(contact.name || '');
  overlay.innerHTML = getEditOverlayTemplate(contactId, contact, initials, color);
  overlay.classList.remove('d_none');
  overlay.onclick = (event) => {
    if (event.target === overlay || event.target.classList.contains('addContact_overlay')) {
      closeEditOverlay();
    }
  };
  const addBtn = document.querySelector('.contact_mobile_add_btn');
  if (addBtn) addBtn.style.display = 'none';
}

/**
 * Binds the submit handler for the edit-contact form.
 *
 * @returns {void}
 */
function bindEditFormSubmit() {
  const form = document.getElementById('edit_contact_form');
  if (!form) return;
  setupContactFormValidation(form);
  form.removeEventListener('submit', saveEditedContact);
  form.addEventListener('submit', saveEditedContact);
}

/**
 * Closes the edit-contact overlay and resets the edit state.
 *
 * @returns {void}
 */
function closeEditOverlay() {
  closeContactMobileActions();
  const overlay = document.getElementById('editC_overlay');
  if (!overlay) return;
  overlay.classList.add('d_none');
  overlay.innerHTML = '';
  editingContactId = null;
  const addBtn = document.querySelector('.contact_mobile_add_btn');
  if (addBtn && !document.body.classList.contains('contacts-mobile-detail-open')) {
    addBtn.style.display = '';
  }
}

/**
 * Saves the edited contact data to Firebase and refreshes the local UI state.
 *
 * @async
 * @param {SubmitEvent|Event} [event] - The form submit event.
 * @returns {Promise<void>} Resolves when the edit flow is complete.
 */
async function saveEditedContact(event) {
  preventDefaultIfPresent(event);
  if (!canSaveEditedContact()) return;
  const fields = getContactFormFields('edit_contact_form');
  if (!hasRequiredContactFields(fields)) return;
  if (!validateContactFormFields(fields)) return;
  const payload = getEditedContactPayload(fields);
  if (!isValidEditedContactPayload(payload)) return;
  try {
    await persistEditedContact(payload);
    applyEditedContactLocally(payload);
    rerenderAfterContactEdit();
    closeEditOverlay();
  } catch (error) {
    logEditContactError(error);
  }
}

/**
 * Prevents the default browser behavior if an event was provided.
 *
 * @param {Event} [event] - The optional event object.
 * @returns {void}
 */
function preventDefaultIfPresent(event) {
  if (event) event.preventDefault();
}

/**
 * Checks whether the current edit operation can be saved.
 *
 * @returns {boolean} True if there is an active contact being edited.
 */
function canSaveEditedContact() {
  return Boolean(editingContactId);
}

/**
 * Builds the edited contact payload from the edit form inputs.
 *
 * @returns {{name: string, email: string, phone: string}} The normalized edited contact payload.
 */
function getEditedContactPayload(fields) {
  return {
    name: fields.nameInput?.value.trim() || '',
    email: fields.emailInput?.value.trim() || '',
    phone: fields.phoneInput?.value.trim() || ''
  };
}

/**
 * Validates the edited contact payload for required values.
 *
 * @param {{name: string, email: string, phone: string}} payload - The edited contact payload.
 * @returns {boolean} True if the payload contains the required values.
 */
function isValidEditedContactPayload(payload) {
  return Boolean(payload.name && payload.email);
}

/**
 * Persists the edited contact payload to Firebase.
 *
 * @async
 * @param {{name: string, email: string, phone: string}} payload - The edited contact payload.
 * @returns {Promise<void>} Resolves when the contact update has been saved.
 */
async function persistEditedContact(payload) {
  const contactRef = ref(database, `contacts/${editingContactId}`);
  await update(contactRef, payload);
}

/**
 * Applies the edited contact values to the local contacts cache.
 *
 * @param {{name: string, email: string, phone: string}} payload - The edited contact payload.
 * @returns {void}
 */
function applyEditedContactLocally(payload) {
  contacts[editingContactId] = {
    ...contacts[editingContactId],
    ...payload,
    id: editingContactId
  };
}

/**
 * Re-renders the contacts list and the edited contact detail view.
 *
 * @returns {void}
 */
function rerenderAfterContactEdit() {
  renderContactsList(contacts);
  renderEditedContactDetail();
}

/**
 * Re-renders the currently edited contact detail view.
 *
 * @returns {void}
 */
function renderEditedContactDetail() {
  const contact = contacts[editingContactId];
  if (!contact) return;
  renderActiveContactTemplate(contact);
}

/**
 * Logs an error that occurred during contact editing.
 *
 * @param {unknown} error - The edit error.
 * @returns {void}
 */
function logEditContactError(error) {
  console.error('Edit fehlgeschlagen:', error);
}

/**
 * Closes the mobile contact actions menu when clicking outside of it.
 *
 * @event click
 * @listens Document#click
 * @returns {void}
 */
document.addEventListener('click', (event) => {
  const menu = document.getElementById('contact_mobile_actions_menu');
  if (!menu) return;
  const clickedMenu = event.target.closest('#contact_mobile_actions_menu');
  const clickedFab = event.target.closest('.contact_mobile_fab_btn');
  if (clickedMenu || clickedFab) return;
  closeContactMobileActions();
});


window.deleteContact = deleteContact;
window.showAddContactOverlay = showAddContactOverlay;
window.hideAddContactOverlay = hideAddContactOverlay;
window.editContact = editContact;
window.handleAddContact = handleAddContact;
window.closeEditOverlay = closeEditOverlay;
window.saveEditedContact = saveEditedContact;
window.toggleContactMobileActions = toggleContactMobileActions;
