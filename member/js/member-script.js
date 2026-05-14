import { initAddTask } from './add-task.js';
import { getInitials } from './contacts-render.js';
import { getContacts, loadData, loadTasks } from '../../scripts/firebase/get-firebase.js';
import { tasks, initTasks } from './board.js';

/**
 * @file Member page bootstrapper: renders header/sidebar/task UI and wires up header menu + logout.
 *
 * This module initializes the member UI by injecting HTML templates into the page,
 * then triggers board rendering (currently via `updateHTML()` from the drag & drop module).
 *
 * DOM requirements (IDs must exist in the HTML):
 * - `header`       : container for the header template
 * - `sidebar`      : container for the sidebar template
 * - `add_task`     : container for the "add task" template
 * - `editC_overlay`: (optional) container for contact edit overlay
 * - `addC_overlay` : (optional) container for contact add overlay
 * - `headerMenue`  : profile/menu button in the header
 * - `headerMenueNav`: dropdown/navigation container toggled by profile button
 * - `logoutBtn`    : logout button
 *
 * External dependencies:
 * - Template functions from `member-templates.js`
 * - `updateHTML()` from `drag-n-drop.js`
 * - Firebase Auth instance `auth` and `signOut()`
 *
 * @module member-ui
 */
import { getHeaderTemplate, getSidebarTemplate, getTaskTemplate, getEditOverlayTemplate, getAddOverlayTemplate, generateTodosHTML } from './member-templates.js';
import { updateHTML, todos } from './drag-n-drop.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from "../../scripts/firebase/firebase.js";

init();


/**
 * Entry point for module initialization.
 * Renders all UI parts in sequence.
 *
 * @async
 * @returns {Promise<void>}
 */
async function init() {
  await render();
};


/**
 * Renders all static UI sections and the board.
 *
 * @async
 * @returns {Promise<void>}
 */
async function render() {
  await renderHeader();
  renderProfileInitials()
  await renderSidebar();
  highlightActiveNavItem();
  if (document.getElementById('add_task')) {
    await renderAddTask();
    setupAddTaskOverlay();
  }
  await renderBoard();
};


/**
 * Injects the header template into `#header`.
 *
 * @returns {void}
 */
function renderHeader() {
  const headerRef = document.getElementById('header');
  if (headerRef) {
    headerRef.innerHTML = getHeaderTemplate();
  } else {
    console.error('Header-Element nicht gefunden!');
  }
};


/**
 * Injects the sidebar template into `#sidebar`.
 *
 * @returns {void}
 */
function renderSidebar() {
  const sidebarRef = document.getElementById('sidebar');
  if (sidebarRef) {
    sidebarRef.innerHTML = getSidebarTemplate();
  } else {
    console.error('Sidebar-Element nicht gefunden!');
  }
};



/**
 * Injects the add-task template into `#add_task`.
 *
 * @returns {void}
 */
function renderAddTask() {
  const addTaskRef = document.getElementById('add_task');
  const overlay = document.getElementById('add_task_overlay');
  if (addTaskRef && overlay) {
    addTaskRef.innerHTML = getTaskTemplate({ isOverlay: true });
    initAddTask(addTaskRef, {
      mode: 'overlay',
      onClose: () => closeAddTaskOverlay(overlay),
      onSuccess: async () => {
        await initTasks();
        Object.assign(todos, tasks);
        updateHTML();
      }
    });
  } else {
    console.error('Add Task-Element oder Overlay nicht gefunden!');
  }
};


document.addEventListener('DOMContentLoaded', () => {
  const profileBtn = document.getElementById('headerMenue');
  const logoutBtn = document.getElementById('logoutBtn');
  const headerMenueNav = document.getElementById('headerMenueNav');
  profileBtn.addEventListener('click', () => {
    headerMenueNav.classList.toggle('d_none');
  })
  logoutBtn.addEventListener('click', () => {
    try {
      const userCredential = signOut(auth);
      console.log("Logout erfolgreich:", userCredential.user);
      window.location.href = "./index.html"; // target page after Logout
    } catch (error) {
      console.error("Logout Fehlgeschlagen:", error.message);
      alert("Logout fehlgeschlagen");
    }
  })
});


/**
 * Opens the add-task overlay and starts the opening animation.
 *
 * Makes the overlay visible, activates the slide-in animation
 * for the overlay content, and disables page scrolling.
 *
 * @param {HTMLElement} overlay - The add-task overlay element.
 * @returns {void}
 */
function openAddTaskOverlay(overlay) {
  overlay.classList.remove('d_none');
  const content = overlay.querySelector('.overlay_add_task');
  if (content) {
    content.classList.remove('overlay_add_task--slide-out');
    content.classList.add('overlay_add_task--slide-in');
  }
  document.body.classList.add('no-scroll');
}


/**
 * Registers click handlers for elements that open the add-task overlay.
 *
 * @listens Element#click
 * @returns {void}
 */
