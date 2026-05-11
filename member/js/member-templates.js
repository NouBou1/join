import { getInitials, getAvatarColor } from './contacts-render.js';


/**
 * Generates the header HTML for member pages.
 *
 * Includes the help link and the profile menu with legal, privacy,
 * and logout actions.
 *
 * @returns {string} HTML string representing the member header.
 */
export function getHeaderTemplate() {
  return `
          <div class="topbar-left">Kanban Project Management Tool</div>
          <div class="topbar__logo"><img class="header__logo" src="../../assets/img/logo-dark.svg" alt="" ></div>
          <div class="topbar-right">
              <a href="./help.html"class="help-circle" title="Help">?</a>
              <div id="headerMenue" class="profile">
                  <span id="profileInitials"></span>
                  <nav id="headerMenueNav" class="header-menue-nav d_none">
                      <ul>
                          <a href="./legal-notice-user.html">Legal Notice</a>
                      </ul>
                      <ul>
                          <a href="./privacy-policy-user.html">Privacy Policy</a>
                      </ul>
                      <ul>
                          <a id="logoutBtn">
                              Log out
                          </a>
                      <ul/>
                  </nav>
              </div>
          </div>
      `;
}

/**
 * Generates the sidebar HTML for member pages.
 *
 * Includes the main navigation and footer links.
 *
 * @returns {string} HTML string representing the member sidebar.
 */
export function getSidebarTemplate() {
  const path = window.location.pathname;

  const privacyActive = path.includes("privacy-policy") ? "nav-item--active" : "";
  const legalActive = path.includes("legal-notice") ? "nav-item--active" : "";

  return `
      <div class="logo">
        <img src="../assets/img/logo-bright.svg" alt="" >
      </div>

      <nav class="nav">
        <a class="nav-item" href="./summary.html">
          <img src="../assets/icons/side-menu/summary-icon.svg" alt="Summary" class="nav-icon">Summary
        </a>
        <a class="nav-item" href="./add-task.html">
          <img src="../assets/icons/side-menu/add-task-icon.svg" alt="Add Task" class="nav-icon">Add Task
        </a>
        <a class="nav-item" href="./board.html">
          <img src="../assets/icons/side-menu/board-icon.svg" alt="Board" class="nav-icon">Board
        </a>
        <a class="nav-item" href="./contacts.html">
          <img src="../assets/icons/side-menu/contacts-icon.svg" alt="Contacts" class="nav-icon">Contacts
        </a>
      </nav>

      <div class="footer footer__sidebar">
        <a href="./privacy-policy-user.html" class="nav-item legal-nav-item ${privacyActive}">
          Privacy Policy
        </a>
        <a href="./legal-notice-user.html" class="nav-item legal-nav-item ${legalActive}">
          Legal Notice
        </a>
      </div>
    `;
}

/**
 * Generates the add-task form HTML.
 *
 * Returns markup only. Event handling and validation
 * are implemented in the related controller script.
 *
 * @returns {string} HTML string representing the add-task form.
 */
