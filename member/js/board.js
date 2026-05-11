import { loadTasks } from '/scripts/firebase/get-firebase.js';
import { getTaskOverlayTemplate, getEditTaskOverlayTemplate } from './member-templates.js';
import { ref, onValue, remove, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { database } from "../../scripts/firebase/firebase.js";
import { updateHTML, todos } from './drag-n-drop.js';
import { initAssignees, trackContactsForUser, getAssignedNames } from './add-task-assignees.js';
import { initSubtasks, getSubtasks } from './add-task-subtasks.js';


export let tasks = {};


/**
 * Sets today's date as the minimum selectable edit due date.
 *
 * @returns {void}
 */
function setMinEditDueDate() {
  const dueInput = document.getElementById('edit_due_date');
  if (!dueInput) return;
  const today = new Date().toISOString().split('T')[0];
  dueInput.min = today;
}


/**
 * Loads all tasks from Firebase and stores them
 * in the local `tasks` collection.
 *
 * @async
 * @returns {Promise<void>} Resolves when the tasks have been loaded.
 */
export async function initTasks() {
  tasks = await loadTasks();
}

/**
 * Synchronizes the local `tasks` collection with the board `todos` object.
 *
 * Updates only task entries that already exist in `todos`
 * and replaces them with the latest task data.
 *
 * @returns {void}
 */
function syncTasksAndTodos() {
  Object.keys(tasks).forEach(taskId => {
    if (todos[taskId]) {
      todos[taskId] = { ...tasks[taskId] };
    }
  });
}

initTasks();

const columns = {
  /** @type {HTMLElement|null} */ todo: document.getElementById('todo'),
  /** @type {HTMLElement|null} */ inProgress: document.getElementById('inProgress'),
  /** @type {HTMLElement|null} */ awaitFeedback: document.getElementById('awaitFeedback'),
  /** @type {HTMLElement|null} */ done: document.getElementById('done'),
};

/**
 * Opens the task detail overlay for the given task.
 *
 * Renders the task data into the overlay container,
 * shows the overlay, and registers the backdrop click handler.
 *
 * @param {string} taskId - The id of the task to display.
 * @returns {void}
 */
function openTaskOverlay(taskId) {
  const task = tasks[taskId];
  if (!task) return console.warn("Task nicht gefunden:", taskId);
  const overlayContainer = document.getElementById("overlay_container");
  overlayContainer.innerHTML = getTaskOverlayTemplate(
    taskId,
    task.category,
    task.title,
    task.description,
    task.due_date,
    task.priority,
    task.assigned_to,
    task.subtasks,
  );
  overlayContainer.classList.remove('d_none');
  setTimeout(() => {
    overlayContainer.classList.add('show');
  }, 10);
  overlayContainer.addEventListener('click', handleOverlayClick);
}


window.openTaskOverlay = openTaskOverlay;

/**
 * Handles clicks on the task overlay backdrop.
 *
 * Closes the overlay when the user clicks directly
 * on the overlay container outside the content.
 *
 * @param {MouseEvent} event - The click event on the overlay container.
 * @returns {void}
 */
function handleOverlayClick(event) {
  const overlayContainer = document.getElementById("overlay_container");
  if (event.target === overlayContainer) {
    closeTaskOverlay();
  }
}

/**
 * Closes the task overlay and removes its click listener.
 *
 * @returns {void}
 */
function closeTaskOverlay() {
  const overlayContainer = document.getElementById("overlay_container");
  overlayContainer.classList.remove('show');
  overlayContainer.classList.add('d_none');
  overlayContainer.removeEventListener('click', handleOverlayClick);
}


window.closeTaskOverlay = closeTaskOverlay;

/**
 * Toggles the completion status of a subtask checkbox.
 *
 * Updates the subtask status in Firebase, synchronizes the local task data,
 * swaps the checkbox icon, and refreshes the board UI.
 *
 * @async
 * @param {HTMLImageElement} img - The clicked checkbox image element.
 * @returns {Promise<void>} Resolves when the toggle operation is complete.
 */
async function toggleCheckbox(img) {
  const taskId = img.dataset.taskId;
  const subtaskKey = img.dataset.subtaskKey;
  if (!taskId || !subtaskKey) return;
  try {
    const currentStatus = tasks[taskId]?.subtasks?.[subtaskKey]?.status || false;
    const newStatus = !currentStatus;
    await update(ref(database, `tasks/${taskId}/subtasks/${subtaskKey}`), {
      status: newStatus
    });
    if (tasks[taskId]?.subtasks?.[subtaskKey]) {
      tasks[taskId].subtasks[subtaskKey].status = newStatus;
    }
    if (todos[taskId]?.subtasks?.[subtaskKey]) {
      todos[taskId].subtasks[subtaskKey].status = newStatus;
    }
    img.src = newStatus
      ? "../assets/icons/checkbox/checkbox-icon-checked.svg"
      : "../assets/icons/checkbox/checkbox-icon-unchecked.svg";
    updateHTML();
  } catch (error) {
    console.error("Error toggling subtask:", error);
  }
}


document.addEventListener("click", (e) => {
  if (e.target.classList.contains("checkbox-icon")) {
    toggleCheckbox(e.target);
  }
});

/**
 * Deletes a task from Firebase and updates the board UI.
 *
 * Removes the task from the database, deletes it from the local board state,
 * closes the task overlay, and refreshes the board rendering.
 *
 * @async
 * @param {string} taskId - The id of the task to delete.
 * @returns {Promise<void>} Resolves when the delete process is complete.
 */
async function deleteTask(taskId) {
  try {
    await remove(ref(database, `tasks/${taskId}`));
    delete todos[taskId];
    closeTaskOverlay();
    updateHTML();
  } catch (error) {
    console.error("Error deleting task:", error);
  }
}


window.deleteTask = deleteTask;

/**
 * Renders the edit-task overlay for the given task.
 *
 * Inserts the generated edit form HTML into the overlay container.
 *
 * @param {string} taskId - The id of the task being edited.
 * @param {Object} task - The task object to render in edit mode.
 * @returns {void}
 */
function renderEditOverlay(taskId, task) {
  const overlayContainer = document.getElementById("overlay_container");
  overlayContainer.innerHTML = getEditTaskOverlayTemplate(
    taskId, task.category, task.title, task.description,
    task.due_date, task.priority, task.assigned_to, task.subtasks
  );
}

/**
 * Registers click handlers for the priority buttons
 * inside the edit-task overlay.
 *
 * Ensures that only one priority button is marked as selected.
 *
 * @returns {void}
 */
function setupPriorityButtons() {
  document.querySelectorAll('.add-task__priority-button').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.add-task__priority-button').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
}

/**
 * Initializes the assignee module for edit mode.
 *
 * Collects all required edit-overlay DOM elements,
 * starts contact tracking, and returns the assignee state object.
 *
 * @returns {Object} The initialized assignee state.
 */
function initializeEditAssignees() {
  const assigneeState = initAssignees({
    assignedContainer: document.getElementById('edit_assigned_to'),
    assignedInput: document.getElementById('edit_assigned_to_input'),
    assignedTrigger: document.getElementById('edit_assigned_to_trigger'),
    assignedOptions: document.getElementById('edit_assigned_to_options'),
    selectedDisplay: document.getElementById('edit_selected_assignees_display')
  });
  trackContactsForUser(assigneeState);
  return assigneeState;
}

/**
 * Initializes the subtasks module for edit mode.
 *
 * Uses the edit overlay elements and returns the subtask state object.
 *
 * @param {HTMLElement} container - Overlay container
 * @returns {Object} Subtask state
 */
function initializeEditSubtasks(container) {
  return initSubtasks(container, {
    subtaskInput: document.getElementById('edit_subtask'),
    subtaskActions: document.getElementById('edit_subtask_actions'),
    confirmSubtaskBtn: document.getElementById('edit_confirm_subtask_btn'),
    clearSubtaskBtn: document.getElementById('edit_clear_subtask_btn'),
    subtaskList: document.getElementById('edit_subtask_list_new')
  });
}

/**
 * Opens the edit mode for a task.
 *
 * Renders the edit overlay, initializes priority handling,
 * assignee handling, and subtask handling, and stores the current edit state globally.
 *
 * @param {string} taskId - The id of the task to edit.
 * @returns {void}
 */
function editTask(taskId) {
  const task = tasks[taskId];
  if (!task) return console.warn("Task nicht gefunden:", taskId);
  renderEditOverlay(taskId, task);
  setMinEditDueDate();
  setupPriorityButtons();
  window.editAssigneeState = initializeEditAssignees();
  window.editSubtaskState = initializeEditSubtasks(document.getElementById("overlay_container"));
  window.currentTaskId = taskId;
}


window.editTask = editTask;

/**
 * Collects the current values from the edit-task form.
 *
 * Reads the edited title, description, due date, priority,
 * selected assignees, and newly created subtasks.
 *
 * @returns {{
 *   title: string,
 *   description: string,
 *   due_date: string,
 *   priority: string,
 *   assignedNames: Object<number, string>,
 *   newSubtasks: Object
 * }} The collected edit form data.
 */
function collectEditFormData() {
  return {
    title: document.getElementById('edit_title').value,
    description: document.getElementById('edit_description').value,
    due_date: document.getElementById('edit_due_date').value,
    priority: document.querySelector('.add-task__priority-button.selected')?.dataset.priority || 'medium',
    assignedNames: window.editAssigneeState ? getAssignedNames(window.editAssigneeState) : {},
    newSubtasks: window.editSubtaskState ? getSubtasks(window.editSubtaskState) : {}
  };
}

/**
 * Builds the update payload for an edited task.
 *
 * Combines the edited base fields with optional assignee updates
 * and merged subtask data.
 *
 * @param {string} taskId - The id of the task being updated.
 * @param {Object} formData - The collected edit form data.
 * @returns {Object} The task update object for Firebase.
 */
function buildTaskUpdateObject(taskId, formData) {
  const updatedTask = {
    title: formData.title,
    description: formData.description,
    due_date: formData.due_date,
    priority: formData.priority
  };
  if (Object.keys(formData.assignedNames).length > 0) {
    updatedTask.assigned_to = formData.assignedNames;
  }
  const existingSubtasks = tasks[taskId]?.subtasks || {};
  const mergedSubtasks = { ...existingSubtasks, ...formData.newSubtasks };
  if (Object.keys(mergedSubtasks).length > 0) {
    updatedTask.subtasks = mergedSubtasks;
  }
  return updatedTask;
}

/**
 * Updates a task in Firebase and synchronizes the local task collection.
 *
 * @async
 * @param {string} taskId - The id of the task to update.
 * @param {Object} updatedTask - The update payload for the task.
 * @returns {Promise<void>} Resolves when the task update is complete.
 */
async function updateTaskInFirebase(taskId, updatedTask) {
  await update(ref(database, `tasks/${taskId}`), updatedTask);
  tasks[taskId] = { ...tasks[taskId], ...updatedTask };
}


/**
 * Refreshes the board data and reopens the task overlay.
 *
 * Reloads all tasks, synchronizes board state, updates the board HTML,
 * and shows the refreshed task details again.
 *
 * @async
 * @param {string} taskId - The id of the task to reopen.
 * @re
 */

async function refreshBoardAndShowTask(taskId) {
  await initTasks();
  syncTasksAndTodos();
  updateHTML();
  openTaskOverlay(taskId);
}

/**
 * Saves the edited task data.
 *
 * Collects the current edit form values, builds the update payload,
 * updates the task in Firebase, and refreshes the board view.
 *
 * @async
 * @param {string} taskId - The id of the task to save.
 * @returns {Promise<void>} Resolves when the save flow is complete.
 */
async function saveEditedTask(taskId) {
  try {
    const formData = collectEditFormData();
    const updatedTask = buildTaskUpdateObject(taskId, formData);
    await updateTaskInFirebase(taskId, updatedTask);
    await refreshBoardAndShowTask(taskId);
  } catch (error) {
    console.error("Error saving task:", error);
  }
}


window.saveEditedTask = saveEditedTask;

/**
 * Deletes an existing subtask from a task.
 *
 * Removes the subtask from Firebase, updates the local task state,
 * refreshes the board UI, and reopens the task in edit mode.
 *
 * @async
 * @param {string} taskId - The id of the parent task.
 * @param {string} subtaskKey - The key of the subtask to delete.
 * @returns {Promise<void>} Resolves when the subtask deletion is complete.
 */
async function deleteExistingSubtask(taskId, subtaskKey) {
  try {
    const task = tasks[taskId];
    if (!task || !task.subtasks) return;
    const updatedSubtasks = { ...task.subtasks };
    delete updatedSubtasks[subtaskKey];
    await update(ref(database, `tasks/${taskId}/subtasks`), updatedSubtasks);
    tasks[taskId].subtasks = updatedSubtasks;
    if (todos[taskId]) {
      todos[taskId].subtasks = updatedSubtasks;
    }
    updateHTML();
    editTask(taskId);
  } catch (error) {
    console.error("Error deleting subtask:", error);
  }
}


window.deleteExistingSubtask = deleteExistingSubtask;

/**
 * Creates an input element for editing a subtask title.
 *
 * @param {string} currentText - The current subtask title.
 * @returns {HTMLInputElement} The created input element.
 */
function createSubtaskEditInput(currentText) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentText;
  input.className = 'add-task__input';
  input.style.fontSize = '16px';
  input.style.marginBottom = '0';
  return input;
}

