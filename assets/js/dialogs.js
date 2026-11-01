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

function setupSettingsTabs() {
  document.querySelectorAll(".settings-tab").forEach((tabRef) => {
    tabRef.addEventListener("click", () => selectSettingsTab(tabRef));
    tabRef.addEventListener("keydown", onSettingsTabKeydown);
  });
}

function selectSettingsTab(selectedTabRef, shouldFocus = false) {
  document.querySelectorAll(".settings-tab").forEach((tabRef) => {
    const isSelected = tabRef === selectedTabRef;
    tabRef.setAttribute("aria-selected", String(isSelected));
    tabRef.tabIndex = isSelected ? 0 : -1;
    document.getElementById(tabRef.getAttribute("aria-controls")).hidden = !isSelected;
  });
  if (shouldFocus) selectedTabRef.focus();
}

function onSettingsTabKeydown(event) {
  if (event.code !== "ArrowLeft" && event.code !== "ArrowRight") return;
  event.preventDefault();
  const tabRefs = [...document.querySelectorAll(".settings-tab")];
  const step = event.code === "ArrowRight" ? 1 : -1;
  const nextIndex = (tabRefs.indexOf(event.currentTarget) + step + tabRefs.length) % tabRefs.length;
  selectSettingsTab(tabRefs[nextIndex], true);
}

function setupDialog(buttonId, dialogId, titleId, backId) {
  const dialogRef = document.getElementById(dialogId);
  setupDialogButton(buttonId, dialogRef, titleId);
  document.getElementById(backId).addEventListener("click", () => dialogRef.close());
  dialogRef.addEventListener("click", onBackdropClick);
}

function setupDialogButton(buttonId, dialogRef, titleId) {
  document.getElementById(buttonId).addEventListener("click", () => openDialog(dialogRef, titleId));
}

function openDialog(dialogRef, titleId) {
  dialogRef.showModal();
  document.getElementById(titleId).focus();
}

function openSettings() {
  openDialog(document.getElementById("settings-overlay"), "settings-title");
}

function closeSettings() {
  document.getElementById("settings-overlay").close();
}

function onBackdropClick(event) {
  const dialogRef = event.currentTarget;

  if (event.target === dialogRef) {
    dialogRef.close();
  }
}
