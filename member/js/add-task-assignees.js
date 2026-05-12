import { database } from '../../scripts/firebase/firebase.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const AVATAR_COLORS = [
  '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF',
  '#00BEE8', '#1FD7C1', '#FF745E', '#FFA35E',
  '#FC71FF', '#FFC701', '#0038FF', '#C3FF2B'
];

/**
 * Initializes the assignee module with all required DOM elements.
 *
 * Stores references to the assigned-to UI elements and
 * registers the necessary event listeners.
 *
 * @function initAssignees
 * @param {Object} elements - The DOM elements used by the assignee module.
 * @param {HTMLElement|null} elements.assignedContainer - The assigned-to wrapper element.
 * @param {HTMLInputElement|null} elements.assignedInput - The hidden input for selected assignees.
 * @param {HTMLButtonElement|null} elements.assignedTrigger - The dropdown trigger button.
 * @param {HTMLElement|null} elements.assignedOptions - The dropdown options container.
 * @param {HTMLElement|null} elements.selectedDisplay - The container showing selected assignee avatars.
 * @returns {void}
 */
export function initAssignees(elements) {
  const state = {
    assignedContainer: elements.assignedContainer,
    assignedInput: elements.assignedInput,
    assignedTrigger: elements.assignedTrigger,
    assignedOptions: elements.assignedOptions,
    selectedDisplay: elements.selectedDisplay,
    selectedAssignees: [],
    currentContacts: {}
  };
  bindAssigneeEvents(state);
  return state;
}

/**
 * Starts listening for contact changes in Firebase.
 *
 * Whenever the contacts data changes, the assigned-to dropdown
 * is re-rendered with the latest contact list.
 *
 * @function trackContactsForUser
 * @returns {void}
 */
export function trackContactsForUser(state) {
  const contactsRef = ref(database, 'contacts');
  onValue(contactsRef, (snapshot) => {
    populateAssignedToDropdown(state, snapshot.val() || {});
  });
}

/**
 * Transforms selected assignees into an indexed object
 * suitable for Firebase storage.
 *
 * Each selected contact is stored as a separate entry:
 * {
 *   0: "Name1",
 *   1: "Name2"
 * }
 *
 * @function getAssignedNames
 * @returns {Object<number, string>} Object containing selected assignee names.
 */
export function getAssignedNames(state) {
  return state.selectedAssignees.reduce((result, item, index) => {
    result[index] = item.name;
    return result;
  }, {});
}

/**
 * Clears all selected assignees and refreshes the UI.
 *
 * Resets the hidden input, avatar display and dropdown checkbox state.
 *
 * @function clearSelectedAssignees
 * @returns {void}
 */
export function clearSelectedAssignees(state) {
  state.selectedAssignees = [];
  updateAssignedInput(state);
  renderSelectedAssignees(state);
  populateAssignedToDropdown(state, state.currentContacts);
}

/**
 * Registers all event listeners for the assignee UI.
 *
 * @function bindAssigneeEvents
 * @returns {void}
 */
function bindAssigneeEvents(state) {
  state.assignedContainer?.addEventListener('click', (event) => {
    event.stopPropagation();
  });
  state.assignedTrigger?.addEventListener('click', (event) =>
    handleTriggerClick(event, state)
  );
  document.addEventListener('click', (event) => handleOutsideClick(event, state));
}

/**
 * Closes the dropdown when clicking outside the assigned-to container.
 *
 * @function handleOutsideClick
 * @param {MouseEvent} event - The document click event.
 * @returns {void}
 */
function handleOutsideClick(event, state) {
  if (!state.assignedContainer || state.assignedContainer.contains(event.target)) return;
  closeAssignedOptions(state);
}

/**
 * Handles clicks on the assigned-to dropdown trigger.
 *
 * Prevents default button behavior and toggles the dropdown.
 *
 * @function handleTriggerClick
 * @param {MouseEvent} event - The trigger click event.
 * @returns {void}
 */
function handleTriggerClick(event, state) {
  event.preventDefault();
  toggleAssignedOptions(state);
}