/**
 * Registers the edit listeners for a subtask input field.
 *
 * Saves the edited subtask on blur or Enter,
 * and restores edit mode on Escape.
 *
 * @param {HTMLInputElement} input - The input field used for editing.
 * @param {string} taskId - The id of the parent task.
 * @param {string} subtaskKey - The key of the edited subtask.
 * @returns {void}
 */
function setupSubtaskEditListeners(input, taskId, subtaskKey) {
  input.addEventListener('blur', () => saveSubtaskEdit(taskId, subtaskKey, input));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveSubtaskEdit(taskId, subtaskKey, input);
    if (e.key === 'Escape') editTask(taskId);
  });
}

/**
 * Enables inline edit mode for an existing subtask.
 *
 * Replaces the subtask text element with an input field,
 * focuses it, and registers the edit listeners.
 *
 * @param {string} taskId - The id of the parent task.
 * @param {string} subtaskKey - The key of the subtask to edit.
 * @returns {void}
 */
function editExistingSubtask(taskId, subtaskKey) {
  const textElement = document.getElementById(`subtask_text_${subtaskKey}`);
  if (!textElement) return;
  const input = createSubtaskEditInput(textElement.textContent);
  textElement.replaceWith(input);
  input.focus();
  input.select();
  setupSubtaskEditListeners(input, taskId, subtaskKey);
}


window.editExistingSubtask = editExistingSubtask;

/**
 * Saves the edited title of an existing subtask.
 *
 * Updates the subtask in Firebase, synchronizes the local task data,
 * refreshes the board UI, and reopens edit mode.
 *
 * @async
 * @param {string} taskId - The id of the parent task.
 * @param {string} subtaskKey - The key of the subtask to save.
 * @param {HTMLInputElement} input - The input field containing the edited title.
 * @returns {Promise<void>} Resolves when the subtask update is complete.
 */
async function saveSubtaskEdit(taskId, subtaskKey, input) {
  const newText = input.value.trim();
  if (!newText) return editTask(taskId);
  try {
    await update(ref(database, `tasks/${taskId}/subtasks/${subtaskKey}`), {
      title: newText,
      status: tasks[taskId].subtasks[subtaskKey].status
    });
    tasks[taskId].subtasks[subtaskKey].title = newText;
    if (todos[taskId]?.subtasks?.[subtaskKey]) {
      todos[taskId].subtasks[subtaskKey].title = newText;
    }
    updateHTML();
    editTask(taskId);
  } catch (error) {
    console.error("Error saving subtask:", error);
  }
}
