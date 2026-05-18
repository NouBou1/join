/**
 * @file Renders the contacts list and contact detail view,
 * including mobile-specific detail behavior.
 *
 * @module contacts-render
 */
import { getActiveContactTemplate, getContactItemTemplate } from './member-templates.js';

let contacts = {};

let activeContactId = null;

const MOBILE_BREAKPOINT = 822;

let isMobileDetailOpen = false;

/**
 * Checks whether the current viewport width is within the mobile range.
 *
 * @returns {boolean} True if the viewport is mobile-sized, otherwise false.
 */
function isMobileViewport() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

/**
 * Switches the contacts page between mobile list and detail view modes.
 *
 * Updates the body class and the internal mobile detail state.
 *
 * @param {"list"|"detail"} mode - The mobile contacts view mode to activate.
 * @returns {void}
 */
function setMobileView(mode) {
  const body = document.body;
  if (!body) return;
  body.classList.toggle('contacts-mobile-detail-open', mode === 'detail');
  isMobileDetailOpen = mode === 'detail';
}

/**
 * Opens the mobile contact detail view.
 *
 * Switches to detail mode on mobile devices and hides the mobile add button.
 *
 * @returns {void}
 */
function openMobileDetailView() {
  if (!isMobileViewport()) return;
  setMobileView('detail');
  const addBtn = document.querySelector('.contact_mobile_add_btn');
  if (addBtn) addBtn.style.display = 'none';
}

/**
 * Closes the mobile contact detail view.
 *
 * Switches back to list mode on mobile devices and shows the mobile add button again.
 *
 * @returns {void}
 */
export function closeMobileDetailView() {
  if (!isMobileViewport()) return;
  setMobileView('list');
  const addBtn = document.querySelector('.contact_mobile_add_btn');
  if (addBtn) addBtn.style.display = '';
}

/**
 * Groups contacts alphabetically by the first letter of their name.
 *
 * Each contact is extended with its id and added to the corresponding letter group.
 * Every group is sorted alphabetically by contact name.
 *
 * @param {Object<string, Object>} contactsObjects - Contacts indexed by contact id.
 * @returns {Object<string, Array<Object>>} Contacts grouped by first letter.
 */
function groupContactsByLetter(contactsObjects) {
  const grouped = {};
  Object.entries(contactsObjects).forEach(([id, contact]) => {
    const firstLetter = contact.name.charAt(0).toUpperCase();
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push({
      id: id,
      ...contact
    });
  });
  Object.keys(grouped).forEach(letter => {
    grouped[letter].sort((a, b) => a.name.localeCompare(b.name));
  });
  return grouped;
}

/**
 * Renders the full contacts list and refreshes the active contact detail view.
 *
 * Updates the internal contacts state, renders the grouped contact list,
 * refreshes the active contact detail if needed, and resets mobile detail mode on desktop.
 *
 * @param {Object<string, Object>} contactsObjects - Contacts indexed by contact id.
 * @returns {void}
 */
export function renderContactsList(contactsObjects) {
  contacts = contactsObjects || {};
  const contactList = getContactListElement();
  if (!contactList) return;
  renderGroupedContacts(contactList, contacts);
  rerenderActiveContactDetail(contacts);
  if (!isMobileViewport() && isMobileDetailOpen) {
    setMobileView('list');
  }
}

/**
 * Returns the DOM element used as the contacts list container.
 *
 * @returns {HTMLElement|null} The contacts list element, if found.
 */
function getContactListElement() {
  return document.getElementById('contact_list');
}

/**
 * Renders the contacts list grouped alphabetically.
 *
 * Resets the list content except for the add button
 * and then renders all alphabetical sections.
 *
 * @param {HTMLElement} contactList - The contacts list container.
 * @param {Object<string, Object>} contactsObjects - Contacts indexed by contact id.
 * @returns {void}
 */
function renderGroupedContacts(contactList, contactsObjects) {
  const groupedContacts = groupContactsByLetter(contactsObjects);
  resetContactListExceptAddButton(contactList);
  renderAlphabeticalContactSections(contactList, groupedContacts);
}

