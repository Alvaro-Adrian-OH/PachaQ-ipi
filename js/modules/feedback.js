let toastTimer;

export function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.removeAttribute("hidden");
  toast.textContent = "";
  window.requestAnimationFrame(function () {
    toast.textContent = message;
    toast.dataset.visible = "true";
  });
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(function () {
    toast.dataset.visible = "false";
  }, 2800);
}
