/**
 * @file Provides summary page logic for task counters, greeting text,
 * username display, urgent deadline display, and mobile greeting overlay.
 *
 * @module summary
 */

import { auth } from '../../scripts/firebase/firebase.js';
import { loadTasks, getContacts, loadData } from '../../scripts/firebase/get-firebase.js';

/**
 * Counts tasks with status "todo" or "to do"
 * and updates the corresponding summary UI element.
 *
 * Also applies backward compatibility for legacy `subtask` status values.
 *
 * @async
 * @param {SummaryTask[]} tasks - Array of task objects.
 * @returns {Promise<void>} Resolves after the UI has been updated.
 */
async function todoTasks(tasks) {
  tasks.forEach(task => {
    if (!task.status && task.subtask) {
      task.status = task.subtask;
    }
  });

  const count = tasks.filter(task => {
    const s = (task.status || '').toLowerCase().trim();
    return s === 'todo' || s === 'to do';
  }).length;

  const element = document.querySelector('.todo .card-title');
  if (element) {
    element.textContent = count;
  } else {
    console.warn("Element '.todo .card-title' nicht gefunden!");
  }
}

/**
 * Counts tasks with status "done"
 * and updates the corresponding summary UI element.
 *
 * Also applies backward compatibility for legacy `subtask` status values.
 *
 * @async
 * @param {SummaryTask[]} tasks - Array of task objects.
 * @returns {Promise<void>} Resolves after the UI has been updated.
 */
async function doneTasks(tasks) {
  tasks.forEach(task => {
    if (!task.status && task.subtask) {
      task.status = task.subtask;
    }
  });
  const count = tasks.filter(task => {
    const s = (task.status || '').toLowerCase().trim();
    return s === 'done';
  }).length;
  const element = document.querySelector('.done .card-title');
  if (element) {
    element.textContent = count;
  } else {
    console.warn("Element '.done .card-title' nicht gefunden!");
  }
}

/**
 * Counts tasks with priority "urgent"
 * and updates the corresponding summary UI element.
 *
 * @async
 * @param {SummaryTask[]} tasks - Array of task objects.
 * @returns {Promise<void>} Resolves after the UI has been updated.
 */
async function urgentTasks(tasks) {
  const count = tasks.filter(task => {
    const s = (task.priority || '').toLowerCase().trim();
    return s === 'urgent';
  }).length;
  const element = document.querySelector('.urgent-info .card-title');
  if (element) {
    element.textContent = count;
  } else {
    console.warn("Element '.urgent-info .card-title' nicht gefunden!");
  }
}

/**
 * Counts all tasks that belong to valid board statuses
 * and updates the corresponding summary UI element.
 *
 * @async
 * @param {SummaryTask[]} tasks - Array of task objects.
 * @returns {Promise<void>} Resolves after the UI has been updated.
 */
async function tasksInBoard(tasks) {
  const validStatuses = new Set(['todo', 'in-progress', 'await-feedback', 'done']);
  const count = tasks.filter(task => {
    const status = (task.status || '').toLowerCase().trim();
    return validStatuses.has(status);
  }).length;
  const element = document.querySelector('.all-tasks .big');
  if (element) {
    element.textContent = count;
  } else {
    console.warn("Element '.all-tasks .big' nicht gefunden!");
  }
}

/**
 * Counts tasks with status "in-progress"
 * and updates the corresponding summary UI element.
 *
 * @async
 * @param {SummaryTask[]} tasks - Array of task objects.
 * @returns {Promise<void>} Resolves after the UI has been updated.
 */
async function tasksInProgress(tasks) {
  const count = tasks.filter(task => {
    const status = (task.status || '').toLowerCase().trim();
    return status === 'in-progress';
  }).length;
  const element = document.querySelector('.tasks-in-progress .big');
  if (element) {
    element.textContent = count;
  } else {
    console.warn("Element '.tasks-in-progress .big' nicht gefunden!");
  }
}

/**
 * Counts tasks with status "await-feedback"
 * and updates the corresponding summary UI element.
 *
 * Also applies backward compatibility for legacy `subtask` status values.
 *
 * @async
 * @param {SummaryTask[]} tasks - Array of task objects.
 * @returns {Promise<void>} Resolves after the UI has been updated.
 */
