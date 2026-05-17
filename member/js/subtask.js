import { initSubtasks } from './add-task-subtasks.js';

/**
 * Calculates and returns the subtask progress HTML for a task.
 *
 * @param {Object<string, {status?: boolean, completed?: boolean}>} [subtasks={}] - The task subtasks.
 * @returns {string} HTML string for the progress bar, or an empty string if no subtasks exist.
 */
export function calculateSubtaskProgress(subtasks = {}) {
  const subtaskArray = Object.values(subtasks);
  const totalSubtasks = subtaskArray.length;
  if (totalSubtasks === 0) return '';
  const completedSubtasks = subtaskArray.filter(
    s => s.status === true || s.completed === true
  ).length;
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
 * Initializes the subtasks module for edit mode.
 *
 * @param {HTMLElement} container - Overlay container.
 * @returns {Object} Subtask state.
 */
export function initializeEditSubtasks(container) {
  return initSubtasks(container, {
    subtaskInput: document.getElementById('edit_subtask'),
    subtaskActions: document.getElementById('edit_subtask_actions'),
    confirmSubtaskBtn: document.getElementById('edit_confirm_subtask_btn'),
    clearSubtaskBtn: document.getElementById('edit_clear_subtask_btn'),
    subtaskList: document.getElementById('edit_subtask_list_new')
  });
}

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
 * @param {HTMLInputElement} input - The input field used for editing.
 * @param {string} taskId - The id of the parent task.
 * @param {string} subtaskKey - The key of the edited subtask.
 * @param {Object} context - Dependencies for saving or cancelling edits.
 * @returns {void}
 */
function setupSubtaskEditListeners(input, taskId, subtaskKey, context) {
  input.addEventListener('blur', () => saveSubtaskEdit(taskId, subtaskKey, input, context));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveSubtaskEdit(taskId, subtaskKey, input, context);
    if (e.key === 'Escape') context.editTask(taskId);
  });
}

/**
 * Enables inline edit mode for an existing subtask.
 *
 * @param {string} taskId - The id of the parent task.
 * @param {string} subtaskKey - The key of the subtask to edit.
 * @param {Object} context - Dependencies for edit handling.
 * @returns {void}
 */
export function editExistingSubtask(taskId, subtaskKey, context) {
  const textElement = document.getElementById(`subtask_text_${subtaskKey}`);
  if (!textElement) return;
  const input = createSubtaskEditInput(textElement.textContent);
  textElement.replaceWith(input);
  input.focus();
  input.select();
  setupSubtaskEditListeners(input, taskId, subtaskKey, context);
}

/**
 * Deletes an existing subtask from a task.
 *
 * @async
 * @param {string} taskId - The id of the parent task.
 * @param {string} subtaskKey - The key of the subtask to delete.
 * @param {Object} context - Dependencies for deleting the subtask.
 * @returns {Promise<void>} Resolves when the subtask deletion is complete.
 */
export async function deleteExistingSubtask(taskId, subtaskKey, context) {
  try {
    const task = context.tasks[taskId];
    if (!task || !task.subtasks) return;
    const updatedSubtasks = { ...task.subtasks };
    delete updatedSubtasks[subtaskKey];
    await context.updateSubtasks(taskId, updatedSubtasks);
    context.tasks[taskId].subtasks = updatedSubtasks;
    if (context.todos[taskId]) {
      context.todos[taskId].subtasks = updatedSubtasks;
    }
    context.updateHTML();
    context.editTask(taskId);
  } catch (error) {
    console.error("Error deleting subtask:", error);
  }
}

/**
 * Saves the edited title of an existing subtask.
 *
 * @async
 * @param {string} taskId - The id of the parent task.
 * @param {string} subtaskKey - The key of the subtask to save.
 * @param {HTMLInputElement} input - The input field containing the edited title.
 * @param {Object} context - Dependencies for saving the subtask.
 * @returns {Promise<void>} Resolves when the subtask update is complete.
 */
export async function saveSubtaskEdit(taskId, subtaskKey, input, context) {
  const newText = input.value.trim();
  if (!newText) return context.editTask(taskId);
  try {
    await context.updateSubtask(taskId, subtaskKey, {
      title: newText,
      status: context.tasks[taskId].subtasks[subtaskKey].status
    });
    context.tasks[taskId].subtasks[subtaskKey].title = newText;
    if (context.todos[taskId]?.subtasks?.[subtaskKey]) {
      context.todos[taskId].subtasks[subtaskKey].title = newText;
    }
    context.updateHTML();
    context.editTask(taskId);
  } catch (error) {
    console.error("Error saving subtask:", error);
  }
}

/**
 * Toggles the completion status of a subtask checkbox.
 *
 * @async
 * @param {HTMLImageElement} img - The clicked checkbox image element.
 * @param {Object} context - Dependencies for toggling the subtask.
 * @returns {Promise<void>} Resolves when the toggle operation is complete.
 */
export async function toggleCheckbox(img, context) {
  const taskId = img.dataset.taskId;
  const subtaskKey = img.dataset.subtaskKey;
  if (!taskId || !subtaskKey) return;
  try {
    const currentStatus = context.tasks[taskId]?.subtasks?.[subtaskKey]?.status || false;
    const newStatus = !currentStatus;
    await context.updateSubtask(taskId, subtaskKey, { status: newStatus });
    if (context.tasks[taskId]?.subtasks?.[subtaskKey]) {
      context.tasks[taskId].subtasks[subtaskKey].status = newStatus;
    }
    if (context.todos[taskId]?.subtasks?.[subtaskKey]) {
      context.todos[taskId].subtasks[subtaskKey].status = newStatus;
    }
    img.src = newStatus
      ? "../assets/icons/checkbox/checkbox-icon-checked.svg"
      : "../assets/icons/checkbox/checkbox-icon-unchecked.svg";
    context.updateHTML();
  } catch (error) {
    console.error("Error toggling subtask:", error);
  }
}

/**
 * Merges already stored subtasks with newly created subtasks.
 *
 * Keeps existing keys and appends new subtasks with the next available
 * `SubtaskX` number.
 *
 * @param {Object<string, Object>} existingSubtasks - The currently stored subtasks.
 * @param {Object<string, Object>} newSubtasks - Newly created subtasks from the edit form.
 * @returns {Object<string, Object>} Merged subtask object.
 */
export function mergeSubtasks(existingSubtasks = {}, newSubtasks = {}) {
  const existingKeys = Object.keys(existingSubtasks);
  let maxNumber = 0;
  existingKeys.forEach(key => {
    const match = key.match(/Subtask(\d+)/);
    if (match) {
      maxNumber = Math.max(maxNumber, parseInt(match[1]));
    }
  });
  const renumberedNewSubtasks = {};
  Object.values(newSubtasks).forEach((subtask, index) => {
    renumberedNewSubtasks[`Subtask${maxNumber + index + 1}`] = subtask;
  });
  return { ...existingSubtasks, ...renumberedNewSubtasks };
}
