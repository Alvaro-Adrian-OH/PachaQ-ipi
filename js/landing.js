(() => {
  "use strict";

  const iconNames = new Set(["sparkle", "check", "file", "users", "bag", "pin", "chevron", "play"]);
  const iconHTML = (name, size = 18) => {
    if (!iconNames.has(name)) return "";
    return `<img class="landing-icon" src="assets/icons/landing-${name}.svg" width="${size}" height="${size}" alt="" aria-hidden="true">`;
  };

  const header = document.getElementById("site-header");
  if (header) {
    header.className = "site-header";
    header.innerHTML = `
      <div class="container nav">
        <a class="brand" href="#inicio" aria-label="PachaQ'ipi, inicio">
          <span class="logo"><img src="assets/images/logo_pachaqipi.png" alt=""></span>
          <span>PachaQ'ipi</span>
        </a>
        <nav id="main-nav" aria-label="Navegación principal">
          <a class="active" href="#inicio">Inicio</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#nosotros">Nosotros</a>
          <a class="mobile-login" href="pages/login.html">Iniciar sesión</a>
        </nav>
        <button class="menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="main-nav" id="menu-toggle">☰</button>
        <a class="btn btn-outline header-login" href="pages/login.html">Iniciar sesión</a>
      </div>`;
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="container">
        <span>© 2026 PachaQ'ipi · Preparación familiar ante sismos</span>
        <nav aria-label="Enlaces de la aplicación">
          <a href="pages/home.html">Abrir aplicación</a>
          <a href="pages/login.html">Iniciar sesión</a>
        </nav>
      </div>`;
  }

  document.querySelectorAll("[data-ic]").forEach((element) => {
    const size = Number(element.dataset.size) || 18;
    element.innerHTML = iconHTML(element.dataset.ic, size);
    element.setAttribute("aria-hidden", "true");
  });

  document.querySelectorAll("[data-phone]").forEach((element) => {
    element.innerHTML = `
      <div class="phone">
        <div class="phone-top"><small>Buenos días</small><b>Familia Querales</b><span class="jq">JQ</span></div>
        <div class="phone-body">
          <div class="pcard">
            <div class="row"><b>Preparación familiar</b><span class="pill">En progreso</span></div>
            <div class="row phone-progress">
              <div class="ring"><span>62%</span></div>
              <div><div>3 tareas pendientes para estar 100% listos</div><small>Mochila 60% · Zonas seguras 1 de 2</small></div>
            </div>
          </div>
          <div class="pcard"><div class="row"><b>Diagnóstico del hogar</b><span class="pill">Riesgo medio</span></div><p class="phone-note">Refuerza los anclajes y completa los insumos de la mochila.</p></div>
          <b class="phone-task-heading">Siguientes pasos</b>
          <div class="ptask"><span class="ico">${iconHTML("bag", 13)}</span><div><b>Completar la mochila</b><small>Revisa los artículos esenciales</small></div>${iconHTML("chevron", 12)}</div>
          <div class="ptask"><span class="ico">${iconHTML("pin", 13)}</span><div><b>Registrar zona segura</b><small>Acuerda un punto de encuentro</small></div>${iconHTML("chevron", 12)}</div>
          <div class="pbtns"><span class="g">✓ Estoy bien</span><span class="r">Pedir ayuda</span></div>
        </div>
        <div class="ptab"><span>Inicio</span><span>Familia</span><span>Plan</span></div>
      </div>`;
  });

  const menuToggle = document.getElementById("menu-toggle");
  const mainNav = document.getElementById("main-nav");
  const sectionLinks = mainNav ? Array.from(mainNav.querySelectorAll('a[href^="#"]')) : [];
  const trackedSections = sectionLinks
    .map((link) => document.getElementById(link.hash.slice(1)))
    .filter(Boolean);

  const setActiveSection = (section) => {
    sectionLinks.forEach((link) => {
      const isActive = link.hash === `#${section.id}`;
      link.classList.toggle("active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  const updateActiveSection = () => {
    if (!trackedSections.length) return;

    const activationLine = 110;
    let currentSection = trackedSections[0];
    trackedSections.forEach((section) => {
      if (section.getBoundingClientRect().top <= activationLine) currentSection = section;
    });

    const pageBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    if (pageBottom) currentSection = trackedSections[trackedSections.length - 1];
    setActiveSection(currentSection);
  };

  let scrollFrame = 0;
  const scheduleActiveSectionUpdate = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      scrollFrame = 0;
      updateActiveSection();
    });
  };

  window.addEventListener("scroll", scheduleActiveSectionUpdate, { passive: true });
  window.addEventListener("resize", scheduleActiveSectionUpdate);
  window.addEventListener("hashchange", scheduleActiveSectionUpdate);
  updateActiveSection();

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    });
    mainNav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menú");
      }
    });
  }

  const newsletter = document.getElementById("newsletter-form");
  if (newsletter) {
    newsletter.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = document.getElementById("nl-email");
      const message = document.getElementById("nl-msg");
      const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      if (validEmail) {
        message.textContent = "Gracias por tu interés. El boletín aún no está conectado en esta versión.";
        email.removeAttribute("aria-invalid");
        newsletter.reset();
      } else {
        message.textContent = "Ingresa un correo válido para continuar.";
        email.setAttribute("aria-invalid", "true");
        email.focus();
      }
    });
  }
})();
