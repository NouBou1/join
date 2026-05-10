import { pushTask } from '../../scripts/firebase/push-task.js';
import {
  initAssignees,
  trackContactsForUser,
  getAssignedNames,
  clearSelectedAssignees
} from './add-task-assignees.js';
import {
  initSubtasks,
  getSubtasks,
  clearSubtasks
} from './add-task-subtasks.js';


/**
 * Initializes the Add Task page or overlay.
 *
 * @param {HTMLElement|Document} container - The Add Task container.
 * @param {Object} options - Optional mode and callback settings.
 * @returns {void}
 */
export function initAddTask(container, options = {}) {
  const state = createAddTaskState(container, options);

  setMinimumDueDate(state.dueInput);
  setupRequiredFieldValidation([state.titleInput, state.dueInput]);

  state.assigneeState = initAssignees(getAssigneeElements(container));
  trackContactsForUser(state.assigneeState);

  state.subtaskState = initSubtasks(container, getSubtaskElements(container));

  setDefaultPriority(state);
  bindPriorityEvents(state);
  bindActionEvents(state);
}


/**
 * Creates the shared Add Task state.
 *
 * @param {HTMLElement|Document} container - The Add Task container.
 * @param {Object} options - Optional mode and callback settings.
 * @returns {Object} The Add Task state object.
 */
function createAddTaskState(container, options) {
  return {
    container,
    options,
    createBtn: container.querySelector('.add-task__button--primary'),
    cancelBtn: container.querySelector('.add-task__button--secondary'),
    closeBtn: container.querySelector('.add-task-close-btn--page'),
    titleInput: container.querySelector('#title'),
    descInput: container.querySelector('#description'),
    dueInput: container.querySelector('#due_date'),
    categorySelect: container.querySelector('#category'),
    priorityButtons: container.querySelectorAll('.add-task__priority-button'),
    selectedPriority: null,
    assigneeState: null,
    subtaskState: null
  };
}


/**
 * Gets all assignee related DOM elements.
 *
 * @param {HTMLElement|Document} container - The Add Task container.
 * @returns {Object} The assignee element references.
 */
function getAssigneeElements(container) {
  return {
    assignedContainer: container.querySelector('#assigned_to'),
    assignedInput: container.querySelector('#assigned_to_input'),
    assignedTrigger: container.querySelector('#assigned_to_trigger'),
    assignedOptions: container.querySelector('#assigned_to_options'),
    selectedDisplay: container.querySelector('#selected_assignees_display')
  };
}


/**
 * Gets all subtask related DOM elements.
 *
 * @param {HTMLElement|Document} container - The Add Task container.
 * @returns {Object} The subtask element references.
 */
function getSubtaskElements(container) {
  return {
    subtaskInput: container.querySelector('#subtask'),
    subtaskActions: container.querySelector('#subtask_actions'),
    confirmSubtaskBtn: container.querySelector('#confirm_subtask_btn'),
    clearSubtaskBtn: container.querySelector('#clear_subtask_btn'),
    subtaskList: container.querySelector('#subtask_list')
  };
}


/**
 * Registers priority button events.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {void}
 */
function bindPriorityEvents(state) {
  state.priorityButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      selectPriority(event, button, state);
    });
  });
}


/**
 * Registers create, clear and close button events.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {void}
 */
function bindActionEvents(state) {
  bindCreateEvent(state);
  bindClearEvent(state);
  bindCloseEvent(state);
}


/**
 * Registers the create task button event.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {void}
 */
function bindCreateEvent(state) {
  state.createBtn?.addEventListener('click', async (event) => {
    event.preventDefault();

    const isTitleValid = validateRequiredField(state.titleInput);
    const isDueValid = validateDueDateField(state.dueInput);

    if (!isTitleValid || !isDueValid) return;

    const taskData = buildTaskData(state);
    if (!taskData) return;

    await submitTask(state, taskData);
  });
}


