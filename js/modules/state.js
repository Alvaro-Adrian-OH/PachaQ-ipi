const storageKey = "pachaqipi-app-state";

const defaults = {
  family: [
    { initials: "JQ", name: "Joaquer Querales", role: "Jefe de familia", note: "Adulto · Sin condición especial" },
    { initials: "MQ", name: "María Quispe", role: "Adulto mayor", note: "Movilidad reducida" }
  ],
  supplies: [true, true, true, false, false, true],
  zones: ["Columna principal de la sala", "Parque Media Luna · San Miguel (Zona segura)"],
  mapConfig: {
    useRealLocation: false,
    selectedTarget: "safeZone",
    simulatedLocation: {
      label: "Ubicación simulada · Av. La Marina cdra. 22, San Miguel",
      lat: -12.0789,
      lng: -77.0901
    },
    homeLocation: {
      id: "home",
      label: "Mi casa · Calle Libertad 415, San Miguel",
      lat: -12.0776,
      lng: -77.0924
    },
    safeZoneLocation: {
      id: "safeZone",
      label: "Zona segura · Parque Media Luna, San Miguel",
      lat: -12.0802,
      lng: -77.0875
    }
  },
  assessment: {
    material: "Material noble (concreto o ladrillo)",
    floors: "2 pisos",
    construction: "Terminada totalmente",
    location: "Ladera de cerro o suelo inestable"
  },
  preferences: {
    dark: false,
    largeText: false,
    simpleMode: false
  },
  answer: "",
  score: 0,
  recording: false,
  recorded: false
};

function readSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved) return {};
    return saved;
  } catch {
    return {};
  }
}

const savedState = readSavedState();

export const state = {
  ...defaults,
  ...savedState,
  assessment: { ...defaults.assessment, ...(savedState.assessment || {}) },
  preferences: { ...defaults.preferences, ...(savedState.preferences || {}) },
  mapConfig: { ...defaults.mapConfig, ...(savedState.mapConfig || {}) },
  family: Array.isArray(savedState.family) ? savedState.family : defaults.family,
  supplies: Array.isArray(savedState.supplies) ? savedState.supplies : defaults.supplies,
  zones: Array.isArray(savedState.zones) ? savedState.zones : defaults.zones
};

export function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    // La página sigue funcionando durante esta visita si el navegador bloquea el almacenamiento.
  }
}

export function normalizeZone(zone) {
  if (typeof zone === "string") {
    return { name: zone, lat: null, lng: null };
  }
  const lat = zone && zone.lat !== null && zone.lat !== "" && Number.isFinite(Number(zone.lat)) ? Number(zone.lat) : null;
  const lng = zone && zone.lng !== null && zone.lng !== "" && Number.isFinite(Number(zone.lng)) ? Number(zone.lng) : null;
  return {
    name: String((zone && zone.name) || ""),
    lat: lat,
    lng: lng
  };
}

export function parseCoordinatesFromText(rawText) {
  const text = String(rawText || "").trim();
  if (!text) return { coords: null, isShortLink: false };

  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|ll|destination|daddr)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i,
    /(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/
  ];

  for (let i = 0; i < patterns.length; i += 1) {
    const match = text.match(patterns[i]);
    if (match) {
      const lat = Number(match[1]);
      const lng = Number(match[2]);
      if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { coords: { lat: lat, lng: lng }, isShortLink: false };
      }
    }
  }

  return {
    coords: null,
    isShortLink: /maps\.app\.goo\.gl|goo\.gl\/maps/i.test(text)
  };
}
