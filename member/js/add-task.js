import { pushTask } from '../../scripts/firebase/push-task.js';
import { initAssignees, trackContactsForUser, getAssignedNames, clearSelectedAssignees } from './add-task-assignees.js';
import { initSubtasks, getSubtasks, clearSubtasks } from './add-task-subtasks.js';

/**
 * Initializes the Add Task page after the DOM is fully loaded.
 *
 * Sets up:
 * - assignee module (contacts dropdown and selection)
 * - subtask module (create, edit, delete)
 * - Firebase auth listener for loading contacts
 * - priority button handling
 * - create and clear button behavior
 *
 * @event DOMContentLoaded
 */
export function initAddTask(container, options = {}) {
  const createBtn = container.querySelector('.add-task__button--primary');
  const cancelBtn = container.querySelector('.add-task__button--secondary');
  const closeBtn = container.querySelector('.add-task-close-btn--page');
  const titleInput = container.querySelector('#title');
  const descInput = container.querySelector('#description');
  const dueInput = container.querySelector('#due_date');
  const categorySelect = container.querySelector('#category');
  const priorityButtons = container.querySelectorAll('.add-task__priority-button');

  let selectedPriority = null;

  /**
   * Sets the given priority button as selected and updates the priority state.
   *
   * @function applyPrioritySelection
   * @param {HTMLButtonElement|null} button - The priority button to activate.
   * @param {NodeListOf<HTMLButtonElement>} buttons - All available priority buttons.
   * @returns {void}
   */
  function applyPrioritySelection(button, buttons) {
    buttons.forEach((item) => item.classList.remove('selected'));

    if (!button) {
      selectedPriority = null;
      return;
    }
    button.classList.add('selected');
    selectedPriority =
      button.value ||
      button.getAttribute('value') ||
      button.textContent.trim();
  }

  /**
 * Closes the add-task page view.
 *
 * Navigates back in browser history when the previous page belongs
 * to the same origin. Otherwise redirects to the board page.
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
   * Finds a priority button by its priority value.
   *
   * @function findPriorityButton
   * @param {NodeListOf<HTMLButtonElement>} buttons - All priority buttons.
   * @param {string} priorityName - The priority value to search for.
   * @returns {HTMLButtonElement|undefined} The matching button, if found.
   */
  function findPriorityButton(buttons, priorityName) {
    return [...buttons].find((button) => {
      const buttonPriority =
        button.value ||
        button.getAttribute('value') ||
        button.textContent.trim();
      return buttonPriority.toLowerCase() === priorityName.toLowerCase();
    });
  }

  /**
   * Sets the default priority to "medium" on page load.
   *
   * @function setDefaultPriority
   * @returns {void}
   */
  function setDefaultPriority() {
    const mediumButton = findPriorityButton(priorityButtons, 'medium');
    applyPrioritySelection(mediumButton || null, priorityButtons);
  }

  const requiredFields = [titleInput, dueInput];
  setupRequiredFieldValidation(requiredFields);

  const assigneeState = initAssignees({
    assignedContainer: container.querySelector('#assigned_to'),
    assignedInput: container.querySelector('#assigned_to_input'),
    assignedTrigger: container.querySelector('#assigned_to_trigger'),
    assignedOptions: container.querySelector('#assigned_to_options'),
    selectedDisplay: container.querySelector('#selected_assignees_display')
  });

  trackContactsForUser(assigneeState);

  const subtaskState = initSubtasks(container, {
    subtaskInput: container.querySelector('#subtask'),
    subtaskActions: container.querySelector('#subtask_actions'),
    confirmSubtaskBtn: container.querySelector('#confirm_subtask_btn'),
    clearSubtaskBtn: container.querySelector('#clear_subtask_btn'),
    subtaskList: container.querySelector('#subtask_list')
  });

  setDefaultPriority();
  priorityButtons.forEach((btn) => {
    btn.addEventListener('click', (event) =>
      selectPriority(event, btn, priorityButtons)
    );
  });

  createBtn?.addEventListener('click', async (event) => {
    event.preventDefault();
    const isTitleValid = validateRequiredField(titleInput);
    const isDueValid = validateRequiredField(dueInput);
    if (!isTitleValid || !isDueValid) return;
    const taskData = buildTaskData();
    if (!taskData) return;
    await submitTask(taskData, createBtn, options, priorityButtons, clearAddTaskForm);
  });


  cancelBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    clearAddTaskForm(priorityButtons);
    if (options.mode === 'overlay' && typeof options.onClose === 'function') {
      options.onClose();
    }
  });

  if (options.mode === 'page') {
    closeBtn?.addEventListener('click', (event) => {
      event.preventDefault();
      closeAddTaskPage();
    });
  }

  /**
   * Handles priority button selection.
   *
   * Removes the "selected" class from all buttons,
   * sets it on the clicked button, and updates the selected priority value.
   *
   * @function selectPriority
   * @param {MouseEvent} event - The click event.
   * @param {HTMLButtonElement} button - The clicked button.
   * @param {NodeListOf<HTMLButtonElement>} buttons - All priority buttons.
   * @returns {void}
   */
  function selectPriority(event, button, buttons) {
    event.preventDefault();
    applyPrioritySelection(button, buttons);
  }

  /**
   * Resets the entire add-task form to its initial state.
   *
   * Clears:
   * - all input fields (title, description, due date, category)
   * - selected assignees
   * - subtasks
   * - validation error states
   *
   * Then restores "medium" as the default priority.
   *
   * @function clearAddTaskForm
   * @param {NodeListOf<HTMLButtonElement>} buttons - List of all priority buttons.
   * @returns {void}
   */
  function clearAddTaskForm(buttons) {
    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    if (dueInput) dueInput.value = '';
    if (categorySelect) categorySelect.selectedIndex = 0;
    clearSelectedAssignees(assigneeState);
    clearSubtasks(subtaskState);
    clearFieldError(titleInput);
    clearFieldError(dueInput);
    const mediumButton = findPriorityButton(buttons, 'medium');
    applyPrioritySelection(mediumButton || null, buttons);
  }

  /**
   * Builds the task object from current form values.
   *
   * Includes:
   * - title
   * - description
   * - due date
   * - priority
   * - assigned contacts
   * - category
   * - subtasks
   * - status
   * - creation timestamp
   *
   * @function buildTaskData
   * @returns {Object|null} The task data object, or null if required data is missing.
   */
  function buildTaskData() {
    const title = titleInput?.value?.trim();
    const dueDate = dueInput?.value || '';
    if (!title || !dueDate) return null;
    const overlay = document.getElementById('add_task_overlay');
    const status = overlay?.dataset.target || 'todo';
    return {
      title,
      description: descInput?.value?.trim() || '',
      due_date: dueDate,
      priority: selectedPriority || 'medium',
      assigned_to: getAssignedNames(assigneeState),
      category: categorySelect?.value || '',
      subtasks: getSubtasks(subtaskState),
      status,
      createdAt: new Date().toISOString()
    };
  }
}


