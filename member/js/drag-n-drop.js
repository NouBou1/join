/**
 * @file Provides Kanban board rendering and drag-and-drop handling for tasks.
 *
 * Renders tasks into the board columns, updates column placeholders,
 * supports task search, and synchronizes status changes with Firebase.
 *
 * @module drag-n-drop
 */
import { database } from '../../scripts/firebase/firebase.js';
import { loadTasks } from '../../scripts/firebase/get-firebase.js';
import { generateTodosHTML } from './member-templates.js';
import { getInitials, getAvatarColor } from './contacts-render.js';
import { ref, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";


let activeSearchTerm = '';
export let todos = {};
let currentDraggedElement;
let touchDraggedElement;
let touchDragStarted = false;
let touchStartX = 0;
let touchStartY = 0;
let suppressNextCardClick = false;
const TOUCH_DRAG_THRESHOLD = 10;
/**
 * Loads all tasks from Firebase and initializes the board view.
 *
 * @async
 * @returns {Promise<void>} Resolves when the board data has been loaded.
 */
async function initBoard() {
  try {
    todos = await loadTasks();
    updateHTML();
  } catch (error) {
    console.error('Fehler bei Laden der Tasks:', error);
  }
}

/**
 * Updates the status of a task in Firebase.
 *
 * @async
 * @param {string} taskId - The id of the task to update.
 * @param {SubtaskStatus} newStatus - The new board status.
 * @returns {Promise<void>} Resolves when the status update has been saved.
 */
export async function updateTaskStatus(taskId, newStatus) {
  await update(ref(database, `tasks/${taskId}`), {
    status: newStatus,
  });
}

/**
 * Calculates and returns the subtask progress HTML for a task.
 *
 * @param {Object<string, {status?: boolean, completed?: boolean}>} [subtasks={}] - The task subtasks.
 * @returns {string} HTML string for the progress bar, or an empty string if no subtasks exist.
 */
function calculateSubtaskProgress(subtasks = {}) {
  const subtaskArray = Object.values(subtasks);
  const totalSubtasks = subtaskArray.length;
  if (totalSubtasks === 0) return '';
  const completedSubtasks = subtaskArray.filter(
    s => s.status === true || s.completed === true
  ).length;
  if (completedSubtasks === 0) return '';
  const progressPercent = (completedSubtasks / totalSubtasks) * 100;
  return `
    <div class="task__progress">
      <div class="task__progress--bar">
        <div class="task__progress--fill" style="width: ${progressPercent}%"></div>
      </div>
      <span class="task__progress--text">${completedSubtasks}/${totalSubtasks} Subtasks</span>
    </div>`;
}
/**
 * Generates the HTML for task assignee avatars.
 *
 * Displays up to three avatars and adds an overflow avatar
 * when more assignees exist.
 *
 * @param {Object|Array|string} [assigned_to={}] - Assigned contacts data.
 * @returns {string} HTML string for the assignee avatars.
 */
function generateAssigneeAvatars(assigned_to = {}) {
  const names = extractAssigneeNames(assigned_to);
  const visible = names.slice(0, 3);
  const remaining = names.length - 3;
  return `
    ${renderVisibleAvatars(visible)}
    ${renderExtraAvatar(remaining)}
  `;
}

/**
 * Extracts assignee names from supported data formats.
 *
 * Supports objects, arrays, and comma-separated strings.
 *
 * @param {Object|Array|string} assigned_to - Raw assigned contact data.
 * @returns {string[]} Array of assignee names.
 */
function extractAssigneeNames(assigned_to) {
  if (Array.isArray(assigned_to)) return assigned_to;
  if (assigned_to && typeof assigned_to === 'object') {
    return Object.values(assigned_to)
      .map(c => typeof c === 'string' ? c : c?.name)
      .filter(Boolean);
  }
  if (typeof assigned_to === 'string') {
    return assigned_to.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Renders the visible assignee avatars.
 *
 * @param {string[]} names - The assignee names to render.
 * @returns {string} HTML string for the visible avatars.
 */
function renderVisibleAvatars(names) {
  return names.map(name => {
    return `
      <div
        class="task__assignee--avatar"
        style="background-color: ${getAvatarColor(name)}"
        title="${name}"
      >
        ${getInitials(name)}
      </div>
    `;
  }).join('');
}

/**
 * Renders the overflow avatar for hidden assignees.
 *
 * @param {number} count - Number of hidden assignees.
 * @returns {string} HTML string for the overflow avatar, or an empty string.
 */
function renderExtraAvatar(count) {
  if (count <= 0) return '';
  return `
    <div
      class="task__assignee--avatar task__assignee--avatar--extra"
      title="${count} more assignees"
    >
      +${count}
    </div>
  `;
}

/**
 * Re-renders all board columns and updates placeholder visibility.
 *
 * @returns {void}
 */
export function updateHTML() {
  if (!document.getElementById('todo')) return;
  updateTodo();
  updateInProgress();
  updateAwaitFeedback();
  updateDone();
  togglePlaceholder();
}

/**
 * Renders all tasks with status `"todo"` into the todo column.
 *
 * @returns {void}
 */
function updateTodo() {
  const container = document.getElementById('todo');
  if (!container) return;
  container.innerHTML = '';
  for (const [id, element] of Object.entries(todos)) {
    if (element.status === 'todo' && matchesSearch(element)) {
      const progressHTML = calculateSubtaskProgress(element.subtasks);
      const avatarsHTML = generateAssigneeAvatars(element.assigned_to);
      container.innerHTML += generateTodosHTML(id, element.title, element.category, element.description, element.priority, progressHTML, avatarsHTML);
    }
  }
}

/**
 * Renders all tasks with status `"in-progress"` into the in-progress column.
 *
 * @returns {void}
 */
function updateInProgress() {
  const container = document.getElementById('inProgress');
  if (!container) return;
  container.innerHTML = '';
  for (const [id, element] of Object.entries(todos)) {
    if (element.status === 'in-progress' && matchesSearch(element)) {
      const progressHTML = calculateSubtaskProgress(element.subtasks);
      const avatarsHTML = generateAssigneeAvatars(element.assigned_to);
      container.innerHTML += generateTodosHTML(id, element.title, element.category, element.description, element.priority, progressHTML, avatarsHTML);
    }
  }
}

/**
 * Renders all tasks with status `"await-feedback"` into the await-feedback column.
 *
 * @returns {void}
 */
function updateAwaitFeedback() {
  const container = document.getElementById('awaitFeedback');
  if (!container) return;
  container.innerHTML = '';
  for (const [id, element] of Object.entries(todos)) {
    if (element.status === 'await-feedback' && matchesSearch(element)) {
      const progressHTML = calculateSubtaskProgress(element.subtasks);
      const avatarsHTML = generateAssigneeAvatars(element.assigned_to);
      container.innerHTML += generateTodosHTML(id, element.title, element.category, element.description, element.priority, progressHTML, avatarsHTML);
    }
  }
}

/**
 * Renders all tasks with status `"done"` into the done column.
 *
 * @returns {void}
 */
function updateDone() {
  const container = document.getElementById('done');
  if (!container) return;
  container.innerHTML = '';
  for (const [id, element] of Object.entries(todos)) {
    if (element.status === 'done' && matchesSearch(element)) {
      const progressHTML = calculateSubtaskProgress(element.subtasks);
      const avatarsHTML = generateAssigneeAvatars(element.assigned_to);
      container.innerHTML += generateTodosHTML(id, element.title, element.category, element.description, element.priority, progressHTML, avatarsHTML);
    }
  }
}

/**
 * Shows or hides the placeholder inside each task area
 * depending on whether matching tasks exist.
 *
 * @returns {void}
 */
function togglePlaceholder() {
  const taskAreas = document.querySelectorAll('.task__area');
  taskAreas.forEach(area => {
    const status = area.dataset.status;
    const placeholder = area.querySelector('.task__area--placeholder');
    if (!placeholder) return;
    const hasTask = Object.values(todos).some(task => task.status === status && matchesSearch(task));
    if (hasTask) {
      placeholder.classList.add('d_none');
    } else {
      placeholder.classList.remove('d_none');
    }
  });
}

/**
 * Removes all drop-zone highlight classes.
 *
 * @returns {void}
 */
function clearDropHighlights() {
  document.querySelectorAll(".task__area--highlight").forEach(zone => {
    zone.classList.remove("task__area--highlight");
  });
}

/**
 * Removes all drag preview classes from task lists.
 *
 * @returns {void}
 */
function clearDropCardPreview() {
  document.querySelectorAll(".task__list--preview").forEach(list => {
    list.classList.remove("task__list--preview");
  });
}

function getTouchDropZone(touch) {
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  return el ? el.closest(".task__area") : null;
}

document.addEventListener("click", function (event) {
  if (!suppressNextCardClick) return;
  if (event.target.closest(".task__card")) {
    event.preventDefault();
    event.stopPropagation();
    suppressNextCardClick = false;
  }
}, true);

document.addEventListener("dragstart", function (event) {
  const card = event.target.closest(".task__card");
  if (!card) return;
  currentDraggedElement = card.id;
  card.classList.add("task__card--dragging");
});

document.addEventListener("dragend", function (event) {
  const card = event.target.closest(".task__card");
  if (!card) return;
  card.classList.remove("task__card--dragging");
  clearDropHighlights();
  clearDropCardPreview();
  currentDraggedElement = undefined;
});

document.addEventListener("dragover", function (event) {
  event.preventDefault();
  const dropZone = event.target.closest(".task__area");
  clearDropHighlights();
  clearDropCardPreview();
  if (!dropZone) return;
  const taskList = dropZone.querySelector(".task__list");
  if (!taskList) return;
  taskList.classList.add("task__list--preview");
});

document.addEventListener("drop", async function (event) {
  event.preventDefault();
  const dropZone = event.target.closest(".task__area");
  clearDropHighlights();
  clearDropCardPreview();
  if (!dropZone || !currentDraggedElement) return;
  const newStatus = /** @type {SubtaskStatus} */ (dropZone.dataset.status);
  const oldStatus = todos[currentDraggedElement]?.status;
  dropZone.classList.remove("task__list--preview");
  todos[currentDraggedElement].status = newStatus;
  updateHTML();
  try {
    await updateTaskStatus(currentDraggedElement, newStatus);
  } catch (error) {
    console.error("Firebase-Update fehlgeschlagen:", error);
    if (todos[currentDraggedElement]) {
      todos[currentDraggedElement].status = oldStatus;
      updateHTML();
    }
    alert("Status konnte nicht gespeichert.");
  }
});

document.addEventListener("dragleave", function (event) {
  const dropZone = event.target.closest(".task__area");
  if (!dropZone) return;
  dropZone.classList.remove("task__area--highlight");
});

// mobile drag and drop support

document.addEventListener("touchstart", function (event) {
const card = event.target.closest(".task__card");
if (!card) return;
const t = event.touches[0];
touchStartX = t.clientX;
touchStartY = t.clientY;
touchDraggedElement = card.id;
touchDragStarted = false;
}, { passive: true });


document.addEventListener("touchmove", function (event) {
if (!touchDraggedElement) return;
const t = event.touches[0];
const dx = Math.abs(t.clientX - touchStartX);
const dy = Math.abs(t.clientY - touchStartY);

if (!touchDragStarted && (dx > TOUCH_DRAG_THRESHOLD || dy > TOUCH_DRAG_THRESHOLD)) {
touchDragStarted = true;
}
if (!touchDragStarted) return;

event.preventDefault();
clearDropHighlights();
clearDropCardPreview();
const dropZone = getTouchDropZone(t);
if (!dropZone) return;
const taskList = dropZone.querySelector(".task__list");
if (!taskList) return;
taskList.classList.add("task__list--preview");
}, { passive: false });

document.addEventListener("touchend", async function (event) {
if (!touchDraggedElement) return;

const wasDragging = touchDragStarted;
const touch = event.changedTouches[0];
const dropZone = touch ? getTouchDropZone(touch) : null;

clearDropHighlights();
clearDropCardPreview();

if (wasDragging && dropZone) {
const newStatus = dropZone.dataset.status;
const oldStatus = todos[touchDraggedElement]?.status;
todos[touchDraggedElement].status = newStatus;
updateHTML();
try {
await updateTaskStatus(touchDraggedElement, newStatus);
} catch (error) {
console.error("Firebase-Update fehlgeschlagen:", error);
if (todos[touchDraggedElement]) {
todos[touchDraggedElement].status = oldStatus;
updateHTML();
}
alert("Status konnte nicht gespeichert.");
}
}
if (wasDragging) {
suppressNextCardClick = true;
}
touchDraggedElement = undefined;
touchDragStarted = false;
}, { passive: true });

/**
 * Checks whether a task matches the active board search term.
 *
 * @param {Todo} task - The task to test against the current search term.
 * @returns {boolean} True if the task matches or no search term is active.
 */
function matchesSearch(task) {
  if (!activeSearchTerm) return true;
  const haystack = [task.title, task.description, task.category, task.priority]
    .map(v => String(v || '').toLowerCase())
    .join(' ');
  return haystack.includes(activeSearchTerm);
}

/**
 * Updates the active board search term and refreshes the board view.
 *
 * @param {string} value - The raw search input value.
 * @returns {void}
 */
function searchTask(value) {
  activeSearchTerm = String(value || '').toLowerCase().trim();
  updateHTML();
}

initBoard();

window.searchTask = searchTask;