/**
 * Registers the clear button event.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {void}
 */
function bindClearEvent(state) {
  state.cancelBtn?.addEventListener('click', (event) => {
    event.preventDefault();

    clearAddTaskForm(state);

    if (state.options.mode === 'overlay' && typeof state.options.onClose === 'function') {
      state.options.onClose();
    }
  });
}


/**
 * Registers the page close button event.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {void}
 */
function bindCloseEvent(state) {
  if (state.options.mode !== 'page') return;

  state.closeBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    closeAddTaskPage();
  });
}


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
function setDefaultPriority(state) {
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
function selectPriority(event, button, state) {
  event.preventDefault();
  applyPrioritySelection(button, state);
}


/**
 * Clears the complete Add Task form.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {void}
 */
function clearAddTaskForm(state) {
  if (state.titleInput) state.titleInput.value = '';
  if (state.descInput) state.descInput.value = '';
  if (state.dueInput) state.dueInput.value = '';
  if (state.categorySelect) state.categorySelect.selectedIndex = 0;

  clearSelectedAssignees(state.assigneeState);
  clearSubtasks(state.subtaskState);
  clearFieldError(state.titleInput);
  clearFieldError(state.dueInput);
  clearTaskMessage(state);
  setDefaultPriority(state);
}


/**
 * Builds the task object from the current form values.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {Object|null} The task data object.
 */
function buildTaskData(state) {
  const title = state.titleInput?.value?.trim();
  const dueDate = state.dueInput?.value || '';

  if (!title || !dueDate) return null;

  return {
    title,
    description: state.descInput?.value?.trim() || '',
    due_date: dueDate,
    priority: state.selectedPriority || 'medium',
    assigned_to: getAssignedNames(state.assigneeState),
    category: state.categorySelect?.value || '',
    subtasks: getSubtasks(state.subtaskState),
    status: getTaskStatus(),
    createdAt: new Date().toISOString()
  };
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
function closeAddTaskPage() {
  const hasReferrer = Boolean(document.referrer);
  const isInternalReferrer = hasReferrer && new URL(document.referrer).origin === window.location.origin;

  if (isInternalReferrer && window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.href = './board.html';
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
function setMinimumDueDate(input) {
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
function setupRequiredFieldValidation(fields) {
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
 * Submits a task to Firebase and handles UI feedback.
 *
 * @param {Object} state - The Add Task state object.
 * @param {Object} taskData - The task data object.
 * @returns {Promise<void>}
 */
async function submitTask(state, taskData) {
  state.createBtn.disabled = true;

  try {
    await pushTask(taskData);
    await handleSubmitSuccess(state);
  } catch (error) {
    console.error(error);
    showTaskMessage(state, 'Task could not be created', 'error');
  } finally {
    state.createBtn.disabled = false;
  }
}


/**
 * Handles successful task creation.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {Promise<void>}
 */
async function handleSubmitSuccess(state) {
  showTaskMessage(state, 'Task created successfully', 'success');

  if (state.options.mode === 'overlay') {
    await handleOverlaySuccess(state);
    return;
  }

  setTimeout(() => {
    window.location.href = './board.html';
  }, 1200);
}


/**
 * Handles successful task creation inside the overlay.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {Promise<void>}
 */
async function handleOverlaySuccess(state) {
  clearAddTaskForm(state);

  if (typeof state.options.onSuccess === 'function') {
    await state.options.onSuccess();
  }

  if (typeof state.options.onClose === 'function') {
    setTimeout(() => state.options.onClose(), 1000);
  }
}


/**
 * Displays a feedback message below the form.
 *
 * @param {Object} state - The Add Task state object.
 * @param {string} message - Message text.
 * @param {'success'|'error'} type - Message type.
 * @returns {void}
 */
function showTaskMessage(state, message, type) {
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


/**
 * Initializes the standalone Add Task page.
 */
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.add-task__container');

  if (!container) return;

  initAddTask(container, { mode: 'page' });
});