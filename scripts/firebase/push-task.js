/**
 * @file
 * Provides Firebasew Realtime Database utilities
 * for storing task data.
 *
 * @module push-task
 */
import { database } from './firebase.js';
import { ref, push } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

/**
 * Pushes a new task object to the Firebase Realtime Database.
 *
 * Creates a new entry under the "tasks" node
 * and returns the generated key of the created task.
 *
 * @async
 * @function pushTask
 * @param {Object} taskData - The task data object that should be stored.
 * @returns {Promise<string|null>} Resolves with the generated Firebase key.
 * @throws {Error} Throws an error if the task could not be saved.
 */
export async function pushTask(taskData) {
  try {
    const tasksRef = ref(database, "tasks");
    const newTaskRef = await push(tasksRef, taskData);
    return newTaskRef.key;
  } catch (error) {
    console.error("Error while saving Tasks:", error.message || error);
    throw error;
  }
}
