import {
  getAssignedNames,
  clearSelectedAssignees
} from './add-task-assignees.js';
import {
  getSubtasks,
  clearSubtasks
} from './add-task-subtasks.js';


/**
 * Sets the given priority button as selected.
 *
 * @param {HTMLButtonElement|null} button - The priority button to activate.
 * @param {Object} state - The Add Task state object.
 * @returns {void}
 */
function applyPrioritySelection(button, state) {
  state.priorityButtons.forEach((item) => item.classList.remove('selected'));

  if (!button) {
    state.selectedPriority = null;
    return;
  }

  button.classList.add('selected');
  state.selectedPriority = getPriorityValue(button);
}


/**
 * Returns the priority value of a button.
 *
 * @param {HTMLButtonElement} button - The priority button.
 * @returns {string} The priority value.
 */
function getPriorityValue(button) {
  return button.value || button.getAttribute('value') || button.textContent.trim();
}


/**
 * Finds a priority button by its priority value.
 *
 * @param {NodeListOf<HTMLButtonElement>} buttons - All priority buttons.
 * @param {string} priorityName - The priority value to search for.
 * @returns {HTMLButtonElement|undefined} The matching button.
 */
function findPriorityButton(buttons, priorityName) {
  return [...buttons].find((button) => {
    return getPriorityValue(button).toLowerCase() === priorityName.toLowerCase();
  });
}


/**
 * Sets the default priority to medium.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {void}
 */
export function setDefaultPriority(state) {
  const mediumButton = findPriorityButton(state.priorityButtons, 'medium');

  applyPrioritySelection(mediumButton || null, state);
}


/**
 * Handles priority button selection.
 *
 * @param {MouseEvent} event - The click event.
 * @param {HTMLButtonElement} button - The clicked priority button.
 * @param {Object} state - The Add Task state object.
 * @returns {void}
 */
export function selectPriority(event, button, state) {
  event.preventDefault();
  applyPrioritySelection(button, state);
}


/**
 * Clears the complete Add Task form.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {void}
 */
export function clearAddTaskForm(state) {
  clearInputValues(state);
  clearSelectedAssignees(state.assigneeState);
  clearSubtasks(state.subtaskState);
  clearFieldError(state.titleInput);
  clearFieldError(state.dueInput);
  clearFieldError(state.categoryInput);
  state.categoryTrigger?.classList.remove('input-error');
  clearTaskMessage(state);
  setDefaultPriority(state);
}


/**
 * Clears all basic form input values.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {void}
 */
function clearInputValues(state) {
  if (state.titleInput) state.titleInput.value = '';
  if (state.descInput) state.descInput.value = '';
  if (state.dueInput) state.dueInput.value = '';
  if (state.categorySelect) state.categorySelect.selectedIndex = 0;
  if (state.categoryInput) state.categoryInput.value = '';
  if (state.categoryTriggerLabel) state.categoryTriggerLabel.textContent = 'Select task category';
  state.categoryOptions?.classList.add('d_none');
  state.categoryTrigger?.setAttribute('aria-expanded', 'false');
}


/**
 * Builds and validates the task object.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {Object|null} The task data object.
 */
export function buildTaskData(state) {
  const isTitleValid = validateRequiredField(state.titleInput);
  const isDueValid = validateDueDateField(state.dueInput);
  const isCategoryValid = validateCategorySelection(state);

  if (!isTitleValid || !isDueValid || !isCategoryValid) return null;

  return createTaskData(state);
}


/**
 * Creates the task object from the current form values.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {Object} The task data object.
 */
function createTaskData(state) {
  return {
    title: state.titleInput.value.trim(),
    description: state.descInput?.value?.trim() || '',
    due_date: state.dueInput.value,
    priority: state.selectedPriority || 'medium',
    assigned_to: getAssignedNames(state.assigneeState),
    category: state.categoryInput?.value || state.categorySelect?.value || '',
    subtasks: getSubtasks(state.subtaskState),
    status: getTaskStatus(),
    createdAt: new Date().toISOString()
  };
}


