import { pushTask } from '../../scripts/firebase/push-task.js';
import {
  initAssignees,
  trackContactsForUser
} from './add-task-assignees.js';
import { initSubtasks } from './add-task-subtasks.js';
import {
  setMinimumDueDate,
  setupRequiredFieldValidation,
  setDefaultPriority,
  selectPriority,
  clearAddTaskForm,
  buildTaskData,
  closeAddTaskPage,
  showTaskMessage
} from './add-task-form.js';


/**
 * Initializes the Add Task page or overlay.
 *
 * @param {HTMLElement|Document} container - The Add Task container.
 * @param {Object} options - Optional mode and callback settings.
 * @returns {void}
 */
export function initAddTask(container, options = {}) {
  const state = createAddTaskState(container, options);

  setupBaseForm(state);
  setupAssignees(state, container);
  setupCategory(state);
  setupSubtasks(state, container);
  setupPriority(state);
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
    ...getActionElements(container),
    ...getFormElements(container),
    ...getCategoryElements(container),
    priorityButtons: container.querySelectorAll('.add-task__priority-button'),
    selectedPriority: null,
    assigneeState: null,
    subtaskState: null
  };
}


function getActionElements(container) {
  return {
    createBtn: container.querySelector('.add-task__button--primary'),
    cancelBtn: container.querySelector('.add-task__button--secondary'),
    closeBtn: container.querySelector('.add-task-close-btn--page')
  };
}


function getFormElements(container) {
  return {
    titleInput: container.querySelector('#title'),
    descInput: container.querySelector('#description'),
    dueInput: container.querySelector('#due_date'),
    categorySelect: container.querySelector('#category')
  };
}


function getCategoryElements(container) {
  return {
    categoryField: container.querySelector('#category_field'),
    categoryContainer: container.querySelector('#category_select'),
    categoryTrigger: container.querySelector('#category_trigger'),
    categoryTriggerLabel: container.querySelector('#category_trigger_label'),
    categoryOptions: container.querySelector('#category_options'),
    categoryInput: container.querySelector('#category_input')
  };
}


/**
 * Sets up base form behavior.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {void}
 */
function setupBaseForm(state) {
  setMinimumDueDate(state.dueInput);
  setupRequiredFieldValidation([state.titleInput, state.dueInput]);
}


/**
 * Initializes the assignee module.
 *
 * @param {Object} state - The Add Task state object.
 * @param {HTMLElement|Document} container - The Add Task container.
 * @returns {void}
 */
function setupAssignees(state, container) {
  state.assigneeState = initAssignees(getAssigneeElements(container));
  trackContactsForUser(state.assigneeState);
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


function setupCategory(state) {
  bindCategoryToggle(state);
  bindCategorySelect(state);
  bindCategoryOutsideClose(state);
}


function bindCategoryToggle(state) {
  state.categoryTrigger?.addEventListener('click', (event) => {
    event.preventDefault();
    const isClosed = state.categoryOptions?.classList.contains('d_none');
    state.categoryOptions?.classList.toggle('d_none');
    state.categoryTrigger?.setAttribute('aria-expanded', String(isClosed));
  });
}


function bindCategorySelect(state) {
  state.categoryOptions?.addEventListener('click', (event) => {
    const option = event.target.closest('.custom-select__option');
    if (!option) return;
    applyCategoryOption(state, option);
  });
}


function applyCategoryOption(state, option) {
  const value = option.dataset.value || '';
  const label = option.textContent?.trim() || 'Select task category';
  if (state.categoryInput) state.categoryInput.value = value;
  if (state.categoryTriggerLabel) state.categoryTriggerLabel.textContent = label;
  state.categoryOptions?.querySelectorAll('.custom-select__option').forEach((item) => {
    item.classList.toggle('is-selected', item === option);
  });
  state.categoryTrigger?.classList.remove('input-error');
  state.categoryField?.classList.remove('error');
  closeCategoryOptions(state);
}


function bindCategoryOutsideClose(state) {
  document.addEventListener('click', (event) => {
    if (state.categoryContainer?.contains(event.target)) return;
    closeCategoryOptions(state);
  });
}


function closeCategoryOptions(state) {
  state.categoryOptions?.classList.add('d_none');
  state.categoryTrigger?.setAttribute('aria-expanded', 'false');
}


/**
 * Initializes the subtask module.
 *
 * @param {Object} state - The Add Task state object.
 * @param {HTMLElement|Document} container - The Add Task container.
 * @returns {void}
 */
function setupSubtasks(state, container) {
  state.subtaskState = initSubtasks(container, getSubtaskElements(container));
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
 * Sets up priority behavior.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {void}
 */
function setupPriority(state) {
  setDefaultPriority(state);
  bindPriorityEvents(state);
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
    closeOverlayAfterClear(state);
  });
}


/**
 * Closes the overlay after using the clear button.
 *
 * @param {Object} state - The Add Task state object.
 * @returns {void}
 */
function closeOverlayAfterClear(state) {
  if (state.options.mode !== 'overlay') return;
  if (typeof state.options.onClose !== 'function') return;

  state.options.onClose();
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

  redirectToBoard();
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
 * Redirects the user to the board page.
 *
 * @returns {void}
 */
function redirectToBoard() {
  setTimeout(() => {
    window.location.href = './board.html';
  }, 1200);
}


/**
 * Initializes the standalone Add Task page.
 */
document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.add-task__container');

  if (!container) return;

  initAddTask(container, { mode: 'page' });
});