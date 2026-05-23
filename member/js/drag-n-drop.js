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
import {
    matchesSearch,
    renderBoardColumn,
    togglePlaceholder
} from './drag-n-drop-render.js';
import { ref, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

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
        status: newStatus
    });
}

/**
 * Re-renders all board columns and updates placeholder visibility.
 *
 * @returns {void}
 */
export function updateHTML() {
    if (!document.getElementById('todo')) return;
    const matcher = (task) => matchesSearch(task, activeSearchTerm);
    renderBoardColumn('todo', 'todo', todos, matcher);
    renderBoardColumn('inProgress', 'in-progress', todos, matcher);
    renderBoardColumn('awaitFeedback', 'await-feedback', todos, matcher);
    renderBoardColumn('done', 'done', todos, matcher);
    togglePlaceholder(todos, matcher);
}

/**
 * Removes all drop-zone highlight classes.
 *
 * @returns {void}
 */
function clearDropHighlights() {
    document.querySelectorAll('.task__area--highlight').forEach(zone => {
        zone.classList.remove('task__area--highlight');
    });
}

/**
 * Removes all drag preview classes from task lists.
 *
 * @returns {void}
 */
function clearDropCardPreview() {
    document.querySelectorAll('.task__list--preview').forEach(list => {
        list.classList.remove('task__list--preview');
    });
}

function getTouchDropZone(touch) {
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    return el ? el.closest('.task__area') : null;
}

document.addEventListener('click', function (event) {
    if (!suppressNextCardClick) return;
    if (event.target.closest('.task__card')) {
        event.preventDefault();
        event.stopPropagation();
        suppressNextCardClick = false;
    }
}, true);

document.addEventListener('dragstart', function (event) {
    const card = event.target.closest('.task__card');
    if (!card) return;
    currentDraggedElement = card.id;
    card.classList.add('task__card--dragging');
});

document.addEventListener('dragend', function (event) {
    const card = event.target.closest('.task__card');
    if (!card) return;
    card.classList.remove('task__card--dragging');
    clearDropHighlights();
    clearDropCardPreview();
    currentDraggedElement = undefined;
});

document.addEventListener('dragover', function (event) {
    event.preventDefault();
    const dropZone = event.target.closest('.task__area');
    clearDropHighlights();
    clearDropCardPreview();
    if (!dropZone) return;
    const taskList = dropZone.querySelector('.task__list');
    if (!taskList) return;
    taskList.classList.add('task__list--preview');
});

document.addEventListener('drop', async function (event) {
    event.preventDefault();
    const dropZone = event.target.closest('.task__area');
    clearDropHighlights();
    clearDropCardPreview();
    if (!dropZone || !currentDraggedElement) return;
    const newStatus = /** @type {SubtaskStatus} */ (dropZone.dataset.status);
    const oldStatus = todos[currentDraggedElement]?.status;
    dropZone.classList.remove('task__list--preview');
    todos[currentDraggedElement].status = newStatus;
    updateHTML();
    try {
        await updateTaskStatus(currentDraggedElement, newStatus);
    } catch (error) {
        console.error('Firebase-Update fehlgeschlagen:', error);
        if (todos[currentDraggedElement]) {
            todos[currentDraggedElement].status = oldStatus;
            updateHTML();
        }
        alert('Status konnte nicht gespeichert.');
    }
});

document.addEventListener('dragleave', function (event) {
    const dropZone = event.target.closest('.task__area');
    if (!dropZone) return;
    dropZone.classList.remove('task__area--highlight');
});

// mobile drag and drop support

let touchDragTimer;
let touchDraggedCard;
const TOUCH_DRAG_START_DELAY = 180;

function startTouchDrag() {
    if (!touchDraggedCard || !touchDraggedElement) return;
    touchDragStarted = true;
    touchDraggedCard.classList.add('task__card--dragging');
    document.body.classList.add('board--dragging');
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
}

function endTouchDragVisuals() {
    if (touchDraggedCard) touchDraggedCard.classList.remove('task__card--dragging');
    document.body.classList.remove('board--dragging');
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    touchDraggedCard = undefined;
}

function clearTouchDragTimer() {
    if (touchDragTimer) {
        clearTimeout(touchDragTimer);
        touchDragTimer = undefined;
    }
}

document.addEventListener('touchstart', function (event) {
    const card = event.target.closest('.task__card');
    if (!card) return;

    const t = event.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchDraggedElement = card.id;
    touchDraggedCard = card;
    touchDragStarted = false;

    clearTouchDragTimer();
    touchDragTimer = setTimeout(startTouchDrag, TOUCH_DRAG_START_DELAY);
}, { passive: true });

document.addEventListener('touchmove', function (event) {
    if (!touchDraggedElement) return;

    const t = event.touches[0];
    const dx = Math.abs(t.clientX - touchStartX);
    const dy = Math.abs(t.clientY - touchStartY);

    // drag stop if user is scrolling instead of dragging
    if (!touchDragStarted && (dx > TOUCH_DRAG_THRESHOLD || dy > TOUCH_DRAG_THRESHOLD)) {
        clearTouchDragTimer();
        touchDraggedElement = undefined;
        touchDraggedCard = undefined;
        return;
    }

    if (!touchDragStarted) return;
    if(event.cancelable) {
        event.preventDefault();
    }
    clearDropHighlights();
    clearDropCardPreview();

    const dropZone = getTouchDropZone(t);
    if (!dropZone) return;

    const taskList = dropZone.querySelector('.task__list');
    if (!taskList) return;
    taskList.classList.add('task__list--preview');
}, { passive: false });

document.addEventListener('touchend', async function (event) {
    const wasDragging = touchDragStarted;
    clearTouchDragTimer();

    if (!touchDraggedElement) {
        touchDragStarted = false;
        endTouchDragVisuals();
        return;
    }

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
            console.error('Firebase-Update fehlgeschlagen:', error);
            if (todos[touchDraggedElement]) {
                todos[touchDraggedElement].status = oldStatus;
                updateHTML();
            }
            alert('Status konnte nicht gespeichert.');
        }
    }

    if (wasDragging) suppressNextCardClick = true;

    touchDraggedElement = undefined;
    touchDragStarted = false;
    endTouchDragVisuals();
}, { passive: true });

document.addEventListener('touchcancel', function () {
    clearTouchDragTimer();
    touchDraggedElement = undefined;
    touchDragStarted = false;
    clearDropHighlights();
    clearDropCardPreview();
    endTouchDragVisuals();
}, { passive: true });

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