/**
 * Validates a required form field.
 *
 * Adds an error class and shows the related error state
 * when the field is empty. Removes the error state when valid.
 *
 * @function validateRequiredField
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement|null} input - The field to validate.
 * @returns {boolean} True if the field is valid, otherwise false.
 */
function validateRequiredField(input) {
  if (!input) return false;
  const formField = input.closest('.form-field');
  if (!formField) return true;
  const isEmpty = input.value === '';
  if (isEmpty) {
    input.classList.add('input-error');
    formField.classList.add('error');
    return false;
  }
  input.classList.remove('input-error');
  formField.classList.remove('error');
  return true;
}

/**
 * Removes the visual error state from a field.
 *
 * @function clearFieldError
 * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement|null} input - The field to reset.
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
 * Validates fields on blur and removes the error state
 * while typing or changing the value.
 *
 * @function setupRequiredFieldValidation
 * @param {Array<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement|null>} fields - Required fields.
 * @returns {void}
 */
function setupRequiredFieldValidation(fields) {
  fields.forEach((field) => {
    field?.addEventListener('blur', () => {
      validateRequiredField(field);
    });
    field?.addEventListener('input', () => {
      if (field.classList.contains('input-error')) {
        validateRequiredField(field);
      }
    });
    field?.addEventListener('change', () => {
      if (field.classList.contains('input-error')) {
        validateRequiredField(field);
      }
    });
  });
}

/**
 * Submits a task to Firebase and handles UI feedback.
 *
 * Disables the create button during submission,
 * pushes the task to the database,
 * and redirects to the board page on success.
 *
 * @async
 * @function submitTask
 * @param {Object} taskData - The task object to store.
 * @param {HTMLButtonElement} createBtn - The create button element.
 * @param {Object} options - Additional options for task submission.
 * @param {Array<HTMLButtonElement>} priorityButtons - The priority buttons.
 * @param {Function} clearForm - Function to clear the form.
 * @returns {Promise<void>}
 */
async function submitTask(taskData, createBtn, options = {}, priorityButtons, clearForm) {
  createBtn.disabled = true;
  try {
    await pushTask(taskData);
    showTaskMessage('Task created successfully', 'success');
    if (options.mode === 'overlay') {
      clearForm(priorityButtons);
      if (typeof options.onSuccess === 'function') await options.onSuccess();
      if (typeof options.onClose === 'function') setTimeout(() => options.onClose(), 1000);
      return;
    }
    setTimeout(() => {
      window.location.href = './board.html';
    }, 1200);
  } catch (error) {
    console.error(error);
    showTaskMessage('Task could not be created', 'error');
  } finally {
    createBtn.disabled = false;
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.add-task__container');
  if (!container) return;
  initAddTask(container, { mode: 'page' });
});


/**
 * Displays a feedback message below the form.
 *
 * @function showTaskMessage
 * @param {string} message - Message text.
 * @param {'success'|'error'} type - Message type.
 * @returns {void}
 */
function showTaskMessage(message, type) {
  const el = document.getElementById('task_message');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('task-message--success', 'task-message--error');
  el.classList.add(`task-message--${type}`);
}


/**
 * Clears the task feedback message.
 *
 * @function clearTaskMessage
 * @returns {void}
 */
function clearTaskMessage() {
  const el = document.getElementById('task_message');
  if (!el) return;
  el.textContent = '';
  el.classList.remove('task-message--success', 'task-message--error');
}
