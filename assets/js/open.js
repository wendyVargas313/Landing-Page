/**
 * Módulo Open (open.js)
 * Renderiza un grid de una entidad del CMS (ej. Libros) con:
 * - Imagen, título, resumen, descripción, palabras clave y link a detalle.
 * - Búsqueda local por título/keywords/descripcion.
 * - Plantillas HTML (<template>) ya presentes en open.html.
 *
 * Requisitos en el HTML:
 *  - #open-grid   (contenedor donde montar las tarjetas)
 *  - #open-search (input de texto para filtrar)
 *  - #tpl-open-card (template de tarjeta)
 *
 * Autor: tú ✨
 */

/* =========================
 * Configuración del API
 * =========================
 * Cambia estas constantes según tu backend.
 * Ejemplo para DRF: http://127.0.0.1:8000/api/libros/
 */
const API_BASE = "http://127.0.0.1:8000";
const COLLECTION_PATH = "/api/books/"; // <-- ajusta a tu endpoint real
const ENDPOINT = `${API_BASE}${COLLECTION_PATH}`;

/* =========================
 * Mapeo de campos
 * =========================
 * Ajusta estos nombres si tu API devuelve otras claves.
 * Un item debe poder mapearse a:
 * - id
 * - title
 * - summary   (resumen corto)
 * - description (HTML permitido/sanitizado en backend)
 * - image_url
 * - image_alt
 * - keywords  (array de strings)
 * - detail_url
 */
function mapItem(apiItem) {
  return {
    id: apiItem.id,
    title: apiItem.title || apiItem.name || "Sin título",
    summary: apiItem.summary || apiItem.tagline || "",
    description: apiItem.description_html || apiItem.description || "",
    image_url:
      apiItem.image_url ||
      apiItem.cover ||
      "/assets/images/placeholder.png",
    image_alt: apiItem.image_alt || `Portada de ${apiItem.title || "ítem"}`,
    keywords:
      Array.isArray(apiItem.keywords)
        ? apiItem.keywords
        : (apiItem.keywords || "").toString().split(",").map(s => s.trim()).filter(Boolean),
    detail_url: apiItem.detail_url || `detalle.html?id=${apiItem.id}`,
  };
}

/* =========================
 * DOM
 * ========================= */
const $grid = /** @type {HTMLElement|null} */ (document.getElementById("open-grid"));
const $search = /** @type {HTMLInputElement|null} */ (document.getElementById("open-search"));
const $tpl = /** @type {HTMLTemplateElement|null} */ (document.getElementById("tpl-open-card"));

/* =========================
 * Estado
 * ========================= */
let DATA = []; // items mapeados
let FILTER = ""; // cadena de búsqueda

/* =========================
 * Utilidades
 * ========================= */
function debounce(fn, ms = 200) {
  let t;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function normalize(s) {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/* =========================
 * Render
 * ========================= */
function render() {
  if (!$grid || !$tpl) return;

  // Filtro local
  const q = normalize(FILTER);
  const items = !q
    ? DATA
    : DATA.filter((it) => {
        const haystack = [
          it.title,
          it.summary,
          it.description,
          ...(it.keywords || []),
        ]
          .map(normalize)
          .join(" ");
        return haystack.includes(q);
      });

  // Limpia grid
  $grid.innerHTML = "";

  if (!items.length) {
    $grid.innerHTML = `<div class="open__empty" role="status">No hay resultados para “${FILTER}”.</div>`;
    $grid.setAttribute("aria-busy", "false");
    return;
  }

  // Role list para accesibilidad
  $grid.setAttribute("role", "list");

  // Monta tarjetas
  const frag = document.createDocumentFragment();
  for (const it of items) {
    const node = $tpl.content.cloneNode(true);

    const $img = /** @type {HTMLImageElement} */ (
      node.querySelector(".card__img")
    );
    const $sum = /** @type {HTMLElement} */ (
      node.querySelector(".card__summary")
    );
    const $title = /** @type {HTMLElement} */ (
      node.querySelector(".card__title")
    );
    const $desc = /** @type {HTMLElement} */ (
      node.querySelector(".card__description")
    );
    const $tags = /** @type {HTMLElement} */ (
      node.querySelector(".card__tags")
    );
    const $link = /** @type {HTMLAnchorElement} */ (
      node.querySelector(".card__link")
    );

    // Carga segura de imagen
    $img.src = it.image_url || "assets/images/placeholder.png";
    $img.alt = it.image_alt || "";

    // Texto
    $sum.textContent = it.summary || "";
    $title.textContent = it.title || "Sin título";

    // Descripción (permite HTML que ya viene sanitizado desde backend)
    $desc.innerHTML = it.description || "";

    // Tags
    $tags.innerHTML = "";
    (it.keywords || []).forEach((kw) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="tag">${kw}</span>`;
      $tags.appendChild(li);
    });

    // Link a detalle
    $link.href = it.detail_url || "#";

    frag.appendChild(node);
  }

  $grid.appendChild(frag);
  $grid.setAttribute("aria-busy", "false");
}

/* =========================
 * Carga de datos
 * ========================= */
async function loadData() {
  if (!$grid) return;
  try {
    const res = await fetch(ENDPOINT, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const rows = Array.isArray(json) ? json : json.results || [];
    DATA = rows.map(mapItem);
    render();
  } catch (err) {
    console.error("[Open] Error cargando datos:", err);
    $grid.innerHTML = `
      <div class="open__error" role="alert">
        No pudimos cargar los ítems. Intenta nuevamente más tarde.
      </div>`;
    $grid.setAttribute("aria-busy", "false");
  }
}

/* =========================
 * Init
 * ========================= */
function initOpen() {
  if ($search) {
    $search.addEventListener(
      "input",
      debounce(() => {
        FILTER = $search.value.trim();
        render();
      }, 150)
    );
  }
  loadData();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initOpen, { once: true });
} else {
  initOpen();
}
