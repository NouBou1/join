const AVATAR_COLORS = [
  '#FF7A00', '#FF5EB3', '#6E52FF', '#9327FF',
  '#00BEE8', '#1FD7C1', '#FF745E', '#FFA35E',
  '#FC71FF', '#FFC701', '#0038FF', '#C3FF2B'
];

/**
 * Converts selected assignees into an indexed object for storage.
 *
 * @param {Object} state - Current assignee state.
 * @returns {Object<number, string>} Indexed assignee names.
 */
export function getAssignedNames(state) {
  return state.selectedAssignees.reduce((result, item, index) => {
    result[index] = item.name;
    return result;
  }, {});
}

/**
 * Creates initials from a contact name.
 *
 * @param {string} name - Full contact name.
 * @returns {string} Uppercase initials.
 */
function getInitials(name) {
  return name.split(' ').map((word) => word.charAt(0).toUpperCase()).slice(0, 2).join('');
}

/**
 * Builds a stable numeric hash for a string.
 *
 * @param {string} value - Input value.
 * @returns {number} Positive hash value.
 */
function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = value.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
}

/**
 * Returns a deterministic avatar color for a contact name.
 *
 * @param {string} name - Contact name.
 * @returns {string} Hex color value.
 */
function getAvatarColor(name) {
  return AVATAR_COLORS[hashString(name || '') % AVATAR_COLORS.length];
}

/**
 * Normalizes one contact object for dropdown rendering.
 *
 * @param {string} id - Contact id.
 * @param {Object} contact - Raw contact object.
 * @returns {{id: string, name: string, initials: string, avatarColor: string}} Normalized contact data.
 */
function getContactData(id, contact) {
  const name = contact.name || `Contact (${id})`;
  return { id, name, initials: getInitials(name), avatarColor: getAvatarColor(name) };
}

/**
 * Checks whether a contact is currently selected.
 *
 * @param {Object} state - Current assignee state.
 * @param {string} id - Contact id.
 * @returns {boolean} True when selected.
 */
function isSelected(state, id) {
  const contactName = state.currentContacts?.[id]?.name;
  return state.selectedAssignees.some((item) => item.id === id || item.name === contactName);
}

/**
 * Mirrors selected assignees into the hidden input field.
 *
 * @param {Object} state - Current assignee state.
 * @returns {void}
 */
export function updateAssignedInput(state) {
  if (state.assignedInput) {
    state.assignedInput.value = JSON.stringify(getAssignedNames(state));
  }
}

/**
 * Renders selected assignee avatars and the overflow badge.
 *
 * @param {Object} state - Current assignee state.
 * @returns {void}
 */
export function renderSelectedAssignees(state) {
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
 * Removes an assignee from the selected list.
 *
 * @param {Object} state - Current assignee state.
 * @param {{id: string, name: string}} contactData - Contact to remove.
 * @returns {Array<Object>} Updated selection.
 */
function removeSelectedAssignee(state, contactData) {
  return state.selectedAssignees.filter((item) => item.id !== contactData.id && item.name !== contactData.name);
}

/**
 * Toggles one assignee in the current selection.
 *
 * @param {Object} state - Current assignee state.
 * @param {{id: string, name: string, initials: string, avatarColor: string}} contactData - Contact data.
 * @returns {void}
 */
function toggleAssignee(state, contactData) {
  state.selectedAssignees = isSelected(state, contactData.id)
    ? removeSelectedAssignee(state, contactData)
    : [...state.selectedAssignees, contactData];
  updateAssignedInput(state);
  renderSelectedAssignees(state);
}

/**
 * Creates a checkbox node for one option row.
 *
 * @param {boolean} checked - Initial checked state.
 * @returns {HTMLInputElement} Checkbox element.
 */
function buildCheckbox(checked) {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'custom-select__checkbox';
  checkbox.checked = checked;
  return checkbox;
}

/**
 * Creates the main visual content for an option row.
 *
 * @param {{name: string, initials: string, avatarColor: string}} data - Contact display data.
 * @returns {HTMLDivElement} Main content element.
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
 * Synchronizes UI state after toggling an option row.
 *
 * @param {Object} state - Current assignee state.
 * @param {{id: string, name: string, initials: string, avatarColor: string}} data - Contact display data.
 * @param {HTMLInputElement} checkbox - Option checkbox.
 * @returns {void}
 */
function syncOptionToggle(state, data, checkbox) {
  toggleAssignee(state, data);
  checkbox.checked = isSelected(state, data.id);
}

/**
 * Builds one selectable contact option row.
 *
 * @param {Object} state - Current assignee state.
 * @param {string} id - Contact id.
 * @param {Object} contact - Raw contact data.
 * @returns {HTMLDivElement} Rendered option element.
 */
export function buildContactOptionElement(state, id, contact) {
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
 * Sorts contacts alphabetically by name.
 *
 * @param {Object<string, Object>} contacts - Contacts map.
 * @returns {Array<[string, Object]>} Sorted entries.
 */
export function getSortedContacts(contacts) {
  return Object.entries(contacts || {}).sort(([, a], [, b]) => (a.name || '').localeCompare(b.name || ''));
}

/**
 * Renders empty-state message for the options list.
 *
 * @param {Object} state - Current assignee state.
 * @returns {void}
 */
export function renderNoContacts(state) {
  const empty = document.createElement('div');
  empty.className = 'custom-select__empty';
  empty.textContent = 'No contacts found (add a contact first)';
  state.assignedOptions.appendChild(empty);
}

/**
 * Renders all contact options into the dropdown list.
 *
 * @param {Object} state - Current assignee state.
 * @param {Array<[string, Object]>} entries - Sorted contact entries.
 * @param {(state: Object, id: string, contact: Object) => HTMLElement} buildOptionElement - Option builder.
 * @returns {void}
 */
export function renderContactOptions(state, entries, buildOptionElement) {
  entries.forEach(([id, contact]) => {
    state.assignedOptions.appendChild(buildOptionElement(state, id, contact));
  });
}

/**
 * Finds a matching contact for a selected assignee.
 *
 * @param {Object} state - Current assignee state.
 * @param {{id: string, name: string}} assignee - Selected assignee.
 * @returns {[string, Object]|null} Matching entry or null.
 */
function findContactByAssignee(state, assignee) {
  const entries = Object.entries(state.currentContacts || {});
  return entries.find(([id, contact]) => id === assignee.id || contact.name === assignee.name) || null;
}

/**
 * Replaces fallback assignee values with current contact data.
 *
 * @param {Object} state - Current assignee state.
 * @returns {void}
 */
export function syncSelectedAssigneesWithContacts(state) {
  state.selectedAssignees = state.selectedAssignees.map((item) => {
    const match = findContactByAssignee(state, item);
    return match ? getContactData(match[0], match[1]) : item;
  });
}
