let toastTimer;

export function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  toast.dataset.visible = "true";
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(function () {
    toast.hidden = true;
    toast.dataset.visible = "false";
  }, 2800);
}