document.querySelectorAll('.openAddTaskOverlay').forEach(btn => {
  btn.addEventListener('click', () => {
    const overlay = document.getElementById('add_task_overlay');
    openAddTaskOverlay(overlay);
  });
});


/**
 * Closes the add-task overlay and starts the closing animation.
 *
 * If the overlay content exists, plays the slide-out animation first
 * and hides the overlay after the animation ends. Otherwise hides it immediately.
 *
 * @param {HTMLElement} overlay - The add-task overlay element.
 * @returns {void}
 */
function closeAddTaskOverlay(overlay) {
  const content = overlay.querySelector('.overlay_add_task');
  if (!content) {
    overlay.classList.add('d_none');
    document.body.classList.remove('no-scroll');
    return;
  }
  content.classList.remove('overlay_add_task--slide-in');
  content.classList.add('overlay_add_task--slide-out');
  content.addEventListener('animationend', () => {
    content.classList.remove('overlay_add_task--slide-out');
    overlay.classList.add('d_none');
    document.body.classList.remove('no-scroll');
  }, { once: true });
}


/**
 * Registers the click handler for the overlay open button.
 *
 * @param {HTMLElement} openBtn - The button that opens the overlay.
 * @param {HTMLElement} overlay - The add-task overlay element.
 * @returns {void}
 */
function setupOpenButton(openBtn, overlay) {
  openBtn.addEventListener('click', () => openAddTaskOverlay(overlay));
}


/**
 * Registers click handling for closing the add-task overlay.
 *
 * Closes the overlay when the user clicks on the backdrop
 * or on an element matching the close button selector.
 *
 * @param {HTMLElement} overlay - The add-task overlay element.
 * @returns {void}
 */
function setupBackdropAndCloseButton(overlay) {
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target.closest('.add-task-close-btn')) {
      closeAddTaskOverlay(overlay);
    }
  });
}


/**
 * Initializes the add-task overlay controls.
 *
 * Looks up the open button and overlay element
 * and registers the required overlay event handlers.
 *
 * @returns {void}
 */
function setupAddTaskOverlay() {
  const openBtn = document.getElementById('openAddTaskOverlay');
  const overlay = document.getElementById('add_task_overlay');
  if (!openBtn || !overlay) return;
  setupOpenButton(openBtn, overlay);
  setupBackdropAndCloseButton(overlay);
}


/**
 * Highlights the navigation item that matches the current page.
 *
 * Compares the current pathname with each navigation link target
 * and toggles the active navigation class accordingly.
 *
 * @returns {void}
 */
function highlightActiveNavItem() {
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item').forEach(link => {
    const linkPage = link.getAttribute('href').split('/').pop();
    link.classList.toggle('nav-item--active', linkPage === currentPage);
  });
  document.querySelectorAll('.footer__responsive a').forEach(link => {
    const linkPage = link.getAttribute('href').split('/').pop();
    link.classList.toggle('footer__responsive--active', linkPage === currentPage);
  });
}


/**
 * Renders the profile initials for the current authenticated user.
 *
 * Shows the matching contact initials for registered users
 * and "G" for guest users.
 *
 * @returns {void}
 */
function renderProfileInitials() {
  auth.onAuthStateChanged((user) => {
    const initialsElem = document.getElementById('profileInitials');
    if (!initialsElem) return;
    if (user && !user.isAnonymous) {
      loadData(() => {
        const contacts = getContacts();
        const contact = Object.values(contacts).find(c => c.uid === user.uid);
        initialsElem.textContent = getInitials(contact?.name || user.displayName || user.email || 'U');
      });
    } else {
      initialsElem.textContent = 'G';
    }
  });
}


/**
 * Triggers the board rendering.
 *
 * Currently delegates to `updateHTML()` in `drag-n-drop.js`, which renders the
 * board columns based on the current in-memory tasks.
 *
 * @async
 * @returns {Promise<void>}
 */
async function renderBoard() {
  updateHTML();
}

/**
 * Sets up click handlers for all "add task" buttons in the board collumns.
 *
 * @returns {Promise<void}
 */
function setupAddTaskForAllColumns() {
  const overlay = document.getElementById('add_task_overlay');
  if (!overlay) return;
  document.querySelectorAll('.circle-plus-icon').forEach(icon => {
    icon.addEventListener('click', () => {
      // Wir gehen von Icon -> .task__section -> .task__area
      const section = icon.closest('.task__section');
      const taskArea = section?.querySelector('.task__area');
      const status = taskArea?.dataset.status || 'todo';
      overlay.dataset.target = status;
      openAddTaskOverlay(overlay);
    });
  });
}
renderBoard().then(() => {
  setupAddTaskOverlay();
  setupAddTaskForAllColumns();
});


/**
 * Navigates the user back to the previous page in browser history.
 * If no history entry exists, it redirects to a fallback page.
 *
 * @function initGoBackButton
 * @returns {void}
 */
function initGoBackButton() {
  const btn = document.getElementById('goBack');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = './index.html';
  });
}


document.addEventListener('DOMContentLoaded', initGoBackButton);
