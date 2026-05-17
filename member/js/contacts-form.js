/**
 * @file Add-contact form logic and validation helpers.
 *
 * @module contacts-form
 */
import { auth, database } from '../../scripts/firebase/firebase.js';
import { push, ref, set } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getAddOverlayTemplate } from './member-templates.js';

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

function setupContactFormValidation(form) {
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

function buildAddContactPayload(fields) {
  return {
    name: fields.nameInput.value.trim(),
    email: fields.emailInput.value.trim(),
    phone: fields.phoneInput ? fields.phoneInput.value.trim() : ''
  };
}

function isValidAddContactPayload(payload) {
  return Boolean(payload.name && payload.email);
}

function getCurrentUserId() {
  return auth.currentUser ? auth.currentUser.uid : null;
}

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

function showSuccessMessage(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success_message';
  successDiv.textContent = message;
  document.body.appendChild(successDiv);
  setTimeout(() => {
    successDiv.remove();
  }, 2000);
}

function setupAddContactOverlayBackdrop(overlay) {
  overlay.onclick = (event) => {
    if (event.target === overlay || event.target.classList.contains('addContact_overlay')) {
      hideAddContactOverlay();
    }
  };
}

export function showAddContactOverlay() {
  const overlay = document.getElementById('contact-add-overlay');
  if (!overlay) return;
  overlay.innerHTML = getAddOverlayTemplate();
  overlay.style.display = 'flex';
  overlay.classList.remove('d_none');
  const addBtn = document.querySelector('.contact_mobile_add_btn');
  if (addBtn) addBtn.style.display = 'none';
  setupAddContactOverlayBackdrop(overlay);
  const form = document.getElementById('add_contact_form');
  if (form) {
    setupContactFormValidation(form);
    form.onsubmit = handleAddContact;
  }
}

export function hideAddContactOverlay() {
  const overlay = document.getElementById('contact-add-overlay');
  if (!overlay) return;
  overlay.style.display = 'none';
  overlay.innerHTML = '';
  overlay.onclick = null;
  const addBtn = document.querySelector('.contact_mobile_add_btn');
  if (addBtn && !document.body.classList.contains('contacts-mobile-detail-open')) {
    addBtn.style.display = '';
  }
}

export async function handleAddContact(event) {
  if (event) event.preventDefault();
  const fields = getContactFormFields('add_contact_form');
  if (!hasRequiredContactFields(fields)) return;
  if (!validateContactField(fields.nameInput) || !validateContactField(fields.emailInput) || !validateContactField(fields.phoneInput)) {
    return;
  }
  const payload = buildAddContactPayload(fields);
  if (!isValidAddContactPayload(payload)) return;
  const uid = getCurrentUserId();
  if (!uid) return;
  await saveNewContact(payload, uid);
  hideAddContactOverlay();
  showSuccessMessage('Contact successfully created!');
}