/**
 * Re-renders the currently active contact detail view if possible.
 *
 * @param {Object<string, Object>} contactsObjects - Contacts indexed by contact id.
 * @returns {void}
 */
function rerenderActiveContactDetail(contactsObjects) {
  if (!activeContactId) return;
  const activeContact = contactsObjects[activeContactId];
  if (!activeContact) return;
  renderActiveContactTemplate(activeContact);
}

/**
 * Clears the contacts list while preserving the add-contact button.
 *
 * @param {HTMLElement} contactList - The contacts list container.
 * @returns {void}
 */
function resetContactListExceptAddButton(contactList) {
  const addButton = contactList.querySelector('.contact_btn_addNew');
  contactList.innerHTML = '';
  if (addButton) {
    contactList.appendChild(addButton);
  }
}

/**
 * Renders all alphabetical contact sections from A to Z.
 *
 * @param {HTMLElement} contactList - The contacts list container.
 * @param {Object<string, Array<Object>>} groupedContacts - Contacts grouped by first letter.
 * @returns {void}
 */
function renderAlphabeticalContactSections(contactList, groupedContacts) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  alphabet.forEach(letter => {
    if (!groupedContacts[letter]) return;
    createLetterSectionHeader(contactList, letter);
    renderContactsUnderLetter(contactList, letter, groupedContacts);
  });
}

/**
 * Appends a letter heading and divider for one contact section.
 *
 * @param {HTMLElement} contactList - The contacts list container.
 * @param {string} letter - The current section letter.
 * @returns {void}
 */
function createLetterSectionHeader(contactList, letter) {
  const letterLabel = document.createElement('label');
  letterLabel.className = 'labelfor_contactList';
  letterLabel.textContent = letter;
  contactList.appendChild(letterLabel);
  const divider = document.createElement('hr');
  divider.className = 'hr_contactList';
  contactList.appendChild(divider);
}

/**
 * Renders all contacts belonging to one alphabet letter.
 *
 * @param {HTMLElement} contactList - The contacts list container.
 * @param {string} letter - The current section letter.
 * @param {Object<string, Array<Object>>} groupedContacts - Contacts grouped by first letter.
 * @returns {void}
 */
function renderContactsUnderLetter(contactList, letter, groupedContacts) {
  if (!groupedContacts[letter]) return;
  const contactsOrderedList = document.createElement('ol');
  groupedContacts[letter].forEach(contact => {
    const contactItem = buildContactListItem(contact);
    contactsOrderedList.appendChild(contactItem);
  });
  contactList.appendChild(contactsOrderedList);
}

/**
 * Creates one clickable contact list item element.
 *
 * Marks the item as active when it matches the current active contact
 * and registers the click handler for opening the contact detail view.
 *
 * @param {Object} contact - The contact data used for the list item.
 * @param {string} contact.id - The contact id.
 * @returns {HTMLLIElement} The rendered contact list item.
 */
function buildContactListItem(contact) {
  const listItem = document.createElement('li');
  listItem.className = 'contact_item';
  listItem.dataset.contactId = contact.id;
  listItem.innerHTML = getContactItemTemplate(contact);
  if (contact.id === activeContactId) {
    listItem.classList.add('contact_item--active');
  }
  listItem.addEventListener('click', () => {
    setActiveContact(contact.id, contact);
  });
  return listItem;
}

/**
 * Sets a contact as active and updates the UI accordingly.
 *
 * Updates the active contact id, highlights the selected list item,
 * renders the contact detail view, and opens mobile detail mode if needed.
 *
 * @param {string} contactId - The id of the contact to activate.
 * @param {Object} contactData - The active contact data.
 * @returns {void}
 */
function setActiveContact(contactId, contactData) {
  setActiveContactId(contactId);
  clearActiveContactClass();
  activateContactListItem(contactId);
  renderActiveContactDetail(contactData);
  openMobileDetailView();
}

