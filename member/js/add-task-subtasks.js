/**
 * Initializes the subtask module with all required DOM elements.
 *
 * Stores references to the subtask UI elements
 * and registers the required event listeners.
 *
 * @function initSubtasks
 * @param {Object} elements - The DOM elements used by the subtask module.
 * @param {HTMLInputElement|null} elements.subtaskInput - The subtask text input.
 * @param {HTMLElement|null} elements.subtaskActions - The container for the subtask action buttons.
 * @param {HTMLButtonElement|null} elements.confirmSubtaskBtn - The confirm button for adding a subtask.
 * @param {HTMLButtonElement|null} elements.clearSubtaskBtn - The clear button for resetting the subtask input.
 * @param {HTMLElement|null} elements.subtaskList - The container for the rendered subtask list.
 * @returns {void}
 */
export function initSubtasks(container, elements) {
  const state = {
    container,
    subtaskInput: elements.subtaskInput,
    subtaskActions: elements.subtaskActions,
    confirmSubtaskBtn: elements.confirmSubtaskBtn,
    clearSubtaskBtn: elements.clearSubtaskBtn,
    subtaskList: elements.subtaskList,
    subtasks: [],
    editingSubtaskIndex: -1
  };
  bindSubtaskEvents(state);
  return state;
}

/**
 * Transforms the internal subtask array into a structured object
 * suitable for Firebase storage.
 *
 * Each subtask is converted into an object containing:
 * - a unique key (e.g. "Subtask1", "Subtask2")
 * - a boolean status (default: false)
 * - the subtask title
 *
 * Example output:
 * {
 *   Subtask1: { status: false, title: "First subtask" },
 *   Subtask2: { status: false, title: "Second subtask" }
 * }
 *
 * @function getSubtasks
 * @returns {Object<string, {status: boolean, title: string}>}
 * An object containing all subtasks formatted for Firebase.
 */
export function getSubtasks(state) {
  return state.subtasks.reduce((result, title, index) => {
    result[`Subtask${index + 1}`] = {
      status: false,
      title
    };
    return result;
  }, {});
}

/**
 * Clears all subtasks and resets the editing state.
 *
 * Re-renders the list and clears the input field.
 *
 * @function clearSubtasks
 * @returns {void}
 */
export function clearSubtasks(state) {
  state.subtasks = [];
  state.editingSubtaskIndex = -1;
  renderSubtasks(state);
  clearSubtaskInput(state);
}

/**
 * Registers all event listeners for the subtask UI.
 *
 * @function bindSubtaskEvents
 * @returns {void}
 */
function bindSubtaskEvents(state) {
  state.subtaskInput?.addEventListener('input', () => toggleSubtaskActions(state));
  state.subtaskInput?.addEventListener('keydown', (event) => handleSubtaskKeydown(event, state));
  state.confirmSubtaskBtn?.addEventListener('click', () => addSubtask(state));
  state.clearSubtaskBtn?.addEventListener('click', () => clearSubtaskInput(state));
  state.subtaskList?.addEventListener('click', (event) => handleSubtaskListClick(event, state));
}

/**
 * Handles the Enter key inside the subtask input.
 *
 * Prevents the default behavior and adds the current subtask.
 *
 * @function handleSubtaskKeydown
 * @param {KeyboardEvent} event - The keyboard event from the subtask input.
 * @returns {void}
 */
function handleSubtaskKeydown(event, state) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  addSubtask(state);
}

/**
 * Shows or hides the subtask action buttons
 * depending on whether the input contains text.
 *
 * @function toggleSubtaskActions
 * @returns {void}
 */
function toggleSubtaskActions(state) {
  if (!state.subtaskActions || !state.subtaskInput) return;
  state.subtaskActions.classList.toggle('d_none', !state.subtaskInput.value.trim());
}

/**
 * Clears the subtask input and resets edit mode.
 *
 * @function clearSubtaskInput
 * @returns {void}
 */
function clearSubtaskInput(state) {
  if (!state.subtaskInput) return;
  state.subtaskInput.value = '';
  state.editingSubtaskIndex = -1;
  toggleSubtaskActions(state);
}

/**
 * Adds a new subtask to the list.
 *
 * @function saveNewSubtask
 * @param {string} value - The subtask text to add.
 * @returns {void}
 */
function saveNewSubtask(state, value) {
  state.subtasks = [...state.subtasks, value];
}