export function getTaskTemplate() {
  return `
    <section class="overlay_add_task">
      <button class="add-task-close-btn" type="button" aria-label="Close">
        <img src="../assets/icons/close-icon.svg" alt="">
      </button>
      <div class="add-task__overlay-bg">
      <h1 class="add-task__title">Add Task</h1>
      
      <form id="add_task_form" ">
        <section class="add-task__grid">
          <section class="add-task__column add-task__column--left">
            <div class="form-field">
              <label for="title">Title <span class="required">*</span></label>
              <input class="add-task__input" type="text" id="title" name="title" required placeholder="Enter a title">
              <span class="error-message">This field is required</span>
            </div>

            <div class="form-field">
              <label for="description">Description</label>
              <textarea class="add-task__textarea" id="description" name="description" placeholder="Enter a Description"></textarea>
            </div>

            <div class="form-field">
              <label for="due_date">Due date <span class="required">*</span></label>
              <input class="add-task__input" type="date" id="due_date" name="due_date" required>
              <span class="error-message">This field is required</span>
            </div>
          </section>

          <hr class="add-task__divider">

          <section class="add-task__column add-task__column--right">
            <section class="add-task__priority">
              <label for="priority">Priority</label>
              <div id="priority" class="add-task__priority-options" name="priority">
                <button type="button" class="button add-task__priority-button" value="urgent">
                  Urgent <img src="../assets/icons/urgent-prio-icon.svg" alt="">
                </button>
                <button type="button" class="button add-task__priority-button" value="medium">
                  Medium <img src="../assets/icons/medium-prio-icon.svg" alt="">
                </button>
                <button type="button" class="button add-task__priority-button" value="low">
                  Low <img src="../assets/icons/low-prio-icon.svg" alt="">
                </button>
              </div>
            </section>

            <label for="assigned_to_input">Assigned to</label>
            <div class="custom-select add-task__field-spacing" id="assigned_to">
              <button type="button" class="custom-select__trigger" id="assigned_to_trigger">
                <span class="custom-select__trigger-label">Select contacts to assign</span>
                <span class="custom-select__arrow">▾</span>
              </button>
              <div class="custom-select__options d_none" id="assigned_to_options"></div>
            </div>
            <input type="hidden" id="assigned_to_input" name="assigned_to">
            <div class="add-task__selected-assignees" id="selected_assignees_display"></div>

            <div class="form-field add-task__field-spacing" id="category_field">
              <label for="category_input">Category <span class="required">*</span></label>
              <div class="custom-select" id="category_select">
                <button type="button" class="custom-select__trigger" id="category_trigger" aria-haspopup="listbox"
                  aria-expanded="false">
                  <span class="custom-select__trigger-label" id="category_trigger_label">Select task category</span>
                  <span class="custom-select__arrow">▾</span>
                </button>
                <div class="custom-select__options d_none" id="category_options" role="listbox">
                  <button type="button" class="custom-select__option" data-value="technical-task">Technical Task</button>
                  <button type="button" class="custom-select__option" data-value="user-story">User Story</button>
                </div>
              </div>
              <input type="hidden" id="category_input" name="category" value="">
              <span class="error-message">This field is required</span>
            </div>

            <label for="subtask">Subtasks</label>
            <div class="add-task__subtask">
              <input class="add-task__input add-task__subtask-input" type="text" id="subtask" name="subtask" placeholder="Add new subtask">
              <div class="add-task__subtask-actions d_none" id="subtask_actions">
                <button type="button" class="add-task__subtask-action-btn" id="clear_subtask_btn">✕</button>
                <span class="subtask-divider">|</span>
                <button type="button" class="add-task__subtask-action-btn" id="confirm_subtask_btn">✓</button>
              </div>
            </div>
            <div class="subtask-list" id="subtask_list"></div>
          </section>
        </section>

        <section class="add-task__footer">
          <span class="add-task__required-hint">
            <span class="add-task__required-star">*</span> This field is required
          </span>

          <div class="add-task__actions">
            <button class="button add-task__button add-task__button--secondary" type="button">
              Cancel <img src="../assets/icons/close-icon.svg" alt="">
            </button>
            <button class="button add-task__button add-task__button--primary" type="button">
              Create Task <img src="../assets/icons/check-icon-white.svg" alt="">
            </button>
          </div>
        </section>
      </form>
      </div>

      
    </section>
  `;
}

/**
 * Generates the add-contact overlay HTML.
 *
 * Intended to be injected into an overlay container element.
 *
 * @returns {string} HTML string representing the add-contact overlay.
 */
