/** Wires up the credits, imprint and settings dialogs. */
export function setupDialogs() {
  setupDialog("credits-button", "credits-overlay", "credits-title", "credits-back-button");
  setupDialogButton("victory-credits-button", document.getElementById("credits-overlay"), "credits-title");
  setupDialog("imprint-button", "imprint-overlay", "imprint-title", "imprint-back-button");
  document.getElementById("settings-button").addEventListener("click", openSettings);
  document.getElementById("pause-settings-button").addEventListener("click", openSettings);
  document.getElementById("settings-back-button").addEventListener("click", closeSettings);
  document.getElementById("settings-overlay").addEventListener("click", onBackdropClick);
  setupSettingsTabs();
}

/** Adds click and arrow key navigation to the settings tabs. */
function setupSettingsTabs() {
  document.querySelectorAll(".settings-tab").forEach((tabRef) => {
    tabRef.addEventListener("click", () => selectSettingsTab(tabRef));
    tabRef.addEventListener("keydown", onSettingsTabKeydown);
  });
}

/**
 * Selects a settings tab and shows only its panel.
 * @param {HTMLElement} selectedTabRef - Tab to select.
 * @param {boolean} [shouldFocus=false] - Whether to focus the selected tab.
 */
function selectSettingsTab(selectedTabRef, shouldFocus = false) {
  document.querySelectorAll(".settings-tab").forEach((tabRef) => {
    const isSelected = tabRef === selectedTabRef;
    tabRef.setAttribute("aria-selected", String(isSelected));
    tabRef.tabIndex = isSelected ? 0 : -1;
    document.getElementById(tabRef.getAttribute("aria-controls")).hidden = !isSelected;
  });
  if (shouldFocus) selectedTabRef.focus();
}

/**
 * Moves the tab selection with the left and right arrow keys.
 * @param {KeyboardEvent} event - Keydown event on a settings tab.
 */
function onSettingsTabKeydown(event) {
  if (event.code !== "ArrowLeft" && event.code !== "ArrowRight") return;
  event.preventDefault();
  const tabRefs = [...document.querySelectorAll(".settings-tab")];
  const step = event.code === "ArrowRight" ? 1 : -1;
  const nextIndex = (tabRefs.indexOf(event.currentTarget) + step + tabRefs.length) % tabRefs.length;
  selectSettingsTab(tabRefs[nextIndex], true);
}

/**
 * Wires up a dialog with an open button, a back button and backdrop closing.
 * @param {string} buttonId - Id of the button that opens the dialog.
 * @param {string} dialogId - Id of the dialog element.
 * @param {string} titleId - Id of the title focused on open.
 * @param {string} backId - Id of the button that closes the dialog.
 */
function setupDialog(buttonId, dialogId, titleId, backId) {
  const dialogRef = document.getElementById(dialogId);
  setupDialogButton(buttonId, dialogRef, titleId);
  document.getElementById(backId).addEventListener("click", () => dialogRef.close());
  dialogRef.addEventListener("click", onBackdropClick);
}

/**
 * Makes a button open a dialog.
 * @param {string} buttonId - Id of the button.
 * @param {HTMLDialogElement} dialogRef - Dialog to open.
 * @param {string} titleId - Id of the title focused on open.
 */
function setupDialogButton(buttonId, dialogRef, titleId) {
  document.getElementById(buttonId).addEventListener("click", () => openDialog(dialogRef, titleId));
}

/**
 * Opens a dialog modally and focuses its title.
 * @param {HTMLDialogElement} dialogRef - Dialog to open.
 * @param {string} titleId - Id of the title to focus.
 */
function openDialog(dialogRef, titleId) {
  dialogRef.showModal();
  document.getElementById(titleId).focus();
}

/** Opens the settings dialog. */
function openSettings() {
  openDialog(document.getElementById("settings-overlay"), "settings-title");
}

/** Closes the settings dialog. */
function closeSettings() {
  document.getElementById("settings-overlay").close();
}

/**
 * Closes a dialog when its backdrop is clicked.
 * @param {MouseEvent} event - Click event on the dialog.
 */
function onBackdropClick(event) {
  const dialogRef = event.currentTarget;

  if (event.target === dialogRef) {
    dialogRef.close();
  }
}
