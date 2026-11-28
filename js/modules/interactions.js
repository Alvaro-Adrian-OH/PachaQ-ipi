import { state, saveState, normalizeZone, parseCoordinatesFromText } from "./state.js";
import { showToast } from "./feedback.js";
import { navigateTo } from "./layout.js";

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
  state.zones.forEach(function (rawZone, index) {
    const zone = normalizeZone(rawZone);
    const hasCoords = zone.lat !== null && zone.lng !== null;
    const row = document.createElement("div");
    row.className = "list-row";
    const text = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = zone.name;
    const detail = document.createElement("small");
    if (hasCoords) {
      detail.textContent = "Coordenadas: " + zone.lat.toFixed(5) + ", " + zone.lng.toFixed(5);
    } else {
      detail.textContent = index === 0 ? "Zona interna · Piso 1" : "Punto de encuentro · Exterior";
    }
    text.append(name, detail);

    const actions = document.createElement("div");
    actions.className = "zone-row-actions";

    if (hasCoords) {
      const routeBtn = document.createElement("button");
      const isSelected = state.mapConfig.selectedTarget === "custom:" + index;
      routeBtn.type = "button";
      routeBtn.className = "button small " + (isSelected ? "green" : "secondary");
      routeBtn.dataset.selectCustomZone = String(index);
      routeBtn.textContent = isSelected ? "En ruta" : "Ver ruta";
      actions.appendChild(routeBtn);
    } else {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = index === 0 ? "Verificado" : "Encuentro";
      actions.appendChild(tag);
    }

    if (index > 1) {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-member";
      removeBtn.dataset.removeZone = String(index);
      removeBtn.setAttribute("aria-label", "Quitar zona " + zone.name);
      removeBtn.textContent = "Quitar";
      actions.appendChild(removeBtn);
    }

    row.append(text, actions);
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
      navigateTo("plan.html");
    }
  }, 220);
}

let gpsWatchId = null;
let liveGpsCoords = null;
let lastMapQuery = "";
let zoneMapInstance = null;
let originMarker = null;
let homeMarker = null;
let safeZoneMarker = null;
let customZoneMarkers = [];
let routeLayer = null;
let routeFetchToken = 0;

function resolveSelectedTarget(cfg) {
  const sel = String(cfg.selectedTarget || "safeZone");
  if (sel.startsWith("custom:")) {
    const idx = Number(sel.slice(7));
    const zone = state.zones[idx] ? normalizeZone(state.zones[idx]) : null;
    if (zone && zone.lat !== null && zone.lng !== null) {
      return { id: sel, label: zone.name, lat: zone.lat, lng: zone.lng };
    }
  }
  return sel === "home" ? cfg.homeLocation : cfg.safeZoneLocation;
}

function syncCustomZoneMarkers() {
  if (!zoneMapInstance || typeof window.L === "undefined") return;
  const L = window.L;
  customZoneMarkers.forEach(function (marker) {
    zoneMapInstance.removeLayer(marker);
  });
  customZoneMarkers = [];

  state.zones.forEach(function (rawZone) {
    const zone = normalizeZone(rawZone);
    if (zone.lat === null || zone.lng === null) return;
    const marker = L.circleMarker([zone.lat, zone.lng], {
      radius: 8,
      color: "#ffffff",
      weight: 2,
      fillColor: "#2e7d32",
      fillOpacity: 0.95
    }).addTo(zoneMapInstance).bindPopup("<strong>Zona segura registrada</strong><br>" + zone.name);
    customZoneMarkers.push(marker);
  });
}

function calculateWalkingMetrics(lat1, lng1, lat2, lng2) {
  const toRad = function (deg) { return (deg * Math.PI) / 180; };
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const straightMeters = earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const streetMeters = Math.max(15, Math.round(straightMeters * 1.22));
  const minutes = Math.max(1, Math.round(streetMeters / 80));
  const formattedDistance = streetMeters >= 1000
    ? (streetMeters / 1000).toFixed(2).replace(".", ",") + " km"
    : streetMeters + " m";
  return {
    meters: streetMeters,
    minutes: minutes,
    formattedDistance: formattedDistance,
    formattedTime: minutes + " min a pie"
  };
}

