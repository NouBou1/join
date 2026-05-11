/**
 * @file Public page bootstrapper: renders shared header/sidebar UI and wires up the header menu + logout.
 *
 * This module injects templates into the public pages (e.g. summary-guest/public area)
 * and provides a logout button that signs out the current Firebase user.
 *
 * DOM requirements (IDs must exist in the HTML):
 * - `header`        : container for the header template
 * - `sidebar`       : container for the sidebar template
 * - `headerMenue`   : profile/menu button in the header
 * - `headerMenueNav`: dropdown/navigation container toggled by profile button
 * - `logoutBtn`     : logout button
 *
 * External dependencies:
 * - Template functions from `/public/js/public-templates.js`
 * - Firebase Auth instance `auth` and `signOut()`
 *
 * @module public-ui
 */
import { getHeaderTemplate, getSidebarTemplate, getPublicFooterTemplate } from './public-templates.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from "../../scripts/firebase/firebase.js";

init();


/**
 * Entry point for module initialization.
 * Renders the UI on load.
 *
 * NOTE: `render()` is synchronous; this function does not need to be `async`.
 *
 * @returns {void}
 */
async function init() {
  render();
};


/**
 * Renders all public UI sections.
 *
 * @returns {void}
 */
function render() {
  renderHeader();
  renderSidebar();
  renderMobileFooter();
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
 * Renders the mobile footer for public pages.
 *
 * Injects the public footer template into the mobile footer container.
 *
 * @returns {void}
 */
function renderMobileFooter() {
  const testRef = document.getElementById('footerMobilePublic');
  if (testRef) {
    testRef.innerHTML = getPublicFooterTemplate();
  } else {
    console.error('Footer-Element not found!');
  }
}

// CHECK Why this function? Function don't used!
/**
 * Renders the "Add Task" section by injecting the task template into `#add_task`.
 *
 * DOM requirement:
 * - An element with id `add_task` must exist on the page.
 *
 * Dependencies:
 * - `getTaskTemplate()` must be available in scope (imported or defined elsewhere)
 *   and must return a HTML string.
 *
 * @returns {void}
 */
function renderAddTask() {
  const addTaskRef = document.getElementById('add_task');
  if (addTaskRef) {
    addTaskRef.innerHTML = getTaskTemplate();
  } else {
    console.error('Add Task-Element nicht gefunden!');
  }
};
