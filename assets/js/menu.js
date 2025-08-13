// menu.js
document.addEventListener("DOMContentLoaded", () => {
  /** Referencias clave */
  const header = document.querySelector("header");
  const toggleButton = document.getElementById("menu-toggle");
  const menu = document.getElementById("menu");
  const menuLinks = menu ? menu.querySelectorAll("a[href^='#']") : [];

  /** 1) Toggle de menú en móvil (sin estilos inline) */
  if (toggleButton && menu) {
    toggleButton.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      toggleButton.setAttribute("aria-expanded", open ? "true" : "false");
      toggleButton.setAttribute(
        "aria-label",
        open ? "Cerrar menú de navegación" : "Abrir menú de navegación"
      );
    });

    /** Cerrar menú al hacer click en un enlace (solo en móvil) */
    menuLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth < 768 && menu.classList.contains("is-open")) {
          menu.classList.remove("is-open");
          toggleButton.setAttribute("aria-expanded", "false");
          toggleButton.setAttribute("aria-label", "Abrir menú de navegación");
        }
      });
    });

    /** Cerrar con tecla ESC (accesibilidad) */
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        menu.classList.remove("is-open");
        toggleButton.setAttribute("aria-expanded", "false");
        toggleButton.focus();
      }
    });
  }

  /** 2) Sombra en header al hacer scroll (estética sutil) */
  const onScrollHeaderShadow = () => {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  };
  onScrollHeaderShadow();
  window.addEventListener("scroll", onScrollHeaderShadow);

  /** 3) "Link activo" según sección visible */
  const sections = [];
  menuLinks.forEach((link) => {
    const id = link.getAttribute("href");
    if (!id) return;
    const section = document.querySelector(id);
    if (section) sections.push({ link, section });
  });

  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const match = sections.find(s => s.section === entry.target);
          if (!match) return;

          if (entry.isIntersecting) {
            // Quitar activo de todos
            menuLinks.forEach(a => a.classList.remove("active"));
            // Activar el link correspondiente
            match.link.classList.add("active");
          }
        });
      },
      {
        // activa cuando ~50% de la sección está visible
        threshold: 0.5,
        rootMargin: "-10% 0px -40% 0px"
      }
    );

    sections.forEach(({ section }) => observer.observe(section));
  }
});