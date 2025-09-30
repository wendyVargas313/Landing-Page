/**
 * Módulo FAQ (fyq.js)
 * Renderiza una página de Preguntas Frecuentes desde un endpoint JSON (DRF).
 * - Accesible: acordeón con ARIA, navegación por hash (#faq-123).
 * - UX: búsqueda con debounce, animaciones respetando prefers-reduced-motion.
 * - Seguro: refuerza target/rel en enlaces (el backend ya debe sanitizar HTML).
 *
 * Requisitos en el HTML:
 *  - #faq-root
 *  - #faq-search
 *  - #tpl-faq-category (template)
 *  - #tpl-faq-item (template)
 *
 * Autor: tú ✨
 */

/** =========================
 * Configuración del API
 * ========================= */
const API_BASE = "http://127.0.0.1:8000"; // backend local Django/DRF
const FAQ_PATH = "/api/faq/";             // ruta del endpoint
const ENDPOINT = `${API_BASE}${FAQ_PATH}`;

/** @typedef {{id:number, name:string, slug?:string, order?:number}} FAQCategory */
/** @typedef {{id:number, question:string, answer_html:string, order?:number, category?: FAQCategory}} FAQ */
/** @typedef {{[slug:string]: {name:string, items: FAQ[]}}} GroupedFAQ */

const $root   = /** @type {HTMLElement|null} */ (document.getElementById("faq-root"));
const $search = /** @type {HTMLInputElement|null} */ (document.getElementById("faq-search"));

const $catTpl  = /** @type {HTMLTemplateElement|null} */ (document.getElementById("tpl-faq-category"));
const $itemTpl = /** @type {HTMLTemplateElement|null} */ (document.getElementById("tpl-faq-item"));

/* -------------------------------------------------------------------------- */
/* Utilidades                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Slugify simple y estable para IDs/keys.
 * @param {string} s
 * @returns {string}
 */
