const sections = [
  { page: "home", href: "home.html", label: "Inicio", icon: "../assets/icons/home.svg" },
  { page: "family", href: "family.html", label: "Familia", icon: "../assets/icons/family_fff.svg" },
  { page: "plan", href: "plan.html", label: "Plan familiar", icon: "../assets/icons/plan.svg" },
  { page: "zones", href: "zones.html", label: "Zonas seguras", icon: "../assets/icons/shield_check_fff.svg" },
  { page: "voice", href: "voice.html", label: "Nota de voz", mobileLabel: "Voz", icon: "../assets/icons/voice.svg" },
  { page: "kit", href: "kit.html", label: "Mochila", icon: "../assets/icons/backpack.svg" },
  { page: "simulate", href: "simulate.html", label: "Simulacros", icon: "../assets/icons/play_circle.svg" },
  { page: "resources", href: "resources.html", label: "Recursos", icon: "../assets/icons/resources.svg" },
  { page: "profile", href: "profile.html", label: "Configuración", icon: "../assets/icons/settings.svg" }
];

function makeLinks(currentPage, mobile) {
  const mobilePages = ["home", "family", "plan", "zones", "voice"];
  const items = mobile ? sections.filter(function (item) {
    return mobilePages.includes(item.page);
  }) : sections;
  return items.map(function (item) {
    const current = item.page === currentPage ? ' aria-current="page"' : "";
    const label = mobile && item.mobileLabel ? item.mobileLabel : item.label;
    return '<a class="nav-link" href="' + item.href + '"' + current + '>' +
      (mobile ? "" : '<span class="nav-icon" aria-hidden="true">' + 
        '<img src="' + item.icon + '" alt="">' + 
      '</span>') +
      "<span>" + label + "</span></a>";
  }).join("");
}

export function renderLayout() {
  const currentPage = document.body.dataset.page || "";
  const isAuth = currentPage === "login" || currentPage === "forgot";
  const header = document.getElementById("site-header");
  const sidebar = document.getElementById("side-navigation");
  const mobileNav = document.getElementById("mobile-navigation");
  const morePages = ["kit", "simulate", "resources", "profile"].includes(currentPage);

  if (isAuth) {
    document.getElementById("site-layout").classList.add("auth-layout");
  }

  header.innerHTML =
    '<a class="brand" href="' + (isAuth ? "login.html" : "home.html") + '" aria-label="PachaQ’ipi, inicio">' +
      '<span class="brand-mark" aria-hidden="true"><img src="../assets/images/logo_pachaqipi.png" alt="Logo PachaQ’ipi" class="brand-logo"></span><span>PachaQ’ipi</span></a>' +
    (isAuth
      ? '<p class="header-context">Preparación familiar · Andes</p>'
      : '<p class="header-context">Centro de preparación familiar</p>' +
        '<div class="header-actions">' +
          '<a class="button header-emergency" href="emergency-alert.html">Alerta sísmica</a>' +
          '<a class="user-link" href="profile.html" aria-label="Abrir configuración">JQ</a>' +
        '</div>');

  sidebar.innerHTML = '<p class="nav-caption">MENÚ PRINCIPAL</p>' + makeLinks(currentPage, false);
  mobileNav.innerHTML = makeLinks(currentPage, true) +
    '<a class="nav-link"' + (morePages ? ' aria-current="page"' : "") +
    ' href="profile.html"><span>Más</span></a>';

  const toast = document.getElementById("toast");
  if (toast) toast.setAttribute("aria-live", "polite");
}
