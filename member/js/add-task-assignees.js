import { database } from '../../scripts/firebase/firebase.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import {
  buildContactOptionElement,
  getAssignedNames,
  getSortedContacts,
  renderContactOptions,
  renderNoContacts,
  renderSelectedAssignees,
  syncSelectedAssigneesWithContacts,
  updateAssignedInput
} from './add-task-assignees-helpers.js';

/**
 * @file Orchestrates assignee dropdown behavior.
 *
 * @module add-task-assignees
 */

/**
 * Initializes the assignee module with all required DOM elements.
 *
 * @param {Object} elements - The DOM elements used by the assignee module.
 * @returns {Object} Assignee state object.
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
 * @param {Object} state - The current assignee state.
 * @returns {void}
 */
export function trackContactsForUser(state) {
  const contactsRef = ref(database, 'contacts');
  onValue(contactsRef, (snapshot) => {
    populateAssignedToDropdown(state, snapshot.val() || {});
  });
}

export { getAssignedNames, renderSelectedAssignees };

/**
 * Clears all selected assignees and refreshes the UI.
 *
 * @param {Object} state - The current assignee state.
 * @returns {void}
 */
export function clearSelectedAssignees(state) {
  state.selectedAssignees = [];
  updateAssignedInput(state);
  renderSelectedAssignees(state);
  populateAssignedToDropdown(state, state.currentContacts);
}

/**
 * Registers all assignee related event listeners.
 *
 * @param {Object} state - The current assignee state.
 * @returns {void}
 */
function bindAssigneeEvents(state) {
  state.assignedContainer?.addEventListener('click', (event) => {
    event.stopPropagation();
  });
  state.assignedTrigger?.addEventListener('click', (event) => handleTriggerClick(event, state));
  document.addEventListener('click', (event) => handleOutsideClick(event, state));
}

/**
 * Closes the dropdown when user clicks outside the assignee area.
 *
 * @param {MouseEvent} event - The document click event.
 * @param {Object} state - The current assignee state.
 * @returns {void}
 */
function handleOutsideClick(event, state) {
  if (!state.assignedContainer || state.assignedContainer.contains(event.target)) return;
  closeAssignedOptions(state);
}

/**
 * Handles clicks on the assignee trigger and toggles the options menu.
 *
 * @param {MouseEvent} event - Trigger click event.
 * @param {Object} state - The current assignee state.
 * @returns {void}
 */
function handleTriggerClick(event, state) {
  event.preventDefault();
  toggleAssignedOptions(state);
}

/**
 * Populates assignee options from current contact data.
 *
 * @param {Object} state - The current assignee state.
 * @param {Object<string, Object>} contacts - Contacts map from Firebase.
 * @returns {void}
 */
function populateAssignedToDropdown(state, contacts) {
  if (!state.assignedOptions) return;
  state.currentContacts = contacts || {};
  syncSelectedAssigneesWithContacts(state);
  renderSelectedAssignees(state);
  renderAssignedOptions(state);
}

/**
 * Renders all dropdown options or the empty state.
 *
 * @param {Object} state - The current assignee state.
 * @returns {void}
 */
function renderAssignedOptions(state) {
  state.assignedOptions.innerHTML = '';
  const entries = getSortedContacts(state.currentContacts);
  if (entries.length === 0) {
    renderNoContacts(state);
    return;
  }

  renderContactOptions(state, entries, buildContactOptionElement);
}

/**
 * Hides the assignee options list.
 *
 * @param {Object} state - The current assignee state.
 * @returns {void}
 */
function closeAssignedOptions(state) {
  state.assignedOptions?.classList.add('d_none');
}

/**
 * Toggles the visibility of the assignee options list.
 *
 * @param {Object} state - The current assignee state.
 * @returns {void}
 */
function toggleAssignedOptions(state) {
  state.assignedOptions?.classList.toggle('d_none');
}
