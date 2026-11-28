import { state } from "./state.js";
import { showToast } from "./feedback.js";

/*
  HU-040 · Localización de refugios temporales y centros de salud.
  CA-01: base de datos precargada en la app (sin pedir nada a un servidor).
  CA-02: ruta a pie desde la posición del usuario hasta el lugar elegido.
  CA-03: filtros "Centros de Salud", "Refugios Temporales" y "Comisarías/Bomberos".

  OJO: nombres y coordenadas son REFERENCIALES. Verifícalos en Google Maps
  (clic derecho sobre el lugar > copiar coordenadas) antes de entregar.
*/
const PLACES = [
  { id: "cs-posta", category: "health", name: "Posta médica San Miguel", detail: "Posta médica · MINSA", lat: -12.0832, lng: -77.0948 },
  { id: "cs-hospital", category: "health", name: "Hospital Nacional Cayetano Heredia", detail: "Hospital · MINSA", lat: -12.0236, lng: -77.0536 },
  { id: "cs-essalud", category: "health", name: "Centro asistencial EsSalud (referencial)", detail: "Centro asistencial · EsSalud", lat: -12.0705, lng: -77.0802 },
  { id: "rf-leyendas", category: "shelter", name: "Parque de las Leyendas", detail: "Parque zonal · refugio temporal", lat: -12.0695, lng: -77.0820 },
  { id: "rf-estadio", category: "shelter", name: "Estadio municipal de San Miguel", detail: "Estadio · refugio temporal", lat: -12.0775, lng: -77.0860 },
  { id: "em-comisaria", category: "emergency", name: "Comisaría de San Miguel", detail: "Policía Nacional", lat: -12.0790, lng: -77.0830 },
  { id: "em-bomberos", category: "emergency", name: "Compañía de Bomberos San Miguel", detail: "Bomberos · 116", lat: -12.0850, lng: -77.0905 }
];

const FILTER_LABELS = {
  health: "Centros de Salud",
  shelter: "Refugios Temporales",
  emergency: "Comisarías y Bomberos"
};

const COLORS = { health: "#a83d36", shelter: "#2e7d32", emergency: "#6e4e1c" };

let map = null;
let markersLayer = [];
let routeLayer = null;
let originMarker = null;
let routeToken = 0;
let activeFilter = "health";
let selectedId = null;

function getOrigin() {
  const o = state.mapConfig.simulatedLocation;
  return { lat: o.lat, lng: o.lng };
}

function walkingMetrics(lat1, lng1, lat2, lng2) {
  const rad = function (d) { return (d * Math.PI) / 180; };
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  const straight = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const meters = Math.max(15, Math.round(straight * 1.22));
  const minutes = Math.max(1, Math.round(meters / 80));
  const distance = meters >= 1000 ? (meters / 1000).toFixed(2).replace(".", ",") + " km" : meters + " m";
  const time = minutes >= 60
    ? Math.floor(minutes / 60) + " h " + (minutes % 60) + " min a pie"
    : minutes + " min a pie";
  return { meters: meters, distance: distance, time: time };
}

function placesForFilter() {
  const origin = getOrigin();
  return PLACES
    .filter(function (p) { return p.category === activeFilter; })
    .map(function (p) {
      return Object.assign({}, p, { metrics: walkingMetrics(origin.lat, origin.lng, p.lat, p.lng) });
    })
    .sort(function (a, b) { return a.metrics.meters - b.metrics.meters; });
}