export function getAddOverlayTemplate() {
  return `
     <main class="addContact_overlay">
          <section class="overlay_add_contact">

            <div class="overlay_add_contact_left">
                <img class="join_logo_overlay" src="../../assets/img/logo-bright.svg" alt="Join Logo">
                <div>
                <h2 class="heading_add_contact">Add Contact</h2>
                <p>Tasks are better with a team!</p>
                <img class="h2_underline" style="margin: unset; height: unset; width: 90px;" src="../../assets/icons/underline-blue.svg" alt="">
                </div>
            </div>

            <div class="overlay_add_contact_right">

                <div class="close_overlay_icon_container">
                    <img class="close_overlay_icon" src="../../assets/icons/close-white.svg" alt="Close Overlay Icon" onclick="hideAddContactOverlay()">
                </div>
                <div class="addContact_form_container">

                    <div>
                        <img class="overlay_avatar" src="../../assets/icons/contact-icon.svg" alt="Contact Icon">
                    </div>
                    <form class="form_add_contact" id="add_contact_form" novalidate>
                      <div class="form-field">
                        <input type="text" id="contact_name" name="contact_name" class="input_add_contact" placeholder="Name">
                        <span class="error-message" data-default-message="This field is required">This field is required</span>
                      </div>
                      <div class="form-field">
                        <input type="email" id="contact_email" name="contact_email" class="input_add_contact" placeholder="Email">
                        <span class="error-message" data-default-message="This field is required">This field is required</span>
                      </div>
                      <div class="form-field">
                        <input type="tel" id="contact_phone" name="contact_phone" class="input_add_contact" placeholder="Phone">
                        <span class="error-message" data-default-message=""></span>
                      </div>
                    </form>
                </div>

                <div class="buttons_add_contact">
                    <button type="button" class="button btn_cancel_contact" onclick="hideAddContactOverlay()">Cancel <img src="../../assets/icons/close-icon.svg" alt="Close Icon"></button>
                    <button type="submit" form="add_contact_form" class="button btn_save_contact">Create contact <img src="../../assets/icons/check-icon-white.svg" alt="Check Icon"></button>
                </div>

            </div>

          </section>

      </main>
    `;
}

/**
 * Generates a success message shown after a successful signup.
 *
 * @returns {string} HTML string representing the signup success message.
 */
export function signupMassegeTemplate() {
  return `
        <aside class="signup-massege-box">
            <p>
                You Signed Up successfully
            </p>
        </aside>
    `;
}

/**
 * Formats an internal task category value into a user-friendly label.
 *
 * @param {string} category - The raw category value.
 * @returns {string} The formatted category label.
 */
function formatCategoryLabel(category) {
  const labels = {
    'user-story': 'User Story',
    'technical-task': 'Technical Task'
  };

  return labels[category] || category;
}

/**
 * Limits the Length of the title and text in the task card and adds "***" at the end if the text exceeds the maxLength.
 *
 * @param {string} text
 * @param {string} maxLength
 * @returns
 */
function limitText(text, maxLength) {
  const value = String(text || '');

  if (value.length <= maxLength) {
    return value;
  }

  return value.slice(0, maxLength) + '***';
}

/**
 * Generates the HTML string for a task card in the board view.
 *
 * @param {string} id - The task id.
 * @param {string} title - The task title.
 * @param {Category} category - The task category.
 * @param {string} description - The task description.
 * @param {Priority} priority - The task priority.
 * @param {string} [subtaskProgressHTML=''] - Prebuilt subtask progress HTML.
 * @param {string} [assigneeAvatarsHTML=''] - Prebuilt assignee avatar HTML.
 * @returns {string} HTML string representing the board task card.
 */
export function generateTodosHTML(id, title, category, description, priority, subtaskProgressHTML = '', assigneeAvatarsHTML = '') {
  return `
    <div class="task__card" id="${id}" onclick="openTaskOverlay('${id}')" draggable="true">
      <span class="task__category--${category}">${formatCategoryLabel(category)}</span><br>
      <h4 class="task__title">${limitText(title, 18)}</h4><br>
      <p class="task__text">${limitText(description, 30)}</p><br>
      ${subtaskProgressHTML}
      <div class="task__footer">
        <div class="task__assignees">${assigneeAvatarsHTML}</div>
        <img src="../assets/icons/${priority}-prio-icon.svg" alt="">
      </div>
    </div>
  `;
}

/**
 * Generates the active-contact detail template.
 *
 * @param {Object} contact - The contact data.
 * @param {string} [contact.id] - The contact id.
 * @param {string} [contact.name] - The contact name.
 * @param {string} [contact.email] - The contact email.
 * @param {string} initials - The contact initials.
 * @param {string} bgColor - The avatar background color.
 * @param {string|number} phone - The displayed phone number.
 * @returns {string} HTML string representing the active contact details.
 */