/**
 * Creates initials from a contact name.
 *
 * Uses the first character of up to two words and converts them to uppercase.
 *
 * @function getInitials
 * @param {string} name - The full contact name.
 * @returns {string} The generated initials.
 */
function getInitials(name) {
  return name.split(' ').map((word) => word.charAt(0).toUpperCase()).slice(0, 2).join('');
}

/**
 * Generates a positive numeric hash from a string.
 *
 * @function hashString
 * @param {string} value - The string to hash.
 * @returns {number} The generated hash value.
 */
function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = value.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

/**
 * Returns a stable avatar color based on the contact name.
 *
 * @function getAvatarColor
 * @param {string} name - The contact name.
 * @returns {string} A hex color value from the avatar color list.
 */
function getAvatarColor(name) {
  return AVATAR_COLORS[hashString(name || '') % AVATAR_COLORS.length];
}

/**
 * Normalizes raw contact data for UI rendering.
 *
 * @function getContactData
 * @param {string} id - The contact id.
 * @param {Object} contact - The contact object.
 * @param {string} [contact.name] - The display name of the contact.
 * @returns {{id: string, name: string, initials: string, avatarColor: string}} Normalized contact data.
 */
function getContactData(id, contact) {
  const name = contact.name || `Contact (${id})`;
  return { id, name, initials: getInitials(name), avatarColor: getAvatarColor(name) };
}

/**
 * Checks whether a contact is currently selected.
 *
 * @function isSelected
 * @param {string} id - The contact id.
 * @returns {boolean} True if the contact is selected, otherwise false.
 */
function isSelected(state, id) {
  return state.selectedAssignees.some((item) => item.id === id);
}

/**
 * Updates the hidden input with the selected assignee names.
 *
 * @function updateAssignedInput
 * @returns {void}
 */
function updateAssignedInput(state) {
  if (state.assignedInput) {
    state.assignedInput.value = JSON.stringify(getAssignedNames(state));
  }
}

/**
 * Renders the selected assignee avatars below the input field.
 *
 * @function renderSelectedAssignees
 * @returns {void}
 */
// function renderSelectedAssignees(state) {
//   if (!state.selectedDisplay) return;
//   state.selectedDisplay.innerHTML = state.selectedAssignees
//     .map((item) => {
//       return `<span class="add-task__avatar" title="${item.name}" style="background-color: ${item.avatarColor}">
//         ${item.initials}
//       </span>`;
//     })
//     .join('');
// }

function renderSelectedAssignees(state) {
  if (!state.selectedDisplay) return;
  const visible = state.selectedAssignees.slice(0, 3); 
  const remaining = state.selectedAssignees.length - 3;  
  
  const avatarsHTML = visible
    .map((item) => {
      return `<span class="add-task__avatar" title="${item.name}" style="background-color: ${item.avatarColor}">
        ${item.initials}
      </span>`;
    })
    .join('');
  
  const extraHTML = remaining > 0 
    ? `<span class="add-task__avatar add-task__avatar--extra" title="${remaining} more assignees">+${remaining}</span>`
    : '';
  
  state.selectedDisplay.innerHTML = avatarsHTML + extraHTML;
}

/**
 * Adds or removes a contact from the current selection.
 *
 * After updating the selection, the hidden input and avatar display are refreshed.
 *
 * @function toggleAssignee
 * @param {{id: string, name: string, initials: string, avatarColor: string}} contactData - The contact to toggle.
 * @returns {void}
 */
function toggleAssignee(state, contactData) {
  state.selectedAssignees = isSelected(state, contactData.id)
    ? state.selectedAssignees.filter((item) => item.id !== contactData.id)
    : [...state.selectedAssignees, contactData];
  updateAssignedInput(state);
  renderSelectedAssignees(state);
}

/**
 * Creates a checkbox element for a contact option.
 *
 * @function buildCheckbox
 * @param {boolean} checked - Whether the checkbox should be checked initially.
 * @returns {HTMLInputElement} The created checkbox element.
 */
function buildCheckbox(checked) {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'custom-select__checkbox';
  checkbox.checked = checked;
  return checkbox;
}