function ensureLeafletMap(cfg, origin) {
  const container = document.getElementById("zone-map");
  if (!container) return null;

  if (typeof window.L === "undefined") {
    if (!container.dataset.fallbackRendered) {
      container.dataset.fallbackRendered = "true";
      container.innerHTML =
        '<img src="../assets/images/mapa_zona_segura.jpg" alt="Mapa de zonas seguras sin conexión" class="map-image">';
    }
    return null;
  }

  if (!zoneMapInstance) {
    const L = window.L;
    zoneMapInstance = L.map(container, { zoomControl: true }).setView([origin.lat, origin.lng], 16);

    L.tileLayer("https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      attribution: "Mapa &copy; Google"
    }).addTo(zoneMapInstance);

    homeMarker = L.circleMarker([cfg.homeLocation.lat, cfg.homeLocation.lng], {
      radius: 9,
      color: "#ffffff",
      weight: 2,
      fillColor: "#5a3e2b",
      fillOpacity: 1
    }).addTo(zoneMapInstance).bindPopup("<strong>Mi casa</strong><br>" + cfg.homeLocation.label);

    safeZoneMarker = L.circleMarker([cfg.safeZoneLocation.lat, cfg.safeZoneLocation.lng], {
      radius: 9,
      color: "#ffffff",
      weight: 2,
      fillColor: "#2e7d32",
      fillOpacity: 1
    }).addTo(zoneMapInstance).bindPopup("<strong>Zona segura</strong><br>" + cfg.safeZoneLocation.label);

    originMarker = L.circleMarker([origin.lat, origin.lng], {
      radius: 10,
      color: "#ffffff",
      weight: 3,
      fillColor: "#0047ab",
      fillOpacity: 1
    }).addTo(zoneMapInstance).bindPopup("<strong>Tu ubicación</strong>");

    window.setTimeout(function () {
      if (zoneMapInstance) zoneMapInstance.invalidateSize();
    }, 180);

    syncCustomZoneMarkers();
  }

  return zoneMapInstance;
}

function drawWalkingRoute(origin, target, usingReal) {
  const map = ensureLeafletMap(state.mapConfig, origin);
  if (!map || typeof window.L === "undefined") return;

  const L = window.L;
  originMarker.setLatLng([origin.lat, origin.lng]);
  originMarker.setPopupContent(
    usingReal
      ? "<strong>Tu ubicación real (GPS)</strong>"
      : "<strong>Ubicación simulada</strong><br>" + state.mapConfig.simulatedLocation.label
  );

  const bounds = L.latLngBounds([
    [origin.lat, origin.lng],
    [target.lat, target.lng]
  ]);
  map.fitBounds(bounds, { padding: [42, 42], maxZoom: 17 });

  const token = ++routeFetchToken;
  const osrmUrl =
    "https://router.project-osrm.org/route/v1/foot/" +
    origin.lng + "," + origin.lat + ";" +
    target.lng + "," + target.lat +
    "?overview=full&geometries=geojson";

  fetch(osrmUrl)
    .then(function (response) {
      if (!response.ok) throw new Error("OSRM error");
      return response.json();
    })
    .then(function (data) {
      if (token !== routeFetchToken) return;
      const route = data && data.routes && data.routes[0];
      if (!route || !route.geometry || !Array.isArray(route.geometry.coordinates)) {
        throw new Error("No route");
      }

      const latLngs = route.geometry.coordinates.map(function (coord) {
        return [coord[1], coord[0]];
      });

      if (routeLayer) map.removeLayer(routeLayer);
      routeLayer = L.polyline(latLngs, {
        color: "#1a73e8",
        weight: 6,
        opacity: 0.9
      }).addTo(map);
      map.fitBounds(routeLayer.getBounds(), { padding: [42, 42], maxZoom: 17 });

      const meters = Math.max(15, Math.round(route.distance));
      const minutes = Math.max(1, Math.round(meters / 80));
      const formattedDistance = meters >= 1000
        ? (meters / 1000).toFixed(2).replace(".", ",") + " km"
        : meters + " m";
      const metricsLabel = document.querySelector("[data-route-metrics]");
      if (metricsLabel) {
        metricsLabel.textContent = formattedDistance + " · " + minutes + " min a pie (ruta más rápida)";
      }
    })
    .catch(function () {
      if (token !== routeFetchToken) return;
      if (routeLayer) map.removeLayer(routeLayer);
      routeLayer = L.polyline(
        [[origin.lat, origin.lng], [target.lat, target.lng]],
        { color: "#1a73e8", weight: 5, opacity: 0.8, dashArray: "8 8" }
      ).addTo(map);
    });
}

