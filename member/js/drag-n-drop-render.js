/**
 * @file Rendering and search helpers for the board drag-and-drop module.
 *
 * @module drag-n-drop-render
 */
import { generateTodosHTML } from './member-templates.js';
import { calculateSubtaskProgress } from './subtask.js';
import { getAvatarColor, getInitials } from './contacts-render.js';

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
 * Checks whether a task matches the active board search term.
 *
 * @param {Todo} task - The task to test against the current search term.
 * @param {string} activeSearchTerm - Current normalized search term.
 * @returns {boolean} True if the task matches or no search term is active.
 */
export function matchesSearch(task, activeSearchTerm) {
  if (!activeSearchTerm) return true;
  const haystack = [task.title, task.description, task.category, task.priority]
    .map(v => String(v || '').toLowerCase())
    .join(' ');
  return haystack.includes(activeSearchTerm);
}

/**
 * Renders one board column by status.
 *
 * @param {string} containerId - DOM id of the column container.
 * @param {string} status - Task status represented by that column.
 * @param {Object<string, Todo>} todos - Current task map.
 * @param {(task: Todo) => boolean} matcher - Search matcher function.
 * @returns {void}
 */
export function renderBoardColumn(containerId, status, todos, matcher) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  for (const [id, element] of Object.entries(todos)) {
    if (element.status !== status || !matcher(element)) continue;

    const progressHTML = calculateSubtaskProgress(element.subtasks);
    const avatarsHTML = generateAssigneeAvatars(element.assigned_to);
    container.innerHTML += generateTodosHTML(
      id,
      element.title,
      element.category,
      element.description,
      element.priority,
      progressHTML,
      avatarsHTML
    );
  }
}

/**
 * Shows or hides the placeholder inside each task area
 * depending on whether matching tasks exist.
 *
 * @param {Object<string, Todo>} todos - Current task map.
 * @param {(task: Todo) => boolean} matcher - Search matcher function.
 * @returns {void}
 */
export function togglePlaceholder(todos, matcher) {
  const taskAreas = document.querySelectorAll('.task__area');
  taskAreas.forEach(area => {
    const status = area.dataset.status;
    const placeholder = area.querySelector('.task__area--placeholder');
    if (!placeholder) return;
    const hasTask = Object.values(todos).some(task => task.status === status && matcher(task));
    if (hasTask) {
      placeholder.classList.add('d_none');
    } else {
      placeholder.classList.remove('d_none');
    }
  });
}