/**
 * Creates the main visual content for a contact option.
 *
 * @function buildOptionMain
 * @param {{name: string, initials: string, avatarColor: string}} data - The contact display data.
 * @returns {HTMLDivElement} The created contact content element.
 */
function buildOptionMain(data) {
  const main = document.createElement('div');
  main.className = 'custom-select__option-main';
  main.innerHTML = `
    <span class="add-task__avatar" style="background-color: ${data.avatarColor}">${data.initials}</span>
    <span class="custom-select__option-label">${data.name}</span>
  `;
  return main;
}

/**
 * Toggles a contact selection and synchronizes the checkbox state.
 *
 * @function syncOptionToggle
 * @param {{id: string, name: string, initials: string, avatarColor: string}} data - The contact data.
 * @param {HTMLInputElement} checkbox - The checkbox to synchronize.
 * @returns {void}
 */
function syncOptionToggle(state, data, checkbox) {
  toggleAssignee(state, data);
  checkbox.checked = isSelected(state, data.id);
}

/**
 * Creates one selectable contact option for the dropdown.
 *
 * @function buildContactOptionElement
 * @param {string} id - The contact id.
 * @param {Object} contact - The contact object.
 * @returns {HTMLDivElement} The rendered dropdown option.
 */
function buildContactOptionElement(state, id, contact) {
  const data = getContactData(id, contact);
  const option = document.createElement('div');
  const main = buildOptionMain(data);
  const checkbox = buildCheckbox(isSelected(state, id));
  option.className = 'custom-select__option';
  option.append(main, checkbox);
  option.addEventListener('click', () => syncOptionToggle(state, data, checkbox));
  checkbox.addEventListener('click', (event) => event.stopPropagation());
  checkbox.addEventListener('change', () => toggleAssignee(state, data));
  return option;
}

/**
 * Sorts contact entries alphabetically by name.
 *
 * @function getSortedContacts
 * @param {Object<string, Object>} contacts - The contacts object.
 * @returns {Array<[string, Object]>} Sorted contact entries.
 */
function getSortedContacts(contacts) {
  return Object.entries(contacts || {}).sort(([, a], [, b]) => (a.name || '').localeCompare(b.name || ''));
}

/**
 * Renders an empty-state message when no contacts exist.
 *
 * @function renderNoContacts
 * @returns {void}
 */
function renderNoContacts(state) {
  const empty = document.createElement('div');
  empty.className = 'custom-select__empty';
  empty.textContent = 'No contacts found (add a contact first)';
  state.assignedOptions.appendChild(empty);
}

/**
 * Renders all contact options into the dropdown.
 *
 * @function renderContactOptions
 * @param {Array<[string, Object]>} entries - Sorted contact entries.
 * @returns {void}
 */
function renderContactOptions(state, entries) {
  entries.forEach(([id, contact]) =>
    state.assignedOptions.appendChild(
      buildContactOptionElement(state, id, contact)
    )
  );
}

/**
 * Populates the assigned-to dropdown with contact entries.
 *
 * Stores the current contacts and renders either the contact list
 * or an empty-state message.
 *
 * @function populateAssignedToDropdown
 * @param {Object<string, Object>} contacts - The contacts object from Firebase.
 * @returns {void}
 */
function populateAssignedToDropdown(state, contacts) {
  if (!state.assignedOptions) return;
  state.currentContacts = contacts || {};
  state.assignedOptions.innerHTML = '';
  const entries = getSortedContacts(state.currentContacts);
  if (entries.length === 0) {
    renderNoContacts(state);
    return;
  }
  renderContactOptions(state, entries);
}

/**
 * Closes the assigned-to dropdown menu.
 *
 * @function closeAssignedOptions
 * @returns {void}
 */
function closeAssignedOptions(state) {
  state.assignedOptions?.classList.add('d_none');
}

/**
 * Toggles the visibility of the assigned-to dropdown menu.
 *
 * @function toggleAssignedOptions
 * @returns {void}
 */
function toggleAssignedOptions(state) {
  state.assignedOptions?.classList.toggle('d_none');
}