function updateZoneMapView() {
  const mapContainer = document.getElementById("zone-map");
  if (!mapContainer) return;

  const cfg = state.mapConfig;
  const usingReal = Boolean(cfg.useRealLocation && liveGpsCoords);
  const origin = usingReal
    ? { lat: liveGpsCoords.lat, lng: liveGpsCoords.lng, isReal: true }
    : { lat: cfg.simulatedLocation.lat, lng: cfg.simulatedLocation.lng, isReal: false };
  const target = resolveSelectedTarget(cfg);

  const oLat = origin.lat.toFixed(5);
  const oLng = origin.lng.toFixed(5);
  const dLat = target.lat.toFixed(5);
  const dLng = target.lng.toFixed(5);

  const queryKey = oLat + "," + oLng + "->" + dLat + "," + dLng;
  if (queryKey !== lastMapQuery) {
    lastMapQuery = queryKey;
    drawWalkingRoute(origin, target, usingReal);
  }

  const externalLink = document.querySelector("[data-open-gmaps]");
  if (externalLink) {
    externalLink.href =
      "https://www.google.com/maps/dir/?api=1&origin=" + oLat + "," + oLng +
      "&destination=" + dLat + "," + dLng + "&travelmode=walking";
  }

  const badge = document.querySelector("[data-location-badge]");
  if (badge) {
    badge.textContent = cfg.useRealLocation
      ? (usingReal ? "GPS en tiempo real" : "Buscando GPS…")
      : "Ubicación simulada";
    badge.classList.toggle("gold", cfg.useRealLocation && !usingReal);
  }

  const coordsLabel = document.querySelector("[data-location-coords]");
  if (coordsLabel) {
    if (usingReal) {
      coordsLabel.textContent = "GPS activo (" + oLat + ", " + oLng + ") · Precisión ±" + (liveGpsCoords.accuracy || 15) + " m";
    } else if (cfg.useRealLocation) {
      coordsLabel.textContent = "Obteniendo coordenadas reales… usando respaldo en San Miguel";
    } else {
      coordsLabel.textContent = "Modo simulación activo: " + oLat + ", " + oLng + " (San Miguel)";
    }
  }

  const destLabel = document.querySelector("[data-route-dest]");
  if (destLabel) destLabel.textContent = target.label;

  const metrics = calculateWalkingMetrics(origin.lat, origin.lng, target.lat, target.lng);
  const metricsLabel = document.querySelector("[data-route-metrics]");
  if (metricsLabel) {
    metricsLabel.textContent = metrics.formattedDistance + " · " + metrics.formattedTime + " (ruta más rápida)";
  }

  const originPill = document.querySelector("[data-route-origin-pill]");
  if (originPill) {
    originPill.textContent = usingReal ? "Tu ubicación real (GPS)" : "Ubicación simulada (San Miguel)";
  }

  const destPill = document.querySelector("[data-route-dest-pill]");
  if (destPill) {
    destPill.textContent = target.label;
  }

  const toggle = document.querySelector("[data-real-location-toggle]");
  if (toggle) toggle.checked = Boolean(cfg.useRealLocation);

  document.querySelectorAll("[data-route-target]").forEach(function (btn) {
    const active = btn.dataset.routeTarget === cfg.selectedTarget;
    btn.setAttribute("aria-pressed", String(active));
    btn.classList.toggle("green", active);
    btn.classList.toggle("secondary", !active);
  });
}

function stopRealLocationWatch() {
  if (gpsWatchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(gpsWatchId);
    gpsWatchId = null;
  }
  liveGpsCoords = null;
}

function startRealLocationWatch() {
  if (!("geolocation" in navigator)) {
    state.mapConfig.useRealLocation = false;
    saveState();
    updateZoneMapView();
    showToast("Tu navegador no admite geolocalización. Se mantiene la ubicación simulada.");
    return;
  }

  stopRealLocationWatch();
  updateZoneMapView();

  gpsWatchId = navigator.geolocation.watchPosition(
    function (position) {
      liveGpsCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: Math.round(position.coords.accuracy || 0)
      };
      updateZoneMapView();
    },
    function (error) {
      stopRealLocationWatch();
      state.mapConfig.useRealLocation = false;
      saveState();
      updateZoneMapView();
      const msg = error.code === 1
        ? "Permiso de ubicación denegado. Volviendo a ubicación simulada en San Miguel."
        : "No se pudo obtener tu ubicación real. Se usa la ubicación simulada.";
      showToast(msg);
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
  );
}

function initializeZoneMap() {
  const mapContainer = document.getElementById("zone-map");
  if (!mapContainer) return;
  if (state.mapConfig.useRealLocation) {
    startRealLocationWatch();
  } else {
    updateZoneMapView();
  }
}