export function getActiveContactTemplate(contact, initials, bgColor, phone) {
  return `
    <section class="contact_detail_card contact_detail_card--enter">

      <div class="contact_mobile_heading_row">
        <div class="contact_mobile_heading_text">
          <h1 class="contact_mobile_title">Contacts</h1>
          <p class="contact_mobile_subtitle">Better with a team</p>
          <span class="contact_mobile_underline"></span>
        </div>
        <button type="button" class="contact_mobile_back_btn" onclick="closeMobileDetailView()" aria-label="Back to contacts">
          <img src="../../assets/icons/arrow-left-icon.svg" alt="Back">
        </button>
      </div>

      <div class="contact_detail_header">
        <div class="contact_avatar contact_avatar--large" style="background-color:${bgColor}">
          ${initials}
        </div>
        <div class="contact__name--container">
          <h2 class="contact_detail_name">${contact.name || ''}</h2>
          <div class="contact_detail_actions">
            <button type="button" class="link_btn button--icon" onclick="editContact('${contact.id}')">
              <img src="../../assets/icons/pencil-icon.svg" alt="Edit"><span>Edit</span>
            </button>
            <button type="button" class="link_btn button--icon" onclick="deleteContact('${contact.id}')">
              <img src="../../assets/icons/trash-icon.svg" alt="Delete"><span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      <h3 class="contact_detail_subtitle">Contact Information</h3>

      <div class="contact_detail_info">
        <strong>Email</strong>
        <a class="contact_detail_email" href="mailto:${contact.email || ''}">${contact.email || ''}</a>
      </div>

      <div class="contact_detail_info">
        <strong>Phone</strong>
        <a class="contact_detail_phone" href="tel:${phone}">${phone}</a>
      </div>

      <button type="button" class="contact_mobile_fab_btn" onclick="toggleContactMobileActions()" aria-label="Open contact actions">
        <span class="contact_mobile_fab_dots">&#8942;</span>
      </button>

      <div id="contact_mobile_actions_menu" class="contact_mobile_actions_menu d_none">
        <button type="button" class="contact_mobile_action_btn" onclick="editContact('${contact.id}')">
          <img src="../../assets/icons/pencil-icon.svg" alt="Edit"><span>Edit</span>
        </button>
        <button type="button" class="contact_mobile_action_btn" onclick="deleteContact('${contact.id}')">
          <img src="../../assets/icons/trash-icon.svg" alt="Delete"><span>Delete</span>
        </button>
      </div>

    </section>
  `;
}

/**
 * Builds the HTML template string for one contact list entry.
 *
 * @param {Object} contact - The contact data to render.
 * @param {string} contact.name - The contact name.
 * @param {string} contact.email - The contact email address.
 * @returns {string} HTML string representing the contact list item.
 */
export function getContactItemTemplate(contact) {
  const initials = getInitials(contact.name);
  const bgColor = getAvatarColor(contact.name);
  return `
        <section class="contact_container">
            <div class="contact_avatar" style="background-color: ${bgColor}">
                ${initials}
            </div>
            <div class="contact_info">
                <div class="contact_name">${contact.name}</div>
                <div class="contact_email">${contact.email}</div>
            </div>
        </section>
    `;
}

/**
 * Generates the edit-contact overlay template.
 *
 * @param {string} contactId - The id of the contact being edited.
 * @param {Object} contact - The contact data.
 * @param {string} [contact.name] - The contact name.
 * @param {string} [contact.email] - The contact email.
 * @param {string} [contact.phone] - The contact phone number.
 * @param {string} initials - The contact initials.
 * @param {string} color - The avatar background color.
 * @returns {string} HTML string representing the edit-contact overlay.
 */
