/*
  HU-041 · Guías interactivas de primeros auxilios.
  CA-01: categorías RCP, Hemorragias, Fracturas, Quemaduras y Asfixia.
  CA-02: máximo 4 diapositivas por categoría; todo el contenido va dentro de la página (sin descargas).
  CA-03: se abre desde el botón de acceso rápido de la pantalla de emergencia (first-aid.html#hemorragias abre una guía directo).
*/
const GUIDES = {
  rcp: {
    title: "RCP",
    icon: "❤️",
    slides: [
      { icon: "👀", title: "Verifica y pide ayuda", text: "Comprueba que el lugar sea seguro. Si la persona no responde ni respira con normalidad, llama al 116 (Bomberos) o al 106 (SAMU), o pide que otra persona lo haga." },
      { icon: "🙌", title: "Posiciona las manos", text: "Coloca a la persona boca arriba sobre una superficie firme. Apoya el talón de una mano en el centro del pecho y la otra mano encima." },
      { icon: "💓", title: "Comprime fuerte y rápido", text: "Con los brazos rectos, hunde el pecho unos 5 a 6 cm y deja que vuelva a subir. Ritmo de 100 a 120 compresiones por minuto." },
      { icon: "⏱️", title: "No te detengas", text: "Continúa sin parar hasta que llegue ayuda, la persona respire o te releve alguien más. Si sabes hacerlo, da 2 respiraciones tras cada 30 compresiones." }
    ]
  },
  hemorragias: {
    title: "Hemorragias",
    icon: "🩸",
    slides: [
      { icon: "🧤", title: "Protégete primero", text: "Aléjate de vidrios o escombros. Si tienes guantes o una bolsa limpia, úsalos para no tocar la sangre directamente." },
      { icon: "✋", title: "Presión directa", text: "Presiona la herida con una gasa o tela limpia, firme y sin soltar. No uses algodón suelto." },
      { icon: "🩹", title: "Vendaje compresivo", text: "Si la tela se empapa, agrega otra encima sin quitar la primera. Sujeta todo con una venda ajustada, sin cortar la circulación." },
      { icon: "🦵", title: "Eleva y pide ayuda", text: "Si es en un brazo o pierna, elévalo por encima del corazón. No retires objetos clavados. Llama al 116 o 106 si el sangrado no para." }
    ]
  },
  fracturas: {
    title: "Fracturas",
    icon: "🦴",
    slides: [
      { icon: "🛑", title: "No muevas la zona", text: "No intentes enderezar el hueso ni hacer que la persona camine. Si hay sospecha de golpe en cuello o espalda, no la muevas." },
      { icon: "📏", title: "Inmoviliza", text: "Usa una tablilla rígida (cartón, madera, revista enrollada) que cubra la articulación de arriba y la de abajo de la lesión." },
      { icon: "🧊", title: "Aplica frío", text: "Coloca hielo o una bolsa fría envuelta en tela sobre la zona por 15 minutos. Nunca pongas el hielo directo sobre la piel." },
      { icon: "🚑", title: "Busca atención médica", text: "Traslada con cuidado o espera a los equipos de rescate. Si hay herida abierta, cúbrela con una gasa limpia." }
    ]
  },
  quemaduras: {
    title: "Quemaduras",
    icon: "🔥",
    slides: [
      { icon: "🚪", title: "Aleja del peligro", text: "Retira a la persona de la fuente de calor. Quita anillos, pulseras y ropa suelta de la zona, sin jalar la que esté pegada a la piel." },
      { icon: "🚿", title: "Enfría con agua", text: "Deja correr agua fresca (no helada) sobre la quemadura de 10 a 20 minutos. No uses hielo." },
      { icon: "🩹", title: "Cubre sin apretar", text: "Tapa con una gasa limpia y húmeda. No revientes ampollas ni apliques cremas, aceite o pasta de dientes." },
      { icon: "🏥", title: "Cuándo ir al hospital", text: "Ve a un centro de salud si la quemadura es grande, en rostro, manos o genitales, o si la persona afectada es un niño o un adulto mayor." }
    ]
  },
  asfixia: {
    title: "Asfixia",
    icon: "🫁",
    slides: [
      { icon: "❓", title: "Reconoce la señal", text: "Pregunta \"¿Te estás atorando?\". Si no puede hablar, toser ni respirar, actúa de inmediato y pide que llamen al 116 o 106." },
      { icon: "👊", title: "5 golpes en la espalda", text: "Inclínala hacia adelante y da 5 golpes firmes entre los omóplatos con el talón de tu mano." },
      { icon: "🤗", title: "5 compresiones abdominales", text: "Ponte detrás, rodea su cintura, cierra el puño sobre el ombligo y tira hacia dentro y arriba con fuerza, 5 veces." },
      { icon: "🔁", title: "Alterna hasta que salga", text: "Repite golpes y compresiones. Si la persona queda inconsciente, recuéstala e inicia RCP." }
    ]
  }
};