function validateCategorySelection(state) {
  if (!state.categoryInput) return true;
  const isEmpty = state.categoryInput.value.trim() === '';
  state.categoryTrigger?.classList.toggle('input-error', isEmpty);
  state.categoryField?.classList.toggle('error', isEmpty);
  return !isEmpty;
}


/**
 * Returns the current task status.
 *
 * @returns {string} The target board status.
 */
function getTaskStatus() {
  const overlay = document.getElementById('add_task_overlay');

  return overlay?.dataset.target || 'todo';
}


/**
 * Closes the add-task page view.
 *
 * @returns {void}
 */
export function closeAddTaskPage() {
  const hasReferrer = Boolean(document.referrer);
  const isInternalReferrer = hasReferrer && isSameOriginReferrer();

  if (isInternalReferrer && window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.href = './board.html';
}


/**
 * Checks whether the referrer belongs to the same origin.
 *
 * @returns {boolean} True when the referrer is internal.
 */
function isSameOriginReferrer() {
  return new URL(document.referrer).origin === window.location.origin;
}


/**
 * Returns today's date as a local YYYY-MM-DD string.
 *
 * @returns {string} Today's date in YYYY-MM-DD format.
 */
function getTodayDateString() {
  const today = new Date();

  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());

  return today.toISOString().split('T')[0];
}


/**
 * Sets the minimum selectable due date to today.
 *
 * @param {HTMLInputElement|null} input - The due date input field.
 * @returns {void}
 */
export function setMinimumDueDate(input) {
  if (!input) return;

  input.min = getTodayDateString();
}


/**
 * Validates a required form field.
 *
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement|null} input - The field to validate.
 * @returns {boolean} True if the field is valid.
 */
function validateRequiredField(input) {
  if (!input) return false;

  const formField = input.closest('.form-field');
  const isEmpty = input.value.trim() === '';

  input.classList.toggle('input-error', isEmpty);
  formField?.classList.toggle('error', isEmpty);

  return !isEmpty;
}


/**
 * Validates the due date field.
 *
 * @param {HTMLInputElement|null} input - The due date input field.
 * @returns {boolean} True if the due date is valid.
 */
function validateDueDateField(input) {
  if (!validateRequiredField(input)) return false;

  if (input.value < getTodayDateString()) {
    showFieldError(input);
    return false;
  }

  clearFieldError(input);
  return true;
}


/**
 * Shows the visual error state of a field.
 *
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement|null} input - The field.
 * @returns {void}
 */
function showFieldError(input) {
  if (!input) return;

  const formField = input.closest('.form-field');

  input.classList.add('input-error');
  formField?.classList.add('error');
}


/**
 * Removes the visual error state from a field.
 *
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement|null} input - The field.
 * @returns {void}
 */
function clearFieldError(input) {
  if (!input) return;

  const formField = input.closest('.form-field');

  input.classList.remove('input-error');
  formField?.classList.remove('error');
}


/**
 * Sets up validation listeners for required fields.
 *
 * @param {Array<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement|null>} fields - Required fields.
 * @returns {void}
 */
export function setupRequiredFieldValidation(fields) {
  fields.forEach((field) => {
    field?.addEventListener('blur', () => validateField(field));
    field?.addEventListener('input', () => validateField(field));
    field?.addEventListener('change', () => validateField(field));
  });
}


/**
 * Validates a form field.
 *
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement|null} field - The field to validate.
 * @returns {boolean} True if the field is valid.
 */
function validateField(field) {
  if (field?.id === 'due_date') {
    return validateDueDateField(field);
  }

  return validateRequiredField(field);
}


/**
 * Displays a feedback message below the form.
 *
 * @param {Object} state - The Add Task state object.
 * @param {string} message - Message text.
 * @param {'success'|'error'} type - Message type.
 * @returns {void}
 */
export function showTaskMessage(state, message, type) {
  const el = state.container.querySelector('#task_message');

  if (!el) return;

  el.textContent = message;
  el.classList.remove('task-message--success', 'task-message--error');
  el.classList.add(`task-message--${type}`);
}


/**
 * Clears the task feedback message.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {void}
 */
function clearTaskMessage(state) {
  const el = state.container.querySelector('#task_message');

  if (!el) return;

  el.textContent = '';
  el.classList.remove('task-message--success', 'task-message--error');
}