/**
 * Stores the id of the currently active contact.
 *
 * @param {string|null} contactId - The active contact id, or null to clear it.
 * @returns {void}
 */
export function setActiveContactId(contactId) {
  activeContactId = contactId;
}

/**
 * Returns the id of the currently active contact.
 *
 * @returns {string|null} The active contact id, or null if none is selected.
 */
export function getActiveContactId() {
  return activeContactId;
}

/**
 * Removes the active CSS class from all contact list items.
 *
 * @returns {void}
 */
function clearActiveContactClass() {
  document.querySelectorAll('.contact_item--active')
    .forEach(element => element.classList.remove('contact_item--active'));
}

/**
 * Applies the active CSS class to the given contact list item.
 *
 * @param {string} contactId - The id of the contact to highlight.
 * @returns {void}
 */
function activateContactListItem(contactId) {
  const item = getContactListItemById(contactId);
  if (!item) return;
  item.classList.add('contact_item--active');
}

/**
 * Returns the contact list item element for a given contact id.
 *
 * @param {string} contactId - The contact id to look up.
 * @returns {HTMLElement|null} The matching contact list item, if found.
 */
function getContactListItemById(contactId) {
  return document.querySelector(`[data-contact-id="${contactId}"]`);
}

/**
 * Renders the detail view for the currently selected contact.
 *
 * @param {Object} contactData - The contact data to render.
 * @returns {void}
 */
function renderActiveContactDetail(contactData) {
  renderActiveContactTemplate(contactData);
}

/**
 * Renders the active contact detail template into the detail container.
 *
 * Computes initials, avatar color, and a fallback phone value
 * before injecting the generated template HTML.
 *
 * @param {Object} contact - The contact to render.
 * @param {string} [contact.name] - The contact name.
 * @param {string} [contact.phone] - The contact phone number.
 * @returns {void}
 */

export function renderActiveContactTemplate(contact) {
  const container = getContactDetailContainer();
  if (!container) return;
  const initials = getInitials(contact.name || '');
  const bgColor = getAvatarColor(contact.name || '');
  const phone = contact.phone || '-';
  container.innerHTML = getActiveContactTemplate(contact, initials, bgColor, phone);
  
  // Registriere click handler auf detail card zum Menü schließen
  const detailCard = container.querySelector('.contact_detail_card');
  if (detailCard) {
    detailCard.onclick = (event) => {
      const menu = document.getElementById('contact_mobile_actions_menu');
      const fab = document.querySelector('.contact_mobile_fab_btn');
      
      if (menu && !menu.classList.contains('d_none') && 
          !fab?.contains(event.target) && 
          !menu.contains(event.target)) {
        window.closeContactMobileActions();
      }
    };
  }
}

/**
 * Returns the DOM container used for contact detail rendering.
 *
 * Supports multiple fallback selectors for different layouts.
 *
 * @returns {HTMLElement|null} The contact detail container, if found.
 */
export function getContactDetailContainer() {
  return (
    document.getElementById('contact_detail') ||
    document.getElementById('contact-detail') ||
    document.querySelector('.contact_detail')
  );
}

/**
 * Creates initials from a contact name.
 *
 * Uses the first character of up to two name parts
 * and converts them to uppercase.
 *
 * @param {string} name - The full contact name.
 * @returns {string} The generated initials.
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Returns a stable avatar color for a contact name.
 *
 * Uses a hashed version of the name to select one color
 * from the predefined avatar color list.
 *
 * @param {string} name - The contact name.
 * @returns {string} A hex color value for the contact avatar.
 */
export function getAvatarColor(name) {
  const colors = [
    '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF',
    '#00BEE8', '#1FD7C1', '#FF745E', '#FFA35E',
    '#FC71FF', '#FFC701', '#0038FF', '#C3FF2B'
  ];
  let hash = 0;
  for (let indexContacts = 0; indexContacts < name.length; indexContacts++) {
    hash = name.charCodeAt(indexContacts) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}


window.closeMobileDetailView = closeMobileDetailView;