/**
 * Updates an existing subtask at the current edit index.
 *
 * @function saveEditedSubtask
 * @param {string} value - The updated subtask text.
 * @returns {void}
 */
function saveEditedSubtask(state, value) {
  state.subtasks[state.editingSubtaskIndex] = value;
  state.editingSubtaskIndex = -1;
}

/**
 * Saves a subtask either as a new entry
 * or as an edited existing entry.
 *
 * @function saveSubtaskValue
 * @param {string} value - The subtask text to save.
 * @returns {void}
 */
function saveSubtaskValue(state, value) {
  if (state.editingSubtaskIndex > -1) {
    saveEditedSubtask(state, value);
    return;
  }
  saveNewSubtask(state, value);
}

/**
 * Creates the text element for a rendered subtask item.
 *
 * @function createSubtaskText
 * @param {string} text - The subtask text.
 * @returns {HTMLSpanElement} The created subtask text element.
 */
function createSubtaskText(text) {
  const span = document.createElement('span');
  span.className = 'subtask-item-text';
  span.textContent = text;
  return span;
}

/**
 * Creates the action button container for one subtask item.
 *
 * Includes the edit and delete buttons.
 *
 * @function createSubtaskActions
 * @param {number} index - The index of the subtask.
 * @returns {HTMLDivElement} The created action container.
 */
function createSubtaskActions(index) {
  const actions = document.createElement('div');
  actions.className = 'subtask-item-actions';
  actions.innerHTML = `
    <button type="button" class="subtask-icon-btn" data-edit="${index}"><img src="../assets/icons/pencil-icon.svg" alt="Edit"></button>
    <span class="subtask-item-divider">|</span>
    <button type="button" class="subtask-icon-btn" data-delete="${index}"><img src="../assets/icons/trash-icon.svg" alt="Delete"></button>
  `;
  return actions;
}

/**
 * Builds one rendered subtask item.
 *
 * @function buildSubtaskItem
 * @param {string} text - The subtask text.
 * @param {number} index - The index of the subtask.
 * @returns {HTMLDivElement} The rendered subtask item element.
 */
function buildSubtaskItem(text, index) {
  const item = document.createElement('div');
  item.className = 'subtask-item';
  item.append(createSubtaskText(text), createSubtaskActions(index));
  return item;
}

/**
 * Renders all subtasks into the subtask list container.
 *
 * @function renderSubtasks
 * @returns {void}
 */
function renderSubtasks(state) {
  if (!state.subtaskList) return;
  state.subtaskList.innerHTML = '';
  state.subtasks.forEach((text, index) => {
    state.subtaskList.appendChild(buildSubtaskItem(text, index));
  });
}

/**
 * Adds a new subtask or saves the currently edited subtask.
 *
 * Uses the current input value, updates the list,
 * re-renders the UI and clears the input afterward.
 *
 * @function addSubtask
 * @returns {void}
 */
function addSubtask(state) {
  const value = state.subtaskInput?.value.trim();
  if (!value) return;
  saveSubtaskValue(state, value);
  renderSubtasks(state);
  clearSubtaskInput(state);
}

/**
 * Loads a subtask into the input field for editing.
 *
 * Sets the current edit index, shows the action buttons
 * and focuses the input field.
 *
 * @function editSubtask
 * @param {number} index - The index of the subtask to edit.
 * @returns {void}
 */
function editSubtask(state, index) {
  if (!state.subtaskInput) return;
  state.subtaskInput.value = state.subtasks[index] || '';
  state.editingSubtaskIndex = index;
  toggleSubtaskActions(state);
  state.subtaskInput.focus();
}

/**
 * Deletes a subtask by its index and re-renders the list.
 *
 * @function deleteSubtask
 * @param {number} index - The index of the subtask to delete.
 * @returns {void}
 */
function deleteSubtask(state, index) {
  state.subtasks = state.subtasks.filter((_, i) => i !== index);
  renderSubtasks(state);
}

/**
 * Handles clicks on edit and delete buttons inside the subtask list.
 *
 * Detects the clicked action using the data attributes
 * and forwards the action to the correct handler.
 *
 * @function handleSubtaskListClick
 * @param {MouseEvent} event - The click event from the subtask list.
 * @returns {void}
 */
function handleSubtaskListClick(event, state) {
  const editIndex = event.target.dataset.edit;
  const deleteIndex = event.target.dataset.delete;
  if (editIndex !== undefined) editSubtask(state, Number(editIndex));
  if (deleteIndex !== undefined) deleteSubtask(state, Number(deleteIndex));
}