export function initializeInteractions() {
  applyPreferences();
  applySavedOptions();
  renderFamilyList();
  renderSafeZones();
  updatePageData();
  updateKitProgress();
  runLoadingPage();
  initializeZoneMap();

  document.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.select) {
      updateAssessmentSelection(button);
      return;
    }

    if (button.dataset.routeTarget) {
      state.mapConfig.selectedTarget = button.dataset.routeTarget;
      saveState();
      renderSafeZones();
      updateZoneMapView();
      showToast(
        button.dataset.routeTarget === "home"
          ? "Ruta peatonal actualizada hacia tu casa en San Miguel."
          : "Ruta peatonal actualizada hacia el Parque Media Luna."
      );
      return;
    }

    if (button.dataset.selectCustomZone !== undefined) {
      state.mapConfig.selectedTarget = "custom:" + button.dataset.selectCustomZone;
      saveState();
      renderSafeZones();
      updateZoneMapView();
      showToast("Ruta peatonal actualizada hacia la zona segura seleccionada.");
      return;
    }

    if (button.dataset.removeZone !== undefined) {
      const idx = Number(button.dataset.removeZone);
      state.zones.splice(idx, 1);
      if (String(state.mapConfig.selectedTarget || "").startsWith("custom:")) {
        state.mapConfig.selectedTarget = "safeZone";
      }
      saveState();
      renderSafeZones();
      syncCustomZoneMarkers();
      updateZoneMapView();
      showToast("Zona segura eliminada.");
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
      navigateTo("assessment-material.html");
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
    if (action === "refresh-gps") {
      if (state.mapConfig.useRealLocation) {
        startRealLocationWatch();
        showToast("Actualizando ubicación GPS en tiempo real…");
      } else {
        updateZoneMapView();
        showToast("Ubicación simulada en San Miguel actualizada.");
      }
    }
    if (action === "paste-zone-link") {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        showToast("Tu navegador no permite leer el portapapeles. Pega el enlace manualmente.");
        return;
      }
      navigator.clipboard.readText()
        .then(function (clipText) {
          const linkInput = document.getElementById("zone-maps-link");
          const latInput = document.getElementById("zone-lat");
          const lngInput = document.getElementById("zone-lng");
          const status = document.querySelector("[data-paste-status]");
          if (linkInput) linkInput.value = clipText.trim();
          const parsed = parseCoordinatesFromText(clipText);
          if (parsed.coords) {
            if (latInput) latInput.value = parsed.coords.lat.toFixed(6);
            if (lngInput) lngInput.value = parsed.coords.lng.toFixed(6);
            if (status) {
              status.textContent = "Coordenadas detectadas: " + parsed.coords.lat.toFixed(5) + ", " + parsed.coords.lng.toFixed(5);
            }
            showToast("Coordenadas extraídas del portapapeles.");
          } else if (parsed.isShortLink) {
            if (status) {
              status.textContent = "Enlace corto de Google Maps detectado. Ábrelo o copia las coordenadas numéricas.";
            }
            showToast("Enlace corto detectado: copia las coordenadas desde Google Maps.");
          } else {
            if (status) {
              status.textContent = "No se detectaron coordenadas en el portapapeles.";
            }
            showToast("No se encontraron coordenadas en el portapapeles.");
          }
        })
        .catch(function () {
          showToast("No se pudo acceder al portapapeles. Pega el enlace o pin manualmente.");
        });
    }
    if (action === "sos-call") showToast("Baliza SOS activa. Comparte tu ubicación con tu familia.");
    if (action === "deactivate-sos") navigateTo("home.html");
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
    if (target.matches("[data-real-location-toggle]")) {
      state.mapConfig.useRealLocation = target.checked;
      saveState();
      if (target.checked) {
        startRealLocationWatch();
        showToast("Ubicación real (GPS) activada.");
      } else {
        stopRealLocationWatch();
        updateZoneMapView();
        showToast("Ubicación simulada en San Miguel activada.");
      }
    }
  });

  document.addEventListener("input", function (event) {
    if (!event.target.matches("#zone-maps-link")) return;
    const parsed = parseCoordinatesFromText(event.target.value);
    const latInput = document.getElementById("zone-lat");
    const lngInput = document.getElementById("zone-lng");
    const status = document.querySelector("[data-paste-status]");
    if (parsed.coords) {
      if (latInput) latInput.value = parsed.coords.lat.toFixed(6);
      if (lngInput) lngInput.value = parsed.coords.lng.toFixed(6);
      if (status) {
        status.textContent = "Coordenadas detectadas: " + parsed.coords.lat.toFixed(5) + ", " + parsed.coords.lng.toFixed(5);
      }
    } else if (parsed.isShortLink && status) {
      status.textContent = "Enlace corto detectado. Copia las coordenadas numéricas desde Google Maps.";
    }
  });

  document.addEventListener("zones:updated", function () {
    renderSafeZones();
    syncCustomZoneMarkers();
    updateZoneMapView();
  });
}