async function awaitFeedbackTasks(tasks) {
  tasks.forEach(task => {
    if (!task.status && task.subtask) {
      task.status = task.subtask;
    }
  });
  const count = tasks.filter(task => {
    const s = (task.status || '').toLowerCase().trim();
    return s === 'await-feedback';
  }).length;
  const element = document.querySelector('.await-feedback-info .big');
  if (element) {
    element.textContent = count;
  } else {
    console.warn("Element '.await-feedback-info .big' nicht gefunden!");
  }
}

/**
 * Updates the greeting text based on the current local time.
 *
 * @returns {void}
 */
function greetings() {
  const daytimeElem = document.getElementById('greetingTime');
  if (!daytimeElem) return;
  const hour = new Date().getHours();
  let greetingText = 'Good evening';
  if (hour < 12) greetingText = 'Good morning';
  else if (hour < 18) greetingText = 'Good afternoon';
  daytimeElem.textContent = greetingText;
}

/**
 * Assigns the displayed username depending on the authentication state.
 *
 * Shows the matching contact name for logged-in non-anonymous users
 * and "Guest" otherwise.
 *
 * @param {Object|null} user - The authenticated Firebase user object, or null.
 * @param {boolean} [user.isAnonymous] - Whether the user is anonymous.
 * @param {string} [user.uid] - The user id.
 * @param {HTMLElement|null} nameElem - The greeting name element.
 * @returns {void}
 */
export function assignName(user, nameElem) {
  if (!nameElem) {
    console.warn('Kein nameElem vorhanden!');
    return;
  }
  if (user && !user.isAnonymous) {
    const contacts = getContacts();
    const contact = Object.values(contacts || {}).find(c => c.uid === user.uid);
    nameElem.textContent = contact?.name || 'User';
    return;
  }
  nameElem.textContent = 'Guest';
}

/**
 * Finds the nearest upcoming deadline among urgent tasks
 * and renders it into the summary UI.
 *
 * @param {SummaryTask[]} tasks - Array of task objects.
 * @returns {void}
 */
function urgentTasksDeadLine(tasks) {
  const urgentTasks = tasks
    .filter(task => task.priority === 'urgent' && task.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const deadlineElement = document.getElementById('urgentTasks-dead-line');
  if (!deadlineElement) return;
  if (urgentTasks.length > 0) {
    const nextDate = new Date(urgentTasks[0].due_date);
    deadlineElement.textContent = nextDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

/**
 * Initializes the mobile greeting overlay.
 *
 * Copies the already rendered desktop greeting into the mobile overlay,
 * shows it briefly on small screens, and then hides it.
 *
 * @returns {void}
 */
function initMobileGreetingOverlay() {
  const overlay = document.getElementById('mobileGreetingOverlay');
  const desktopTime = document.getElementById('greetingTime');
  const desktopName = document.getElementById('greetingName');
  const mobileTime = document.getElementById('mobileGreetingTime');
  const mobileName = document.getElementById('mobileGreetingName');
  if (!overlay || !desktopTime || !desktopName || !mobileTime || !mobileName) return;
  if (window.innerWidth > 600) return;
  if (overlay.dataset.started === 'true') return;
  const timeText = desktopTime.textContent.trim();
  const nameText = desktopName.textContent.trim();
  if (!timeText || !nameText) return;
  mobileTime.textContent = timeText;
  mobileName.textContent = nameText;
  overlay.dataset.started = 'true';
  overlay.classList.remove('hide');
  overlay.classList.add('show');
  setTimeout(() => {
    overlay.classList.remove('show');
    overlay.classList.add('hide');
  }, 2200);
}

/**
 * Initializes the summary page.
 *
 * Loads tasks, updates all counters, sets the greeting text,
 * loads contacts, renders the current user's name,
 * and starts the mobile greeting overlay.
 *
 * @async
 * @returns {Promise<void>} Resolves when the summary initialization is complete.
 */
export async function initSummary() {
  const tasksData = await loadTasks();
  const tasks = Object.values(tasksData || {});
  await todoTasks(tasks);
  await doneTasks(tasks);
  await urgentTasks(tasks);
  await tasksInBoard(tasks);
  await tasksInProgress(tasks);
  await awaitFeedbackTasks(tasks);
  urgentTasksDeadLine(tasks);
  greetings();
  const nameElem = document.getElementById('greetingName');
  auth.onAuthStateChanged((user) => {
    if (user) {
      loadData(() => {
        assignName(user, nameElem);
        initMobileGreetingOverlay();
      });
    } else {
      assignName(null, nameElem);
      initMobileGreetingOverlay();
    }
  });
}


window.addEventListener('load', initSummary);
