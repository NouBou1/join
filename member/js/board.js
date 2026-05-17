import { loadTasks } from '/scripts/firebase/get-firebase.js';
import { getTaskOverlayTemplate, getEditTaskOverlayTemplate } from './member-templates.js';
import { ref, onValue, remove, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { database } from "../../scripts/firebase/firebase.js";
import { updateHTML, todos } from './drag-n-drop.js';
import { initAssignees, trackContactsForUser, getAssignedNames, renderSelectedAssignees } from './add-task-assignees.js';
import { getSubtasks } from './add-task-subtasks.js';
import { initializeEditSubtasks, toggleCheckbox, deleteExistingSubtask, editExistingSubtask, mergeSubtasks } from './subtask.js';


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
    conditionallyEnableTooltips();
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
 * Creates the dependency context used by extracted subtask helpers.
 *
 * @returns {Object} The current subtask helper dependencies.
 */
function getSubtaskContext() {
  return {
    tasks,
    todos,
    updateHTML,
    editTask,
    updateSubtask: (taskId, subtaskKey, payload) => update(ref(database, `tasks/${taskId}/subtasks/${subtaskKey}`), payload),
    updateSubtasks: (taskId, subtasks) => update(ref(database, `tasks/${taskId}/subtasks`), subtasks)
  };
}


document.addEventListener("click", (e) => {
  if (e.target.classList.contains("checkbox-icon")) {
    toggleCheckbox(e.target, getSubtaskContext());
  }
});


window.deleteExistingSubtask = (taskId, subtaskKey) => {
  deleteExistingSubtask(taskId, subtaskKey, getSubtaskContext());
};


window.editExistingSubtask = (taskId, subtaskKey) => {
  editExistingSubtask(taskId, subtaskKey, getSubtaskContext());
};

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
 * Normalizes assigned task values into contact names.
 *
 * @param {Array|string|Object} assignedTo - Assigned task value.
 * @returns {Array<string>} Normalized assignee names.
 */
function normalizeAssignedNames(assignedTo) {
  if (Array.isArray(assignedTo)) return assignedTo;
  if (typeof assignedTo === 'string') return splitAssignedNames(assignedTo);
  if (assignedTo && typeof assignedTo === 'object') return Object.values(assignedTo);
  return [];
}


/**
 * Splits a comma separated assignee string into names.
 *
 * @param {string} assignedTo - Comma separated assignee names.
 * @returns {Array<string>} Clean assignee names.
 */
function splitAssignedNames(assignedTo) {
  return assignedTo
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
}


/**
 * Creates fallback assignee objects from stored names.
 *
 * @param {Array<string>} names - Stored assignee names.
 * @returns {Array<Object>} Assignee objects for the edit state.
 */
function createFallbackAssignees(names) {
  return names.map((name) => ({
    id: name,
    name,
    initials: getNameInitials(name),
    avatarColor: '#2A3647'
  }));
}


/**
 * Creates initials from a full name.
 *
 * @param {string} name - Full assignee name.
 * @returns {string} Initials with max two letters.
 */
function getNameInitials(name) {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}


/**
 * Initializes the assignee module for edit mode.
 *
 * @param {Array|string|Object} assignedTo - Existing task assignees.
 * @returns {Object} The initialized assignee state.
 */
function initializeEditAssignees(assignedTo) {
  const assigneeState = initAssignees(getEditAssigneeElements());
  const assignedNames = normalizeAssignedNames(assignedTo);
  assigneeState.selectedAssignees = createFallbackAssignees(assignedNames);
  renderSelectedAssignees(assigneeState);
  trackContactsForUser(assigneeState);
  return assigneeState;
}


/**
 * Gets all edit assignee DOM elements.
 *
 * @returns {Object} DOM elements for the assignee module.
 */
function getEditAssigneeElements() {
  return {
    assignedContainer: document.getElementById('edit_assigned_to'),
    assignedInput: document.getElementById('edit_assigned_to_input'),
    assignedTrigger: document.getElementById('edit_assigned_to_trigger'),
    assignedOptions: document.getElementById('edit_assigned_to_options'),
    selectedDisplay: document.getElementById('edit_selected_assignees_display')
  };
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
  window.editAssigneeState = initializeEditAssignees(task.assigned_to);
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
  const mergedSubtasks = mergeSubtasks(existingSubtasks, formData.newSubtasks);
  
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
 * Aktiviert Tooltips nur für Elemente, deren Text tatsächlich abgeschnitten wird.
 * Entfernt die has-tooltip Klasse, wenn kein Overflow vorliegt.
 *
 * @returns {void}
 */
function conditionallyEnableTooltips() {
  const tooltipElements = document.querySelectorAll('.has-tooltip');
  
  tooltipElements.forEach(element => {
    const textElement = element.querySelector('span');
    if (!textElement) return;
    const isOverflowing = textElement.scrollWidth > textElement.clientWidth || 
                         textElement.scrollHeight > textElement.clientHeight;
    if (!isOverflowing) {
      element.classList.remove('has-tooltip');
    }
  });
}