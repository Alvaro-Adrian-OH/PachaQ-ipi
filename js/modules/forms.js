import { state, saveState } from "./state.js";
import { showToast } from "./feedback.js";

function getInitials(name) {
  return name.trim().split(/\s+/).slice(0, 2)
    .map(function (part) { return part.charAt(0).toUpperCase(); })
    .join("");
}

function addFamilyMember(form) {
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  if (!name) return;

  const person = {
    initials: getInitials(name),
    name: name,
    role: String(data.get("role") || "Integrante"),
    note: String(data.get("note") || "Sin condición especial")
  };
  state.family.push(person);
  saveState();

  const list = document.getElementById("family-list");
  if (list) {
    const member = document.createElement("article");
    member.className = "member";
    const initials = document.createElement("span");
    initials.className = "member-initials";
    initials.setAttribute("aria-hidden", "true");
    initials.textContent = person.initials;
    const info = document.createElement("span");
    info.className = "member-info";
    const memberName = document.createElement("strong");
    memberName.textContent = person.name;
    const details = document.createElement("small");
    details.textContent = person.role + " · " + person.note;
    info.append(memberName, details);
    const remove = document.createElement("button");
    remove.className = "remove-member";
    remove.type = "button";
    remove.dataset.removeMember = String(state.family.length - 1);
    remove.setAttribute("aria-label", "Quitar a " + person.name);
    remove.textContent = "Quitar";
    member.append(initials, info, remove);
    list.appendChild(member);
  }
  document.querySelectorAll("[data-family-count]").forEach(function (element) {
    element.textContent = String(state.family.length);
  });
  form.reset();
  showToast("Integrante agregado al grupo familiar.");
}

function addSafeZone(form) {
  const data = new FormData(form);
  const name = String(data.get("zone") || "").trim();
  if (!name) return;
  state.zones.push(name);
  saveState();

  const list = document.getElementById("safe-zone-list");
  if (list) {
    const row = document.createElement("div");
    row.className = "list-row";
    const label = document.createElement("strong");
    label.textContent = name;
    const detail = document.createElement("small");
    detail.textContent = "Punto de encuentro familiar";
    const text = document.createElement("span");
    text.append(label, detail);
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = "Encuentro";
    row.append(text, tag);
    list.appendChild(row);
  }
  form.reset();
  showToast("Zona segura agregada.");
}

export function handleFormSubmit(event) {
  const form = event.target.closest("form");
  if (!form) return;
  event.preventDefault();

  const formType = form.dataset.form;
  if (formType === "login") {
    window.location.href = "assessment-material.html";
  } else if (formType === "forgot") {
    showToast("Si el correo está registrado, recibirás un enlace de recuperación.");
  } else if (formType === "add-member") {
    addFamilyMember(form);
  } else if (formType === "add-zone") {
    addSafeZone(form);
  } else if (formType === "simulation") {
    const selected = form.querySelector('input[name="answer"]:checked');
    if (!selected) {
      showToast("Selecciona una respuesta para continuar.");
      return;
    }
    state.answer = selected.value;
    state.score = selected.value === "B" ? 100 : 40;
    saveState();
    window.location.href = "results.html";
  }
}