export function getEditOverlayTemplate(contactId, contact, initials, color) {
  return `
    <section class="overlay_add_contact" onclick="event.stopPropagation()">
      <div class="overlay_add_contact_left">
        <img class="join_logo_overlay" src="../../assets/img/logo-bright.svg" alt="Join Logo">
        <h2 class="heading_add_contact">Edit Contact</h2>
        <img class="h2_underline" src="../../assets/icons/underline-blue.svg" alt="">
      </div>

      <div class="overlay_add_contact_right">
       <div class="close_overlay_icon_container">
                    <img class="close_overlay_icon" src="../../assets/icons/close-white.svg" alt="Close Overlay Icon" onclick="closeEditOverlay()">
                </div>
        <div class="addContact_form_container">
            <div class="contact_avatar contact_avatar--large edit_overlay_avatar overlay_avatar" style="background-color:${color}">
                ${initials}
            </div>
          <form class="form_add_contact" id="edit_contact_form">
            <div class="form-field">
              <input type="text" id="contact_name" class="input_add_contact" placeholder="Name" value="${contact.name || ''}">
              <span class="error-message" data-default-message="This field is required">This field is required</span>
            </div>
            <div class="form-field">
              <input type="email" id="contact_email" class="input_add_contact" placeholder="Email" value="${contact.email || ''}">
              <span class="error-message" data-default-message="This field is required">This field is required</span>
            </div>
            <div class="form-field">
              <input type="tel" id="contact_phone" class="input_add_contact" placeholder="Phone" value="${contact.phone || ''}" inputmode="tel"  pattern="^\\+?[0-9]*$" title="Please enter numbers only">
              <span class="error-message" data-default-message=""></span>
            </div>
            <div class="buttons_add_contact">
              <button type="button" class="button btn_cancel_contact" onclick="deleteContact('${contactId}')">Delete</button>
              <button type="submit" class="button btn_save_contact btn_save_contact--edit">Save<img src="../../assets/icons/check-icon-white.svg" alt=""></button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;
}

/**
 * Generates the task-detail overlay template.
 *
 * @param {string} id - The task id.
 * @param {Category} category - The task category.
 * @param {string} title - The task title.
 * @param {string} description - The task description.
 * @param {string} due_date - The task due date.
 * @param {Priority} priority - The task priority.
 * @param {string[]|string} assigned_to - Assigned contacts.
 * @param {Object<string, {status?: boolean, completed?: boolean, title?: string}>} subtasks - Task subtasks.
 * @returns {string} HTML string representing the task-detail overlay.
 */
export function getTaskOverlayTemplate(id, category, title, description, due_date, priority, assigned_to, subtasks) {
  console.log('subtasks input:', subtasks);
  const assignedArray = Array.isArray(assigned_to)
    ? assigned_to
    : assigned_to.split(', ');

  const subtaskEntries = subtasks && typeof subtasks === 'object'
    ? Object.entries(subtasks)
    : [];

  return `
  <div class="task-overlay-content">

        <div class="overlaytemplate-first-section flex-class">
          <p class="task__category--${category} overlaytemplate-category">${formatCategoryLabel(category)}</p>
          <button onclick="closeTaskOverlay()"><img src="../../assets/icons/close-icon.svg" class="close_overlay_icon_getTaskOverlayTemplate" alt=""></button>
        </div>
     <div class="task-overlay-content-scrollable">
      <h2 class="overlaytemplate-title">${title}</h2>
      <p class="overlaytemplate-description">${description}</p>
      <p class="overlaytemplate-due_date">Due date: ${due_date.replace(/-/g, "/")}</p>
      <div class="overlaytemplate__priority--container">
          <p class="overlaytemplate__priority">Priority: ${priority}</p>
          <img src="../assets/icons/${priority}-prio-icon.svg" alt="">
      </div>
      <div class="overlaytemplate__assigned-to">
        <p>Assigned To:</p>
        ${assignedArray.map(person => `
          <div class="assigned_contact">
            <div class="contact_avatar" style="background-color: ${getAvatarColor(person)}">
              ${getInitials(person)}
            </div>
            <span>${person}</span>
          </div>
        `).join('')}
      </div>

      <div class="overlaytemplate-subtask">
        <p>Subtasks:</p>
        <div class="overlaytemplate-subtask-checkbox">

          ${subtaskEntries.map(([key, s]) => {
    const isChecked = s.status === true || s.completed === true;
    const iconSrc = isChecked
      ? "../assets/icons/checkbox/checkbox-icon-checked.svg"
      : "../assets/icons/checkbox/checkbox-icon-unchecked.svg";
    return `
            <div class="subtask-item-taskoverlay">
              <img class="checkbox-icon" src="${iconSrc}" alt="" data-task-id="${id}" data-subtask-key="${key}">
              ${s.title}
            </div>
          `}).join('')}
        </div>
      </div>

      <div class="taskoverlay_detail_actions">
        <button type="button" class="link_btn-taskoverlay button--icon" onclick="deleteTask('${id}')"><img src="../../assets/icons/trash-icon.svg" alt="Delete Icon">Delete</button>
        <div class="divider-grey"></div>
        <button type="button" class="link_btn-taskoverlay button--icon" onclick="editTask('${id}')"><img src="../../assets/icons/pencil-icon.svg" alt="Edit Icon">Edit</button>
      </div>

      </div>
    </div>
      `;
}

/**
 * Generates the edit-task overlay template.
 *
 * @param {string} id - The task id.
 * @param {Category} category - The task category.
 * @param {string} title - The task title.
 * @param {string} description - The task description.
 * @param {string} due_date - The task due date.
 * @param {Priority} priority - The task priority.
 * @param {string[]|string} assigned_to - Assigned contacts.
 * @param {Object<string, {title?: string, status?: boolean, completed?: boolean}>} subtasks - Task subtasks.
 * @returns {string} HTML string representing the edit-task overlay.
 */
export function getEditTaskOverlayTemplate(id, category, title, description, due_date, priority, assigned_to, subtasks) {
  const assignedArray = Array.isArray(assigned_to) ? assigned_to : assigned_to.split(', ');
  const subtaskArray = subtasks && typeof subtasks === 'object' ? Object.values(subtasks) : [];

  return `
  <div class="task-overlay-content edit-task-form">
    <div class="overlaytemplate-first-section padding-right-class">
      <button onclick="closeTaskOverlay()">
        <img src="../../assets/icons/close-icon.svg" class="close_overlay_icon_getTaskOverlayTemplate" alt="">
      </button>
    </div>
    <div class="edit-task-content">
      <form id="edit_task_form" class="add-task__column add-task__column--left">
      <div class="form-field">
          <label for="edit_title" style="font-size: 14px; margin-bottom: 4px; color: #2a3647; font-weight: 400; margin-bottom: 6px;">Title</label>
        <input type="text" id="edit_title" class="add-task__input input__text__editoverlay" value="${title}" required placeholder="Enter a title" style="border-bottom: 1px solid #d1d1d1; border-radius: 10px; padding: 8px 0; margin-bottom: 16px; font-size: 16px; padding-left: 12px;">
      </div>

      <div class="form-field">
        <label for="edit_description" style="font-size: 14px; margin-bottom: 4px; color: #2a3647; font-weight: 400; margin-bottom: 6px;">Description</label>
        <textarea id="edit_description" class="add-task__textarea input__text__editoverlay" placeholder="Enter a description" style="min-height: 80px; font-size: 16px; resize: vertical;">${description}</textarea>
      </div>

      <div class="form-field">
        <label for="edit_due_date" style="font-size: 14px; margin-bottom: 4px; color: #2a3647; font-weight: 400; margin-bottom: 6px;">Due date</label>
        <input type="date" id="edit_due_date" class="add-task__input input__text__editoverlay" value="${due_date}" required style="font-size: 16px;">
      </div>

      <div class="add-task__priority">
        <label style="font-size: 14px; color: #2a3647; font-weight: 400;">Priority</label>
        <div class="add-task__priority-options">
          <button type="button" class="button add-task__priority-button ${priority === 'urgent' ? 'selected' : ''}" value="urgent" data-priority="urgent">
            Urgent <img class="add-task__priority-icon" src="../assets/icons/urgent-prio-icon.svg" alt="">
          </button>
          <button type="button" class="button add-task__priority-button ${priority === 'medium' ? 'selected' : ''}" value="medium" data-priority="medium">
            Medium <img class="add-task__priority-icon" src="../assets/icons/medium-prio-icon.svg" alt="">
          </button>
          <button type="button" class="button add-task__priority-button ${priority === 'low' ? 'selected' : ''}" value="low" data-priority="low">
            Low <img class="add-task__priority-icon" src="../assets/icons/low-prio-icon.svg" alt="">
          </button>
        </div>
      </div>

      <div class="form-field">
        <label for="edit_assigned_to" style="font-size: 14px; margin-bottom: 4px; color: #2a3647; font-weight: 400; margin-bottom: 6px;">Assigned to</label>
        <div class="custom-select" id="edit_assigned_to"  style="margin-bottom: 12px;">
          <button type="button" class="custom-select__trigger input__text__editoverlay" id="edit_assigned_to_trigger">
            <span class="custom-select__trigger-label">Select contacts to assign</span>
            <span class="custom-select__arrow">▾</span>
          </button>
          <div class="custom-select__options d_none" id="edit_assigned_to_options"></div>
        </div>
        <div class="add-task__selected-assignees input__text__editoverlay" id="edit_selected_assignees_display" style="display: flex; gap: 8px; margin-bottom: 22px;">
          ${assignedArray.map(person => `
            <div class="add-task__avatar" style="background-color: ${getAvatarColor(person)}; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 500; font-size: 14px;">
              ${getInitials(person)}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="form-field">
        <label style="font-size: 14px; margin-bottom: 4px; color: #2a3647; font-weight: 400;">Subtasks</label>
        <div class="add-task__subtask" style="position: relative; margin-bottom: 12px;">
          <input class="add-task__input add-task__subtask-input" type="text" id="edit_subtask" name="edit_subtask" placeholder="Add new subtask" ">
          <div class="add-task__subtask-actions d_none" id="edit_subtask_actions">
            <button type="button" class="add-task__subtask-action-btn" id="edit_clear_subtask_btn">✕</button>
            <span class="subtask-divider">|</span>
            <button type="button" class="add-task__subtask-action-btn" id="edit_confirm_subtask_btn">✓</button>
          </div>
        </div>
        <div class="subtask-list" id="edit_subtask_list" style="margin-bottom: 8px;">
          ${Object.entries(subtasks && typeof subtasks === 'object' ? subtasks : {}).map(([key, s]) => `
            <div class="subtask-item" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0; font-size: 16px; color: #2a3647;">
              <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                <span style="line-height: 1.5;">•</span>
                <span style="line-height: 1.5; flex: 1;" id="subtask_text_${key}">${s.title}</span>
              </div>
              <div class="subtask-item-actions" style="display: flex; gap: 8px;">
                <button type="button" class="subtask-icon-btn" onclick="editExistingSubtask('${id}', '${key}')" title="Edit" style="border: none; background: transparent; cursor: pointer; font-size: 18px; padding: 0;">
                  <img src="../assets/icons/pencil-icon.svg" alt="Edit" style="width: 16px; height: 16px;">
                </button>
                <button type="button" class="subtask-icon-btn" onclick="deleteExistingSubtask('${id}', '${key}')" title="Delete" style="border: none; background: transparent; cursor: pointer; font-size: 18px; padding: 0;">
                  <img src="../assets/icons/trash-icon.svg" alt="Delete" style="width: 16px; height: 16px;">
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="subtask-list" id="edit_subtask_list_new"></div>
      </div>

    </form>


    </div>
       <div class="add-task__actions" style="margin-top: 0;">
        <button type="button" class="button add-task__button add-task__button--primary" onclick="saveEditedTask('${id}')">
          Ok <img src="../assets/icons/check-icon-white.svg" alt="">
        </button>
      </div>


  </div>
  `;
}

/**
 * Generates the member mobile footer HTML.
 *
 * @returns {string} HTML string representing the mobile footer.
 */
export function getMobileFooterTemplate() {
  return `
    <footer class="footer__responsive footer__responsive--member">
      <a href="./summary.html" class="button button__mobile button__mobile--member">
        <img class="icon__mobile" src="../assets/icons/menu/summary__mobile.svg" alt="summary mobile">
      </a>
      <a href="./add-task.html" class="button button__mobile button__mobile--member">
        <img class="icon__mobile" src="../assets/icons/menu/add-task__mobile.svg" alt="add-task mobile">
      </a>
      <a href="./board.html" class="button button__mobile button__mobile--member">
        <img class="icon__mobile" src="../assets/icons/menu/board__mobile.svg" alt="board mobile">
      </a>
      <a href="./contacts.html" class="button button__mobile button__mobile--member">
        <img class="icon__mobile" src="../assets/icons/menu/contacs__mobile.svg" alt="contacts mobile">
      </a>
    </footer>
  `;
}