let currentKey = null;
let currentIndex = 0;

function el(id) { return document.getElementById(id); }

function renderCategories() {
  const grid = el("aid-categories");
  grid.replaceChildren();
  Object.keys(GUIDES).forEach(function (key) {
    const guide = GUIDES[key];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "aid-category";
    button.dataset.aidCategory = key;
    const icon = document.createElement("span");
    icon.className = "aid-category-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = guide.icon;
    const label = document.createElement("strong");
    label.textContent = key === "hemorragias" ? "Tratar hemorragias" : guide.title;
    const count = document.createElement("small");
    count.textContent = guide.slides.length + " pasos";
    button.append(icon, label, count);
    grid.appendChild(button);
  });
}

function renderSlide() {
  const guide = GUIDES[currentKey];
  const slide = guide.slides[currentIndex];
  const total = guide.slides.length;

  el("aid-guide-title").textContent = guide.title;
  el("aid-step-count").textContent = "Paso " + (currentIndex + 1) + " de " + total;
  const art = el("aid-illustration");
  art.textContent = slide.icon;
  art.setAttribute("aria-label", "Ilustración: " + slide.title);
  el("aid-slide-title").textContent = slide.title;
  el("aid-slide-text").textContent = slide.text;

  const dots = el("aid-dots");
  dots.replaceChildren();
  guide.slides.forEach(function (_, i) {
    const dot = document.createElement("span");
    dot.className = "aid-dot" + (i === currentIndex ? " active" : "");
    dots.appendChild(dot);
  });

  el("aid-prev").disabled = currentIndex === 0;
  const next = el("aid-next");
  const last = currentIndex === total - 1;
  next.textContent = last ? "Terminar" : "Siguiente";
  next.dataset.last = String(last);
}

function openGuide(key, pushHash) {
  if (!GUIDES[key]) return;
  currentKey = key;
  currentIndex = 0;
  el("aid-categories-card").hidden = true;
  el("aid-viewer").hidden = false;
  renderSlide();
  if (pushHash) history.replaceState(null, "", "#" + key);
  el("aid-guide-title").focus({ preventScroll: false });
}

function closeGuide() {
  currentKey = null;
  el("aid-viewer").hidden = true;
  el("aid-categories-card").hidden = false;
  history.replaceState(null, "", window.location.pathname);
}

export function initializeFirstAid() {
  if (!el("aid-categories")) return;
  renderCategories();

  el("aid-categories").addEventListener("click", function (event) {
    const button = event.target.closest("[data-aid-category]");
    if (button) openGuide(button.dataset.aidCategory, true);
  });

  el("aid-prev").addEventListener("click", function () {
    if (currentIndex > 0) { currentIndex -= 1; renderSlide(); }
  });

  el("aid-next").addEventListener("click", function () {
    const total = GUIDES[currentKey].slides.length;
    if (currentIndex < total - 1) { currentIndex += 1; renderSlide(); } else { closeGuide(); }
  });

  el("aid-back").addEventListener("click", closeGuide);

  document.addEventListener("keydown", function (event) {
    if (!currentKey) return;
    if (event.key === "ArrowRight") el("aid-next").click();
    if (event.key === "ArrowLeft" && !el("aid-prev").disabled) el("aid-prev").click();
  });

  const fromHash = window.location.hash.replace("#", "");
  if (GUIDES[fromHash]) openGuide(fromHash, false);
}