function renderList(items) {
  const list = document.getElementById("shelter-list");
  if (!list) return;
  list.replaceChildren();
  items.forEach(function (place, index) {
    const row = document.createElement("div");
    row.className = "list-row";
    const text = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = place.name;
    const detail = document.createElement("small");
    detail.textContent = place.detail + " · " + place.metrics.distance + " · " + place.metrics.time;
    text.append(name, detail);
    const actions = document.createElement("span");
    actions.className = "place-actions";
    if (index === 0) {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = "Más cercano";
      actions.appendChild(tag);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button small " + (place.id === selectedId ? "green" : "secondary");
    button.dataset.placeId = place.id;
    button.setAttribute("aria-pressed", String(place.id === selectedId));
    button.textContent = place.id === selectedId ? "Ruta activa" : "Ver ruta";
    actions.appendChild(button);
    row.append(text, actions);
    list.appendChild(row);
  });
}

function updateSummary(place) {
  const dest = document.querySelector("[data-shelter-dest]");
  const metrics = document.querySelector("[data-shelter-metrics]");
  const link = document.querySelector("[data-shelter-gmaps]");
  const origin = getOrigin();
  if (dest) dest.textContent = place.name;
  if (metrics) metrics.textContent = place.metrics.distance + " · " + place.metrics.time;
  if (link) {
    link.href = "https://www.google.com/maps/dir/?api=1&origin=" + origin.lat + "," + origin.lng +
      "&destination=" + place.lat + "," + place.lng + "&travelmode=walking";
  }
}

function drawMap(items, selected) {
  const container = document.getElementById("shelter-map");
  if (!container) return;

  if (typeof window.L === "undefined") {
    if (!container.dataset.fallback) {
      container.dataset.fallback = "true";
      container.innerHTML = '<img src="../assets/images/mapa_zona_segura.jpg" alt="Mapa de zonas seguras sin conexión" class="map-image">';
    }
    return;
  }

  const L = window.L;
  const origin = getOrigin();

  if (!map) {
    map = L.map(container, { zoomControl: true }).setView([origin.lat, origin.lng], 15);
    L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      attribution: "Mapa &copy; Google"
    }).addTo(map);
    originMarker = L.circleMarker([origin.lat, origin.lng], {
      radius: 10, color: "#ffffff", weight: 3, fillColor: "#0047ab", fillOpacity: 1
    }).addTo(map).bindPopup("<strong>Tu ubicación</strong><br>" + state.mapConfig.simulatedLocation.label);
    window.setTimeout(function () { map.invalidateSize(); }, 180);
  }

  markersLayer.forEach(function (m) { map.removeLayer(m); });
  markersLayer = items.map(function (p) {
    return L.circleMarker([p.lat, p.lng], {
      radius: p.id === selected.id ? 11 : 8,
      color: "#ffffff", weight: 2, fillColor: COLORS[p.category], fillOpacity: 0.95
    }).addTo(map).bindPopup("<strong>" + p.name + "</strong><br>" + p.detail);
  });

  if (routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
  const token = ++routeToken;
  const straight = [[origin.lat, origin.lng], [selected.lat, selected.lng]];
  map.fitBounds(L.latLngBounds(straight), { padding: [42, 42], maxZoom: 17 });

  function drawStraight() {
    if (token !== routeToken) return;
    if (routeLayer) map.removeLayer(routeLayer);
    routeLayer = L.polyline(straight, { color: "#1a73e8", weight: 5, opacity: 0.8, dashArray: "8 8" }).addTo(map);
  }

  if (!navigator.onLine) { drawStraight(); return; }

  fetch("https://router.project-osrm.org/route/v1/foot/" + origin.lng + "," + origin.lat + ";" +
    selected.lng + "," + selected.lat + "?overview=full&geometries=geojson")
    .then(function (r) { if (!r.ok) throw new Error("osrm"); return r.json(); })
    .then(function (data) {
      if (token !== routeToken) return;
      const route = data && data.routes && data.routes[0];
      if (!route) throw new Error("no route");
      const latLngs = route.geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
      if (routeLayer) map.removeLayer(routeLayer);
      routeLayer = L.polyline(latLngs, { color: "#1a73e8", weight: 6, opacity: 0.9 }).addTo(map);
      map.fitBounds(routeLayer.getBounds(), { padding: [42, 42], maxZoom: 17 });
    })
    .catch(drawStraight);
}

function refresh(keepSelection) {
  const items = placesForFilter();
  if (!items.length) return;
  if (!keepSelection || !items.some(function (p) { return p.id === selectedId; })) {
    selectedId = items[0].id; // al cambiar de filtro se selecciona el más cercano
  }
  const selected = items.find(function (p) { return p.id === selectedId; });
  renderList(items);
  updateSummary(selected);
  drawMap(items, selected);
  const status = document.querySelector("[data-shelter-status]");
  if (status) status.textContent = items.length + " lugares en \"" + FILTER_LABELS[activeFilter] + "\", del más cercano al más lejano.";
}

function updateConnectionBadge() {
  const badge = document.querySelector("[data-shelter-connection]");
  if (!badge) return;
  badge.textContent = navigator.onLine ? "Datos precargados · En línea" : "Datos precargados · Sin conexión";
  badge.classList.toggle("gold", !navigator.onLine);
}

export function initializeShelters() {
  if (!document.getElementById("shelter-list")) return;

  document.querySelectorAll("[data-shelter-filter]").forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.dataset.shelterFilter;
      document.querySelectorAll("[data-shelter-filter]").forEach(function (b) {
        const on = b === button;
        b.setAttribute("aria-pressed", String(on));
        b.classList.toggle("green", on);
        b.classList.toggle("secondary", !on);
      });
      refresh(false);
      showToast("Mostrando: " + FILTER_LABELS[activeFilter] + ".");
    });
  });

  document.getElementById("shelter-list").addEventListener("click", function (event) {
    const button = event.target.closest("[data-place-id]");
    if (!button) return;
    selectedId = button.dataset.placeId;
    refresh(true);
    showToast("Ruta a pie actualizada.");
  });

  window.addEventListener("online", updateConnectionBadge);
  window.addEventListener("offline", updateConnectionBadge);
  updateConnectionBadge();
  refresh(false);
}
