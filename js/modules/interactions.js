import { state, saveState } from "./state.js";
import { showToast } from "./feedback.js";

function updateAssessmentSelection(button) {
  const group = button.dataset.select;
  const value = button.dataset.value;
  state.assessment[group] = value;
  saveState();
  document.querySelectorAll('[data-select="' + group + '"]').forEach(function (option) {
    const selected = option === button;
    option.setAttribute("aria-pressed", String(selected));
    const status = option.querySelector(".option-state");
    if (status) status.textContent = selected ? "Seleccionado" : "Elegir";
  });
}

function updateKitProgress() {
  const checks = Array.from(document.querySelectorAll("[data-supply]"));
  if (!checks.length) return;
  const ready = checks.filter(function (check) { return check.checked; }).length;
  const percentage = Math.round((ready / checks.length) * 100);
  const progress = document.querySelector("[data-kit-progress]");
  const label = document.querySelector("[data-kit-count]");
  if (progress) progress.style.width = percentage + "%";
  if (label) label.textContent = ready + " de " + checks.length + " insumos listos";
}

function applyPreferences() {
  const preferences = state.preferences;
  document.body.classList.toggle("dark-mode", preferences.dark);
  document.body.classList.toggle("large-text", preferences.largeText || preferences.simpleMode);
  document.querySelectorAll("[data-pref]").forEach(function (toggle) {
    toggle.checked = Boolean(preferences[toggle.dataset.pref]);
  });
}

function applySavedOptions() {
  document.querySelectorAll("[data-select]").forEach(function (option) {
    const selected = state.assessment[option.dataset.select] === option.dataset.value;
    option.setAttribute("aria-pressed", String(selected));
    const status = option.querySelector(".option-state");
    if (status) status.textContent = selected ? "Seleccionado" : "Elegir";
  });

  document.querySelectorAll("[data-supply]").forEach(function (check) {
    check.checked = Boolean(state.supplies[Number(check.dataset.supply)]);
  });
}

function renderFamilyList() {
  const list = document.getElementById("family-list");
  if (!list) return;
  list.replaceChildren();
  if (!state.family.length) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = "Aún no hay integrantes registrados.";
    list.appendChild(empty);
    return;
  }
  state.family.forEach(function (person, index) {
    const member = document.createElement("article");
    member.className = "member";
    const initials = document.createElement("span");
    initials.className = "member-initials";
    initials.setAttribute("aria-hidden", "true");
    initials.textContent = person.initials;
    const info = document.createElement("span");
    info.className = "member-info";
    const name = document.createElement("strong");
    name.textContent = person.name;
    const details = document.createElement("small");
    details.textContent = person.role + " · " + person.note;
    info.append(name, details);
    member.append(initials, info);
    if (index > 1) {
      const remove = document.createElement("button");
      remove.className = "remove-member";
      remove.type = "button";
      remove.dataset.removeMember = String(index);
      remove.setAttribute("aria-label", "Quitar a " + person.name);
      remove.textContent = "Quitar";
      member.appendChild(remove);
    }
    list.appendChild(member);
  });
}

function renderSafeZones() {
  const list = document.getElementById("safe-zone-list");
  if (!list) return;
  list.replaceChildren();
  if (!state.zones.length) {
    const empty = document.createElement("p");
    empty.className = "empty-note";
    empty.textContent = "Aún no hay zonas seguras registradas.";
    list.appendChild(empty);
    return;
  }
  state.zones.forEach(function (zone, index) {
    const row = document.createElement("div");
    row.className = "list-row";
    const text = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = zone;
    const detail = document.createElement("small");
    detail.textContent = index === 0 ? "Zona interna · Piso 1" : "Punto de encuentro · Exterior";
    text.append(name, detail);
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = index === 0 ? "Verificado" : "Encuentro";
    row.append(text, tag);
    list.appendChild(row);
  });
}

