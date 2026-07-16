/* ============================================================
 * faecher-daten.js  –  Zentrale Datenbank für alle Fächer
 * ============================================================
 *
 *  ANLEITUNG ZUM BEARBEITEN:
 *  ─────────────────────────
 *
 *  1) NEUEN LERNZETTEL HINZUFÜGEN
 *     Suche das passende Fach → passende Kategorie → topics:
 *
 *       { title: "Mein Thema", link: "ordner/dateiname.html" }
 *
 *  2) NEUE KATEGORIE ERSTELLEN
 *     Füge ein Objekt in das "categories"-Array hinzu:
 *
 *       { name: "Kategoriename", topics: [] }
 *
 *  3) NEUES FACH HINZUFÜGEN
 *     Neuen Eintrag hier einfügen UND im ICONS-Objekt
 *     in script.js ein passendes SVG-Icon ergänzen.
 *
 *  Fächer ohne Kategorien zeigen automatisch eine
 *  hübsche Platzhalter-Nachricht an.
 * ============================================================ */

/* Reihenfolge der Sektionen auf dem Dashboard */
const SECTION_CONFIG = [
  { id: "lk",       title: "Leistungskurse" },
  { id: "gk",       title: "Grundkurse" },
  { id: "orchidee", title: "Orchideenfach" }
];

/* ── Fächerdaten ──────────────────────────────────────────── */
const subjectData = {

  /* ═══════ LEISTUNGSKURSE ═══════ */

  mathe: {
    name: "Mathematik",
    section: "lk",
    type: "LK",
    accent: "sky-blue",
    categories: []
  },

  chemie: {
    name: "Chemie",
    section: "lk",
    type: "LK",
    accent: "sage-green",
    categories: [
      {
        name: "Grundlagen",
        topics: [
          { title: "Struktur- & Eigenschaftsbeziehungen", link: "chemie/struktur-eigenschaften.html" },
          { title: "Atombau, Bindungen & Wechselwirkungen", link: "chemie/atombau-bindungen-wechselwirkungen.html" },
          { title: "Chemische Reaktionen", link: "chemie/chemische-reaktionen.html" }
        ]
      }
    ]
  },

  gk: {
    name: "Gemeinschaftskunde",
    section: "lk",
    type: "LK",
    accent: "dusty-rose",
    categories: [
      {
        name: "Grundwissen",
        topics: [
          { title: "Politisches System der BRD", link: "gk/politisches-system-brd.html" },
          { title: "Recht und Gesellschaft", link: "gk/recht-und-gesellschaft.html" }
        ]
      }
    ]
  },

  /* ═══════ GRUNDKURSE ═══════ */

  deutsch: {
    name: "Deutsch",
    section: "gk",
    type: "GK",
    accent: "kraft-brown",
    categories: []
  },

  englisch: {
    name: "Englisch",
    section: "gk",
    type: "GK",
    accent: "lavender",
    categories: []
  },

  biologie: {
    name: "Biologie",
    section: "gk",
    type: "GK",
    accent: "mint",
    categories: []
  },

  kunst: {
    name: "Kunst",
    section: "gk",
    type: "GK",
    accent: "peach",
    categories: []
  },

  sport: {
    name: "Sport",
    section: "gk",
    type: "GK",
    accent: "terracotta",
    categories: []
  },

  religion: {
    name: "Religion",
    section: "gk",
    type: "GK",
    accent: "soft-yellow",
    categories: []
  },

  geschichte: {
    name: "Geschichte",
    section: "gk",
    type: "GK",
    accent: "mauve",
    categories: []
  },

  geographie: {
    name: "Geographie",
    section: "gk",
    type: "GK",
    accent: "sage-green",
    categories: []
  },

  /* ═══════ ORCHIDEENFACH ═══════ */

  psychologie: {
    name: "Psychologie",
    section: "orchidee",
    type: "Wahlfach",
    accent: "lavender",
    categories: []
  }
};
