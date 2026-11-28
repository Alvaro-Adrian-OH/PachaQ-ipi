import { state, saveState, parseCoordinatesFromText } from "./state.js";
import { showToast } from "./feedback.js";
import { navigateTo } from "./layout.js";

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

  let rawLat = String(data.get("lat") || "").trim();
  let rawLng = String(data.get("lng") || "").trim();
  const mapsLink = String(data.get("mapsLink") || "").trim();

  if ((!rawLat || !rawLng) && mapsLink) {
    const parsed = parseCoordinatesFromText(mapsLink);
    if (parsed.coords) {
      rawLat = String(parsed.coords.lat);
      rawLng = String(parsed.coords.lng);
    } else if (parsed.isShortLink) {
      showToast("Enlace corto detectado. Pega las coordenadas o el enlace completo de Google Maps.");
      return;
    }
  }

  let lat = null;
  let lng = null;
  if (rawLat !== "" || rawLng !== "") {
    lat = Number(rawLat);
    lng = Number(rawLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      showToast("Ingresa coordenadas válidas (latitud -90 a 90, longitud -180 a 180).");
      return;
    }
  }

  const newZone = lat !== null && lng !== null
    ? { name: name, lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }
    : name;

  state.zones.push(newZone);
  if (lat !== null && lng !== null) {
    state.mapConfig.selectedTarget = "custom:" + (state.zones.length - 1);
  }
  saveState();

  form.reset();
  const pasteStatus = document.querySelector("[data-paste-status]");
  if (pasteStatus) {
    pasteStatus.textContent = "Pega un enlace de Google Maps o coordenadas y se completarán automáticamente.";
  }

  document.dispatchEvent(new CustomEvent("zones:updated"));
  showToast(
    lat !== null && lng !== null
      ? "Zona segura guardada con coordenadas y ruta peatonal lista."
      : "Zona segura agregada."
  );
}

export function handleFormSubmit(event) {
  const form = event.target.closest("form");
  if (!form) return;
  event.preventDefault();

  const formType = form.dataset.form;
  if (formType === "login") {
    navigateTo("assessment-material.html");
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
    navigateTo("results.html");
  }
}