function updatePageData() {
  document.querySelectorAll("[data-family-count]").forEach(function (element) {
    element.textContent = String(state.family.length);
  });
  document.querySelectorAll("[data-assessment-field]").forEach(function (element) {
    element.textContent = state.assessment[element.dataset.assessmentField] || "";
  });
  document.querySelectorAll("[data-water]").forEach(function (element) {
    element.textContent = String(state.family.length * 6) + " L";
  });
  document.querySelectorAll("[data-portions]").forEach(function (element) {
    element.textContent = String(state.family.length * 9) + " porciones";
  });
  document.querySelectorAll("[data-result-score]").forEach(function (element) {
    element.textContent = String(state.score) + "/100";
  });
  document.querySelectorAll("[data-result-text]").forEach(function (element) {
    element.textContent = state.score >= 80
      ? "Decisión correcta. Supiste esperar a que el bus se detuviera."
      : "Repasa el protocolo y vuelve a practicar.";
  });
  document.querySelectorAll("[data-result-badge]").forEach(function (element) {
    element.textContent = state.score >= 80 ? "Pasajero prevenido" : "Sigue practicando";
  });
  const greeting = document.querySelector("[data-greeting]");
  if (greeting) {
    const hour = new Date().getHours();
    greeting.textContent = (hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches") + ", familia Querales";
  }
  const today = document.querySelector("[data-today]");
  if (today) {
    today.textContent = new Intl.DateTimeFormat("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(new Date()).toLocaleUpperCase("es-PE");
  }
}

function runLoadingPage() {
  const progress = document.querySelector("[data-analysis-progress]");
  if (!progress) return;
  let amount = 12;
  const timer = window.setInterval(function () {
    amount = Math.min(100, amount + 22);
    progress.style.width = amount + "%";
    if (amount >= 100) {
      window.clearInterval(timer);
      window.location.href = "plan.html";
    }
  }, 220);
}

export function initializeInteractions() {
  applyPreferences();
  applySavedOptions();
  renderFamilyList();
  renderSafeZones();
  updatePageData();
  updateKitProgress();
  runLoadingPage();

  document.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.select) {
      updateAssessmentSelection(button);
      return;
    }

    if (button.dataset.removeMember !== undefined) {
      state.family.splice(Number(button.dataset.removeMember), 1);
      saveState();
      renderFamilyList();
      document.querySelectorAll("[data-family-count]").forEach(function (element) {
        element.textContent = String(state.family.length);
      });
      showToast("Integrante quitado del grupo familiar.");
      return;
    }

    const action = button.dataset.action;
    if (action === "print") window.print();
    if (action === "google") {
      window.location.href = "assessment-material.html";
    }
    if (action === "biometric") showToast("El acceso biométrico estará disponible en este dispositivo.");
    if (action === "sync") showToast("Tu plan familiar está actualizado.");
    if (action === "delete-account") showToast("Solicita la eliminación de la cuenta desde soporte.");
    if (action === "copy-location") {
      const text = "Punto de encuentro familiar: Parque Zonal.";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(function () { showToast("Información del punto de encuentro copiada."); })
          .catch(function () { showToast(text); });
      } else {
        showToast(text);
      }
    }
    if (action === "map-route") showToast("Ruta sugerida: dirígete al Parque Zonal por la vía peatonal.");
    if (action === "sos-call") showToast("Baliza SOS activa. Comparte tu ubicación con tu familia.");
    if (action === "deactivate-sos") window.location.href = "home.html";
    if (action === "record") {
      state.recording = !state.recording;
      state.recorded = state.recorded || !state.recording;
      saveState();
      button.textContent = state.recording ? "Detener grabación" : "Grabar nota (00:10)";
      const status = document.querySelector("[data-record-status]");
      if (status) status.textContent = state.recording
        ? "Grabando… toca para detener."
        : state.recorded ? "Nota lista · se enviará al tener conexión." : "Audio guardado en este dispositivo.";
    }
  });

  document.addEventListener("change", function (event) {
    const target = event.target;
    if (target.matches('input[name="answer"]')) {
      document.querySelectorAll(".choice-option").forEach(function (option) {
        option.classList.toggle("selected", option.contains(target));
      });
    }
    if (target.matches("[data-supply]")) {
      state.supplies[Number(target.dataset.supply)] = target.checked;
      saveState();
      updateKitProgress();
    }
    if (target.matches("[data-pref]")) {
      state.preferences[target.dataset.pref] = target.checked;
      saveState();
      applyPreferences();
    }
  });
}
