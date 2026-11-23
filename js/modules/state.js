const storageKey = "pachaqipi-app-state";

const defaults = {
  family: [
    { initials: "JQ", name: "Joaquer Querales", role: "Jefe de familia", note: "Adulto · Sin condición especial" },
    { initials: "MQ", name: "María Quispe", role: "Adulto mayor", note: "Movilidad reducida" }
  ],
  supplies: [true, true, true, false, false, true],
  zones: ["Columna principal de la sala", "Parque Zonal (Zona despejada)"],
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