function slug(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Orden por `order` y fallback por `id`.
 * @param {Pick<FAQ,'order'|'id'>} a
 * @param {Pick<FAQ,'order'|'id'>} b
 */
function byOrder(a, b) {
  const ao = a?.order ?? 1e9;
  const bo = b?.order ?? 1e9;
  return ao - bo || (/** @type {number} */(a.id) - /** @type {number} */(b.id));
}

/** Debounce minimal. */
function debounce(fn, ms = 200) {
  /** @type {number|undefined} */
  let t;
  return (...args) => {
    if (t) clearTimeout(t);
    // @ts-ignore
    t = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Refuerza seguridad en <a>.
 * @param {HTMLElement} container
 */
function ensureSafeLinks(container) {
  const as = container.querySelectorAll("a[href]");
  as.forEach((a) => {
    a.setAttribute("target", "_blank");
    const rel = (a.getAttribute("rel") || "")
      .split(/\s+/)
      .filter(Boolean);
    for (const k of ["noopener", "noreferrer"]) if (!rel.includes(k)) rel.push(k);
    a.setAttribute("rel", rel.join(" "));
  });
}

/**
 * Altura natural de un panel para animación.
 * @param {HTMLElement} $panel
 */
function panelHeight($panel) {
  $panel.style.height = "auto";
  const h = $panel.getBoundingClientRect().height;
  $panel.style.height = "";
  return h;
}

/* -------------------------------------------------------------------------- */
/* Estado del módulo                                                          */
/* -------------------------------------------------------------------------- */

/** @type {FAQ[]} */ let DATA = [];
/** @type {GroupedFAQ} */ let GROUPED = {};

/**
 * Agrupa FAQs por categoría.
 * @param {FAQ[]} items
 * @returns {GroupedFAQ}
 */
function groupByCategory(items) {
  /** @type {GroupedFAQ} */
  const grouped = {};
  for (const it of items) {
    const name = it.category?.name || "General";
    const s = it.category?.slug || slug(name);
    if (!grouped[s]) grouped[s] = { name, items: [] };
    grouped[s].items.push(it);
  }
  Object.values(grouped).forEach((g) => g.items.sort(byOrder));
  return grouped;
}

/* -------------------------------------------------------------------------- */
/* Render                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Abre un panel accesible.
 * @param {HTMLButtonElement} $btn
 * @param {HTMLElement} $panel
 * @param {boolean} [animate=true]
 */
function openPanel($btn, $panel, animate = true) {
  if (!$panel.hasAttribute("hidden")) return;
  $btn.setAttribute("aria-expanded", "true");
  $panel.removeAttribute("hidden");

  if (!animate || !matchMedia("(prefers-reduced-motion: no-preference)").matches) return;

  const h = panelHeight($panel);
  $panel.style.setProperty("--h", h + "px");
  $panel.classList.remove("hide");
  $panel.classList.add("reveal");
  $panel.addEventListener("animationend", () => {
    $panel.classList.remove("reveal");
    $panel.style.removeProperty("--h");
  }, { once: true });
}

/**
 * Cierra un panel accesible.
 * @param {HTMLButtonElement} $btn
 * @param {HTMLElement} $panel
 */
function closePanel($btn, $panel) {
  if ($panel.hasAttribute("hidden")) return;
  $btn.setAttribute("aria-expanded", "false");

  if (!matchMedia("(prefers-reduced-motion: no-preference)").matches) {
    $panel.setAttribute("hidden", "");
    return;
  }
  const h = panelHeight($panel);
  $panel.style.setProperty("--h", h + "px");
  $panel.classList.remove("reveal");
  $panel.classList.add("hide");
  $panel.addEventListener("animationend", () => {
    $panel.classList.remove("hide");
    $panel.setAttribute("hidden", "");
    $panel.style.removeProperty("--h");
  }, { once: true });
}

/**
 * Alterna un panel y sincroniza el hash.
 * @param {HTMLButtonElement} $btn
 * @param {HTMLElement} $panel
 */
function togglePanel($btn, $panel) {
  const expanded = $btn.getAttribute("aria-expanded") === "true";
  expanded ? closePanel($btn, $panel) : openPanel($btn, $panel, true);
  if (!expanded) history.replaceState(null, "", "#" + $panel.id);
  else history.replaceState(null, "", " ");
}

/**
 * Inyecta una categoría completa en DOM.
 * @param {string} catSlug
 * @param {{name:string, items:FAQ[]}} cat
 */
function mountCategory(catSlug, cat) {
  if (!$catTpl || !$itemTpl || !$root) return;

  const frag = $catTpl.content.cloneNode(true);
  const $section = /** @type {HTMLElement} */ (frag.querySelector("[data-category]"));
  const $title = /** @type {HTMLElement} */ (frag.querySelector(".faq-category__title"));
  const $list  = /** @type {HTMLElement} */ (frag.querySelector(".faq-category__list"));

  $section.dataset.category = catSlug;
  $title.textContent = cat.name;

  cat.items.forEach((faq, idx) => {
    const node = $itemTpl.content.cloneNode(true);
    const $btn     = /** @type {HTMLButtonElement} */ (node.querySelector("[data-faq-toggle]"));
    const $q       = /** @type {HTMLElement} */ (node.querySelector(".faq-item__qtext"));
    const $panel   = /** @type {HTMLElement} */ (node.querySelector(".faq-item__answer"));
    const $content = /** @type {HTMLElement} */ (node.querySelector(".faq-item__content"));

    const id = "faq-" + (faq.id ?? `${catSlug}-${idx}`);
    $btn.id = id + "-label";
    $btn.setAttribute("aria-controls", id);
    $panel.id = id;
    $panel.setAttribute("aria-labelledby", id + "-label");

    $q.textContent = faq.question ?? "Pregunta";
    $content.innerHTML = faq.answer_html || "";
    ensureSafeLinks($content);

    $btn.addEventListener("click", () => togglePanel($btn, $panel));

    if (location.hash.slice(1) === id) {
      openPanel($btn, $panel, false);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
    }

    $list.appendChild(node);
  });

  $root.appendChild(frag);
}

/** Re-render completo desde GROUPED. */
function render() {
  if (!$root) return;
  $root.innerHTML = "";
  const entries = Object.entries(GROUPED)
    .sort((a, b) => a[1].name.localeCompare(b[1].name, undefined, { sensitivity: "base" }));
  for (const [s, cat] of entries) mountCategory(s, cat);
  $root.setAttribute("aria-busy", "false");
}

/* -------------------------------------------------------------------------- */
/* Carga de datos y búsqueda                                                  */
/* -------------------------------------------------------------------------- */

/** Filtrado local por pregunta y respuesta. */
const handleSearch = debounce(() => {
  if (!$search) return;
  const q = $search.value.trim().toLowerCase();
  if (!q) {
    GROUPED = groupByCategory(DATA);
    render();
    return;
  }
  const filtered = DATA.filter(
    (f) =>
      (f.question || "").toLowerCase().includes(q) ||
      (f.answer_html || "").toLowerCase().includes(q)
  );
  GROUPED = groupByCategory(filtered);
  render();
}, 160);

/**
 * Descarga y normaliza los datos desde el endpoint.
 * Acepta forma: array o {results:[...]} (DRF paginado).
 */
async function loadData() {
  if (!$root) return;
  try {
    const r = await fetch(ENDPOINT, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const json = await r.json();
    DATA = Array.isArray(json) ? json : (json.results || []);
    DATA.sort(byOrder);
    GROUPED = groupByCategory(DATA);
    render();
  } catch (err) {
    console.error("[FAQ] Error cargando datos:", err);
    $root.innerHTML = `
      <div class="faq__error" role="alert">
        No pudimos cargar las preguntas frecuentes. Intenta nuevamente más tarde.
      </div>`;
    $root.setAttribute("aria-busy", "false");
  }
}

/* -------------------------------------------------------------------------- */
/* Inicialización                                                             */
/* -------------------------------------------------------------------------- */

export function initFAQ() {
  if ($search) $search.addEventListener("input", handleSearch);

  window.addEventListener("hashchange", () => {
    const id = location.hash.slice(1);
    if (!id) return;
    const $panel = /** @type {HTMLElement|null} */ (document.getElementById(id));
    const $btn = /** @type {HTMLButtonElement|null} */ ($panel?.previousElementSibling?.querySelector?.("[data-faq-toggle]"));
    if ($panel && $btn) openPanel($btn, $panel, true);
  });

  loadData();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFAQ, { once: true });
} else {
  initFAQ();
}

