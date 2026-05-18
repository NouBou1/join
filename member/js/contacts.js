/**
 * @file Contacts rendering and management.
 *
 * @module contacts
 */
import { database } from '../../scripts/firebase/firebase.js';
import { ref, remove, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { handleAddContact, hideAddContactOverlay, showAddContactOverlay } from './contacts-form.js';
import { getEditOverlayTemplate } from './member-templates.js';
import {
  closeMobileDetailView,
  getActiveContactId,
  getAvatarColor,
  getContactDetailContainer,
  getInitials,
  renderActiveContactTemplate,
  renderContactsList as renderContactsListView,
  setActiveContactId
} from './contacts-render.js';

let contacts = {};
let editingContactId = null;
let mobileActionsCloseTimer = null;
const MOBILE_ACTION_CLOSE_MS = 140;

/**
 * Renders the contacts list and keeps the local contacts cache in sync.
 *
 * @param {Object<string, Object>} contactsObjects - Contacts indexed by contact id.
 * @returns {void}
 */
export function renderContactsList(contactsObjects) {
  contacts = contactsObjects || {};
  renderContactsListView(contacts);
}

function toggleContactMobileActions() {
  const menu = document.getElementById('contact_mobile_actions_menu');
  if (!menu) return;
  const isHidden = menu.classList.contains('d_none');
  if (isHidden) {
    clearTimeout(mobileActionsCloseTimer);
    mobileActionsCloseTimer = null;
    menu.classList.remove('d_none', 'is-closing');
    return;
  }
  closeContactMobileActions();
}

function closeContactMobileActions() {
  const menu = document.getElementById('contact_mobile_actions_menu');
  if (!menu || menu.classList.contains('d_none')) return;
  clearTimeout(mobileActionsCloseTimer);
  menu.classList.add('is-closing');
  mobileActionsCloseTimer = setTimeout(() => {
    menu.classList.remove('is-closing');
    menu.classList.add('d_none');
    mobileActionsCloseTimer = null;
  }, MOBILE_ACTION_CLOSE_MS);
}

function getEmptyContactDetailTemplate() {
  return `
    `;
}

function renderEmptyContactDetail() {
  const detailContainer = getContactDetailContainer();
  if (!detailContainer) return;
  detailContainer.innerHTML = getEmptyContactDetailTemplate();
}

async function deleteContact(contactId) {
  closeContactMobileActions();
  if (!contactId) return;
  try {
    const contactRef = ref(database, `contacts/${contactId}`);
    await remove(contactRef);

    if (getActiveContactId() === contactId) {
      setActiveContactId(null);
      closeMobileDetailView();
      renderEmptyContactDetail();
    }
  } catch (error) {
    console.error('Fehler beim Löschen des Kontakts:', error);
  }
}

function editContact(contactId) {
  if (!contactId || !contacts[contactId]) return;

  editingContactId = contactId;
  const overlay = document.getElementById('editC_overlay');
  if (!overlay) return;

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

  const form = document.getElementById('edit_contact_form');
  if (!form) return;

  const fields = {
    nameInput: form.querySelector('#contact_name'),
    emailInput: form.querySelector('#contact_email'),
    phoneInput: form.querySelector('#contact_phone')
  };

  [fields.nameInput, fields.emailInput, fields.phoneInput].forEach((field) => {
    field?.addEventListener('blur', () => validateContactField(field));
    field?.addEventListener('input', () => {
      if (field.classList.contains('input-error')) validateContactField(field);
    });
    field?.addEventListener('change', () => {
      if (field.classList.contains('input-error')) validateContactField(field);
    });
  });

  form.removeEventListener('submit', saveEditedContact);
  form.addEventListener('submit', saveEditedContact);
}

function validateContactField(input) {
  if (!input) return false;

  const value = input.value.trim();

  if ((input.id === 'contact_name' || input.id === 'contact_email') && !value) {
    setContactFieldError(input, 'This field is required');
    return false;
  }

  if (input.id === 'contact_name' && /[0-9]/.test(value)) {
    setContactFieldError(input, 'Please enter letters only');
    return false;
  }

  if (input.type === 'email' && !/^(?!.*\.\.)[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    setContactFieldError(input, 'Please enter a valid email address');
    return false;
  }

  if (input.id === 'contact_phone' && value && !/^\+?[0-9]*$/.test(value)) {
    setContactFieldError(input, 'Please enter a valid phone number');
    return false;
  }

  clearContactFieldError(input);
  return true;
}

function setContactFieldError(input, message) {
  const formField = input.closest('.form-field');
  const errorMessage = formField?.querySelector('.error-message');
  input.classList.add('input-error');
  formField?.classList.add('error');
  if (errorMessage) errorMessage.textContent = message;
}

function clearContactFieldError(input) {
  const formField = input.closest('.form-field');
  const errorMessage = formField?.querySelector('.error-message');
  const defaultMessage = errorMessage?.dataset.defaultMessage || '';
  input.classList.remove('input-error');
  formField?.classList.remove('error');
  if (errorMessage) errorMessage.textContent = defaultMessage;
}

function closeEditOverlay() {
  closeContactMobileActions();
  const overlay = document.getElementById('editC_overlay');
  if (!overlay) return;
  overlay.classList.add('d_none');
  overlay.innerHTML = '';
  overlay.onclick = null;
  editingContactId = null;
  const addBtn = document.querySelector('.contact_mobile_add_btn');
  if (addBtn && !document.body.classList.contains('contacts-mobile-detail-open')) {
    addBtn.style.display = '';
  }
}

function getContactFormFields(formId) {
  const form = document.getElementById(formId);
  return {
    form,
    nameInput: form?.querySelector('#contact_name') || null,
    emailInput: form?.querySelector('#contact_email') || null,
    phoneInput: form?.querySelector('#contact_phone') || null
  };
}

function hasRequiredContactFields(fields) {
  const hasFields = Boolean(fields.nameInput && fields.emailInput);
  if (!hasFields) console.error('Formular-Felder nicht gefunden!');
  return hasFields;
}

function getEditedContactPayload(fields) {
  return {
    name: fields.nameInput?.value.trim() || '',
    email: fields.emailInput?.value.trim() || '',
    phone: fields.phoneInput?.value.trim() || ''
  };
}

function showSuccessMessage(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success_message';
  successDiv.textContent = message;
  document.body.appendChild(successDiv);
  setTimeout(() => {
    successDiv.remove();
  }, 2000);
}

async function saveEditedContact(event) {
  if (event) event.preventDefault();
  if (!editingContactId) return;

  const fields = getContactFormFields('edit_contact_form');
  if (!hasRequiredContactFields(fields)) return;

  if (!validateContactField(fields.nameInput) || !validateContactField(fields.emailInput) || !validateContactField(fields.phoneInput)) {
    return;
  }

  const payload = getEditedContactPayload(fields);
  if (!payload.name || !payload.email) return;

  try {
    const contactRef = ref(database, `contacts/${editingContactId}`);
    await update(contactRef, payload);

    contacts[editingContactId] = {
      ...contacts[editingContactId],
      ...payload,
      id: editingContactId
    };

    renderContactsListView(contacts);
    const contact = contacts[editingContactId];
    if (contact) {
      renderActiveContactTemplate(contact);
    }

    closeEditOverlay();
    showSuccessMessage('Contact successfully updated!');
  } catch (error) {
    console.error('Edit fehlgeschlagen:', error);
  }
}


window.deleteContact = deleteContact;
window.showAddContactOverlay = showAddContactOverlay;
window.hideAddContactOverlay = hideAddContactOverlay;
window.editContact = editContact;
window.handleAddContact = handleAddContact;
window.closeEditOverlay = closeEditOverlay;
window.saveEditedContact = saveEditedContact;
window.toggleContactMobileActions = toggleContactMobileActions;
window.closeContactMobileActions = closeContactMobileActions;
