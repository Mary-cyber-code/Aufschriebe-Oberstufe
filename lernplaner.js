/* ============================================================
   lernplaner.js – Persönlicher Lernplaner (Ziel: 15 Punkte)
   ------------------------------------------------------------
   Benötigt: faecher-daten.js, operatoren-daten.js, lerntools-core.js
   Speichert alles im Browser (localStorage, Schlüssel 'lernplaner-v1').

   Lernstrategien im Algorithmus:
   • Erarbeiten mit der Feynman-Methode (je schwächer, desto mehr Einheiten)
   • Üben mit steigendem Anforderungsbereich (AFB I → II → III → Klausur-Mix)
   • Spaced Repetition: Wiederholungen nach 1, 3, 7, 14, 21, 30 Tagen
   • Interleaving: Themen/Fächer werden abgewechselt, max. 2 Einheiten/Thema/Tag
   • Testing-Effekt: Klausursimulation 3–6 Tage vor der Klausur + Fehleranalyse
   • Letzter Tag: nur leichte Wiederholung, kein neuer Stoff, Schlaf
   ============================================================ */

(function () {
  'use strict';

  if (typeof subjectData === 'undefined' || !window.LernTools) {
    console.error('Lernplaner: faecher-daten.js oder lerntools-core.js fehlt.');
    return;
  }

  var LT = window.LernTools;
  var KEY = LT.STORAGE_KEY;
  var WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  var REVIEW_OFFSETS = [1, 3, 7, 14, 21, 30];

  var LEVELS = [
    { v: 1, label: 'Neu',               hint: 'Noch nie richtig gelernt' },
    { v: 2, label: 'Unsicher',          hint: 'Schon gesehen, aber viele Lücken' },
    { v: 3, label: 'Grundlagen sitzen', hint: 'AFB I klappt, bei Transfer noch unsicher' },
    { v: 4, label: 'Sicher',            hint: 'Klappt auch bei AFB-III-Aufgaben' }
  ];

  var TYPE_LABEL = {
    E: 'Erarbeiten', U: 'Üben', R: 'Wiederholen', SIM: 'Klausur-Simulation',
    FEHLER: 'Fehleranalyse', FINAL: 'Letzter Check', V: 'Puffer'
  };

  var FACH_TIPS = {
    mathe:      'Rechne vollständig mit Lösungsweg – das Ergebnis allein bringt kaum Punkte.',
    chemie:     'Achte auf Fachsprache, Einheiten und vollständige Reaktionsgleichungen.',
    biologie:   'Nutze Fachbegriffe präzise und beziehe dich bei Material-Aufgaben immer auf das Material.',
    deutsch:    'Formuliere mindestens eine Passage komplett aus: Form → Beleg (Zitat + Zeile) → Deutung.',
    englisch:   'Write in English and match the text type the operator asks for (linking words!).',
    gk:         'Belege mit Material/Beispielen und urteile mit Kriterien (z. B. Effizienz, Legitimität).',
    geschichte: 'Ordne Quellen immer in den historischen Kontext ein, bevor du urteilst.',
    geographie: 'Werte Karten/Diagramme systematisch aus und verknüpfe Raumbeispiele.',
    religion:   'Belege mit Bibelstellen/Theologen und trenne Darstellung sauber von deiner Stellungnahme.',
    psychologie:'Verknüpfe psychologische Theorien/Experimente immer konkret mit dem Fallbeispiel.',
    kunst:      'Trenne Beschreibung, Formanalyse und Deutung; skizziere Kompositionslinien.',
    sport:      'Verknüpfe biologisch-trainingswissenschaftliche Theorie mit konkreten Bewegungsbeispielen.'
  };

  /* Fachspezifische Lernprofile: Gewichtung (Erarbeiten vs. Üben/Schreiben/Rechnen) & konkrete Methodik */
  var FACH_PROFILES = {
    mathe: {
      badge: '📐 <b>Mathe-Lernprofil (ca. 20 % Regeln · 80 % Rechenpraxis &amp; Transfer):</b> Weniger Auswendiglernen, dafür deutlich mehr Rechen-, Anwendungs- und Begründungseinheiten.',
      eN: [2, 1, 1, 0],
      uN: [4, 4, 3, 2],
      e1: '<b>Kochrezept &amp; Grundidee verstehen:</b> Lies den Lernzettel, schreibe dir für jeden Aufgabentyp ein klares Schritt-für-Schritt-Kochrezept (z. B. Tangente/Normale, Ableiten, Vorzeichenwechsel) und rechne 2 Musterbeispiele komplett ohne Spicken nach.',
      e2: '<b>Formeln &amp; Standardverfahren sichern:</b> Schreibe alle Regeln/Formeln aus dem Kopf auf ein leeres Blatt und rechne die Beispiele auf dem Lernzettel selbstständig durch.',
      uI: '<b>Rechenroutine (Hilfsmittelfreier Teil):</b> Trainiere schnelles, fehlerfreies Ableiten, Umformen und Gleichungenlösen auf Papier – ohne Taschenrechner und ohne Lernzettel.',
      uII: '<b>Anwendungs- &amp; Sachaufgaben:</b> Übersetze Textangaben in mathematische Ansätze (z. B. „momentane Änderungsrate“ = f\'(x), „steilster Anstieg“ = Wendepunkt) und schreibe jeden Rechenschritt sauber auf.',
      uIII: '<b>15-Punkte-Transfer (Begründungen &amp; Parameter):</b> Löse „Begründen Sie“- und „Entscheiden Sie“-Aufgaben (z. B. grafisches Ableiten mit NEW-Regel, Funktionsscharen oder Umkehraufgaben).',
      uMIX: '<b>Klausur-Mix auf Zeit:</b> Rechne gemischte Aufgaben (Pflichtteil + Wahlteil, AFB I–III) mit Stoppuhr und vollständigem Lösungsweg.',
      r: '<b>Formel-Sprint + 2 Kurzaufgaben (Active Recall):</b> Notiere alle Ableitungsregeln und Formeln aus dem Kopf auf Papier und rechne 2 kurze Aufgaben.'
    },
    chemie: {
      badge: '🧪 <b>Chemie-Lernprofil (50 % Teilchenebene &amp; Gleichungen · 50 % Stöchiometrie, Kalorimetrie &amp; Versuchsauswertung):</b> Kombination aus Verständnis, Reaktionsgleichungen und Rechnen mit Einheiten.',
      eN: [2, 2, 1, 0],
      uN: [3, 3, 3, 2],
      e1: '<b>Teilchenebene &amp; Experimente durchdringen (Feynman):</b> Erkläre laut, was auf Teilchen- und Energieebene passiert. Trenne bei jedem Versuch (z. B. V1–V4) streng zwischen Beobachtung und Deutung.',
      e2: '<b>Reaktionsgleichungen, Formeln &amp; Einheiten:</b> Stelle alle Reaktionsgleichungen (mit Aggregatzuständen) und Berechnungsformeln (z. B. n = m/M, Q = m·c·ΔT, Δ_R H_m) selbstständig auf und erstelle Anki-Karten.',
      uI: '<b>Grundbegriffe, Gleichungen &amp; Energiediagramme:</b> Richte Reaktionsgleichungen ein, zeichne beschriftete Energiediagramme und benenne Fachbegriffe präzise.',
      uII: '<b>Rechen- &amp; Auswertungs-Training:</b> Rechne Kalorimetrie-/Stöchiometrie-Aufgaben komplett mit allen Einheiten (J, kJ/mol, K) und Vorzeichen (exotherm − / endotherm +) durch.',
      uIII: '<b>Fehlerdiskussion &amp; Transfer (15-Punkte-Training):</b> Beurteile systematische Messfehler im Experiment (warum weicht der Messwert vom Literaturwert ab?) und übertrage Konzepte (z. B. Satz von Hess) auf unbekannte Reaktionen.',
      uMIX: '<b>Chemie-Klausur-Mix:</b> Kombiniere Theorie, Reaktionsgleichungen, Rechnung und Versuchsauswertung unter Zeitdruck.',
      r: '<b>Formel-, Vorzeichen- &amp; Gleichungs-Check (Blurting):</b> Schreibe Reaktionsgleichungen, Formeln + Einheiten und Energiediagramme aus dem Kopf auf + Anki-Karten.'
    },
    deutsch: {
      badge: '✍️ <b>Deutsch-Lernprofil (7-Schritte-Klausur-Bauplan &amp; Aufsatz-Training):</b> In Deutsch schreibst du <b>einen durchgehenden Aufsatz im Fließtext</b>. Dein Plan trainiert gezielt die 7 Klausur-Bausteine (Einleitung + Hypothese → Strukturierte Inhaltsangabe → Hauptteil Block 1–4 im Dreischritt → Fazit) samt deinen 15-Punkte-Satzschablonen.',
      eN: [2, 1, 1, 0],
      uN: [3, 3, 3, 2],
      e1: '<b>Teil 1 – Den 7-Schritte-Klausur-Bauplan &amp; die Satzschablonen verinnerlichen:</b> Gehe die 7 Klausur-Bausteine durch (1. Einleitung &amp; Deutungshypothese, 2. Strukturierte Inhaltsangabe, 3. Block 1: Rahmen/Einstieg/Grundstimmung, 4. Block 2: Hauptfigur &amp; innerer Konflikt, 5. Block 3: Figurenkonstellation &amp; Kommunikation, 6. Block 4: Wendepunkt/Titel/offener Schluss, 7. Fazit) und präge dir die <b>15-Punkte-Satzschablonen</b> ein.',
      e2: '<b>Teil 2 – Fachbegriffs-Lexikon (Werkzeugkasten A, B, C) sichern:</b> Wiederhole die Form-Werkzeuge für Schritt 1 im Dreischritt: A) Zeitgestaltung (Zeitdeckung, Zeitdehnung, Zeitraffung, Analepse/Prolepse), B) Erzähltechnik (personal/neutral/auktorial, Innerer Monolog, 15-P-Joker <i>Erlebte Rede</i>) und C) Bildsprache, Lexik &amp; Syntax (Dingsymbol, Parataxe/Hypotaxe, Asyndeton, Ellipse/Aposiopese).',
      uI: '<b>Aufsatz-Baustein 1 (ca. 20 Min.) – Einleitung, Deutungshypothese, Inhaltsangabe &amp; Block 1:</b> Schreibe zu einer Übungs-Kurzgeschichte mithilfe deiner Satzschablonen: 1) Basissatz + Deutungshypothese, 2) Strukturierte Inhaltsangabe in 3 Sinnabschnitten (Präsens &amp; Konjunktiv I) und 3) <b>Hauptteil Block 1</b> (Einstieg <i>in medias res</i>, Raum/Zeit als Stimmungsraum &amp; äußere Handlung).',
      uII: '<b>Aufsatz-Baustein 2 (ca. 50 Min.) – Hauptteil Block 2 (Hauptfigur/Innenwelt) &amp; Block 3 (Konstellation/Kommunikation):</b> Schreibe zu einer Übungs-Kurzgeschichte <b>Block 2</b> (personales Erzählverhalten, Innensicht, <i>Erlebte Rede</i>, Ambivalenz) und <b>Block 3</b> (Figurenkonstellation, Perspektivwechsel in den Dialogen, Sachebene vs. Beziehungsebene, Ellipsen/Aposiopese) im 15-Punkte-Dreischritt!',
      uIII: '<b>Aufsatz-Baustein 3 (ca. 25 Min.) – Hauptteil Block 4 (Wendepunkt, Titel &amp; offener Schluss) + Fazit:</b> Schreibe zu einer Übungs-Kurzgeschichte <b>Block 4</b> (Wendepunkt/Resignation, Dingsymbol/Leitmotiv, Titel-Deutung &amp; offener Schluss mit Leerstellen) sowie deinen <b>Schluss/Fazit</b> (Rückbezug zur Deutungshypothese, Synthese von Inhalt &amp; Form, impliziter Appell an den Leser).',
      uMIX: '<b>Komplettes Aufsatz-Training nach dem 7-Schritte-Bauplan:</b> Gliedere eine neue Übungs-Kurzgeschichte in Sinnabschnitte und schreibe Einleitung + Inhaltsangabe + die 4 Hauptteil-Blöcke (mit deinen Scharnier-Sätzen &amp; Dreischritt-Verknüpfungen) + Fazit im Fließtext.',
      r: '<b>Satzschablonen- &amp; Werkzeugkasten-Recall:</b> Schreibe die Head-Sentences für Block 1–4 sowie die Begriffe aus Werkzeugkasten A (Zeit), B (Perspektive/Erlebte Rede) und C (Dingsymbol/Syntax) aus dem Kopf auf.'
    },
    englisch: {
      badge: '🇬🇧 <b>Englisch-Lernprofil (Active Writing &amp; Textproduktion):</b> Training von Outline/Comprehension, Language &amp; Style Analysis, Comment/Discussion und Mediation.',
      eN: [2, 1, 1, 0],
      uN: [3, 3, 3, 2],
      e1: '<b>Topic Vocabulary, Fakten &amp; Textsorten-Regeln:</b> Lerne das Themen-Vokabular, wichtige Linking Words und die Struktur für Outline, Analysis, Comment und Mediation.',
      e2: '<b>Analytical Phrases &amp; Stylistic Devices:</b> Präge dir englische Redemittel für die Analyse („The author employs … to convey …“) und Argumentationen aktiv ein.',
      uI: '<b>Writing Practice 1 – Outline / Comprehension &amp; Mediation:</b> Fasse einen Text strukturiert in eigenen englischen Worten zusammen (present tense, no quotes!) oder bearbeite eine Mediations-Aufgabe.',
      uII: '<b>Writing Practice 2 – Analysis (Point–Evidence–Analysis):</b> Schreibe 2–3 analytische Absätze auf Englisch (characterisation, narrative perspective, tone/stylistic devices) mit präzisen Textbelegen.',
      uIII: '<b>Writing Practice 3 – Comment / Discussion (15-Punkte-Stil):</b> Schreibe einen überzeugenden Comment (oder Speech/Letter) mit starken Argumenten, Beispielen, differenziertem Fazit und abwechslungsreichen Linking Words.',
      uMIX: '<b>Full Writing Task (mit Timer):</b> Schreibe eine komplette Teilaufgabe auf Englisch auf Zeit, prüfe danach Grammatik, Register und Satzbau.',
      r: '<b>Vocabulary &amp; Linking-Words Recall:</b> Schreibe 10 starke Linking Words, Topic Vocabulary und Analytical Phrases aus dem Kopf auf + Anki-Karten.'
    },
    gesellschaft: {
      badge: '🏛️ <b>Gesellschaftswiss.-Lernprofil (45 % Fakten, Modelle &amp; Artikel auswendig · 55 % Materialanalyse &amp; Urteilsbildung):</b> Kombiniert aktives Einprägen von Fachbegriffen/Gesetzen mit Textanalyse und kriteriengeleitetem Urteil.',
      eN: [3, 2, 1, 0],
      uN: [3, 3, 2, 2],
      e1: '<b>Modelle, Fachbegriffe &amp; Zusammenhänge durchdringen (Feynman):</b> Erkläre die zentralen Konzepte, Modelle, Theorien oder Verfassungsartikel laut in eigenen Worten und zeichne dir ein Übersichts-Schema.',
      e2: '<b>Faktenwissen, Gesetze/Daten &amp; Beispiele auswendig lernen:</b> Erstelle und lerne Anki-Karten zu allen Definitionen, Artikeln/Paragraphen (z. B. GG), historischen Eckdaten oder Raum-/Fallbeispielen.',
      uI: '<b>Darstellungs-Training (AFB I – herausarbeiten / beschreiben):</b> Werte ein Material (Textquelle, Statistik, Karikatur, Karte) strukturiert und in eigenen Worten aus (Einleitungssatz + Kernaussagen).',
      uII: '<b>Analyse &amp; Einordnung (AFB II – erläutern / vergleichen / einordnen):</b> Verknüpfe die Materialaussagen systematisch mit deinem gelernten Fachwissen, Modellen und konkreten Beispielen/Artikeln.',
      uIII: '<b>Urteilsbildung &amp; Erörterung (AFB III – beurteilen / erörtern):</b> Schreibe eine Pro-Contra-Argumentation im Fließtext und fälle ein begründetes Sach- und Werturteil anhand klarer Urteilskriterien (z. B. Effizienz vs. Legitimität).',
      uMIX: '<b>Klausur-Aufgabe komplett (AFB I–III):</b> Bearbeite eine mehrteilige Materialaufgabe von der Auswertung bis zum Kriterien-Urteil im Fließtext.',
      r: '<b>Blurting (Begriffe, Artikel/Daten &amp; Urteilskriterien):</b> Schreibe alle Fachbegriffe, Modelle und Pro-/Contra-Argumente zum Thema aus dem Kopf auf + Anki-Karten.'
    },
    bio_natur: {
      badge: '🧬 <b>Biologie-/Praxis-Lernprofil (45 % Prozesse &amp; Fachbegriffe auswendig · 55 % Material- &amp; Hypothesen-Training):</b> Abläufe als Flussdiagramm beherrschen und auf unbekannte Experimente/Materialien anwenden.',
      eN: [3, 2, 1, 0],
      uN: [3, 3, 2, 2],
      e1: '<b>Abläufe &amp; Struktur-Funktions-Beziehungen verstehen (Feynman):</b> Zeichne den Prozess als Schritt-für-Schritt-Flussdiagramm und erkläre ihn laut ohne Vorlage.',
      e2: '<b>Fachbegriffe &amp; Diagramme auswendig lernen:</b> Erstelle Anki-Karten zu allen Fachbegriffen und zeichne wichtige Schemata aus dem Gedächtnis.',
      uI: '<b>Beschreiben &amp; Darstellen (AFB I):</b> Beschreibe Abbildungen, Messkurven oder Prozesse präzise in der Fachsprache (erst beschreiben, noch nicht deuten!).',
      uII: '<b>Material- &amp; Experiment-Auswertung (AFB II):</b> Erkläre Messergebnisse mithilfe deines Fachwissens und verknüpfe mehrere Materialien.',
      uIII: '<b>Hypothesen &amp; Beurteilung (AFB III – 15-Punkte-Training):</b> Stelle begründete Hypothesen zu neuen Experimenten auf oder beurteile Sachverhalte kriteriengeleitet.',
      uMIX: '<b>Materialgebundene Klausuraufgabe (AFB I–III):</b> Löse eine komplette Abitur-/Klausuraufgabe mit Materialauswertung auf Zeit.',
      r: '<b>Flussdiagramm-Blurting &amp; Anki:</b> Skizziere den kompletten Ablauf und alle Schlüsselbegriffe in 5 Min. aus dem Kopf auf ein leeres Blatt.'
    }
  };

  function getProfile(fk) {
    if (FACH_PROFILES[fk]) return FACH_PROFILES[fk];
    if (fk === 'gk' || fk === 'geschichte' || fk === 'geographie' || fk === 'religion' || fk === 'psychologie') {
      return FACH_PROFILES.gesellschaft;
    }
    return FACH_PROFILES.bio_natur;
  }

  /* ──────────────────────────────────────────────────────────
     Hilfsfunktionen
     ────────────────────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toStr(dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }
  function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function todayStr() { return toStr(new Date()); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return toStr(d); }
  function diff(a, b) { return Math.round((parse(b) - parse(a)) / 864e5); } /* b − a in Tagen */
  function wdIdx(s) { return (parse(s).getDay() + 6) % 7; }
  function fmtShort(s) { var d = parse(s); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.'; }
  function fmtDay(s) { return WD[wdIdx(s)] + ', ' + fmtShort(s); }
  function validDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || ''); }
  function fachName(fk) { return (subjectData[fk] && subjectData[fk].name) || fk; }
  function fmtMin(m) {
    var h = Math.floor(m / 60), r = m % 60;
    if (!h) return r + ' Min.';
    return h + ' Std.' + (r ? ' ' + r + ' Min.' : '');
  }

  var GEMINI_URL = 'https://gemini.google.com/app';
  var GEMINI_LINK = '<a class="lp-tool lp-tool-gold" href="' + GEMINI_URL + '" target="_blank" rel="noopener">Gemini öffnen ↗</a>';

  var toastTimer = null;
  /** withGemini = true → zusätzlicher Link „Gemini öffnen“ */
  function toast(msg, withGemini) {
    var t = $('lp-toast');
    if (!t) return;
    t.textContent = msg;
    if (withGemini) {
      var a = document.createElement('a');
      a.href = GEMINI_URL; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = 'Gemini öffnen ↗';
      t.appendChild(a);
    }
    t.classList.add('lp-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('lp-show'); }, withGemini ? 8000 : 3800);
  }

  /* ──────────────────────────────────────────────────────────
     Zustand & Projekte (mehrere Lernpläne parallel / nacheinander)
     ────────────────────────────────────────────────────────── */
  function makeId() {
    return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  function defaults(id, name) {
    return {
      id: id || makeId(),
      name: name || 'Lernplan 1',
      settings: { start: todayStr(), minutes: [60, 60, 60, 60, 60, 90, 0], block: 45, subjects: {} },
      plan: null,
      done: {}
    };
  }

  function sanitizeProj(raw, idx) {
    var d = defaults(raw && raw.id ? String(raw.id) : makeId(), raw && raw.name ? String(raw.name) : ('Lernplan ' + (idx + 1)));
    if (raw && raw.settings) {
      d.settings.start = validDate(raw.settings.start) ? raw.settings.start : d.settings.start;
      if (raw.settings.minutes && raw.settings.minutes.length === 7) {
        d.settings.minutes = raw.settings.minutes.map(function (m) { return +m || 0; });
      }
      if ([25, 45, 60].indexOf(+raw.settings.block) >= 0) d.settings.block = +raw.settings.block;
      d.settings.subjects = raw.settings.subjects || {};
      d.plan = raw.plan || null;
      d.done = raw.done || {};
    }
    return d;
  }

  function loadStore() {
    var st = { activeId: '', projects: [] };
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (raw && Array.isArray(raw.projects) && raw.projects.length) {
        st.projects = raw.projects.map(sanitizeProj);
        st.activeId = raw.activeId || st.projects[0].id;
      } else if (raw && raw.settings) {
        var migrated = sanitizeProj({ id: 'p_1', name: 'Lernplan 1', settings: raw.settings, plan: raw.plan, done: raw.done }, 0);
        st.projects = [migrated];
        st.activeId = migrated.id;
      }
    } catch (e) { /* defekte Daten ignorieren */ }
    if (!st.projects.length) {
      var first = defaults('p_1', 'Lernplan 1');
      st.projects = [first];
      st.activeId = first.id;
    }
    var found = st.projects.filter(function (p) { return p.id === st.activeId; })[0];
    if (!found) st.activeId = st.projects[0].id;
    return st;
  }

  var store = loadStore();
  var state = store.projects.filter(function (p) { return p.id === store.activeId; })[0] || store.projects[0];

  function save() {
    try {
      store.activeId = state.id;
      /* Spiegelung auf Top-Level für Abwärtskompatibilität (z. B. lerntools-core.js) */
      store.settings = state.settings;
      store.plan = state.plan;
      store.done = state.done;
      localStorage.setItem(KEY, JSON.stringify(store));
      renderProjects();
    } catch (e) {
      toast('Speichern nicht möglich – ist der private Modus aktiv?');
    }
  }

  /** Klonen der Einschätzungen, eigenen Themen, Übungsblätter & Zusatzwissen für ein neues Projekt */
  function cloneKnowledgeFromCurrent() {
    var out = {};
    var src = (state && state.settings && state.settings.subjects) || {};
    Object.keys(src).forEach(function (fk) {
      var s = src[fk] || {};
      var topicsCopy = {};
      if (s.topics) {
        Object.keys(s.topics).forEach(function (k) {
          var t = s.topics[k] || {};
          topicsCopy[k] = { selected: false, level: t.level || 2, important: !!t.important };
        });
      }
      var customCopy = (s.custom || []).map(function (c) {
        return { id: c.id, title: c.title, note: c.note || '', level: c.level || 2, important: !!c.important, selected: false };
      });
      var filesCopy = (s.files || []).map(function (f) {
        return { id: f.id, name: f.name, text: f.text || '', pages: f.pages || 0, isScan: !!f.isScan };
      });
      out[fk] = {
        topics: topicsCopy,
        custom: customCopy,
        files: filesCopy,
        exam: '',
        simMinutes: s.simMinutes || 90,
        zusatz: s.zusatz || ''
      };
    });
    return out;
  }

  function projSubtitle(proj) {
    if (proj.plan && proj.plan.exams && proj.plan.exams.length) {
      return proj.plan.exams.map(function (e) { return fachName(e.fk) + ' (' + fmtShort(e.date) + ')'; }).join(', ');
    }
    var subs = (proj.settings && proj.settings.subjects) || {};
    var active = [];
    Object.keys(subjectData).forEach(function (fk) {
      var st = subs[fk];
      if (!st) return;
      var hasSel = false;
      if (st.topics) {
        Object.keys(st.topics).forEach(function (k) { if (st.topics[k] && st.topics[k].selected) hasSel = true; });
      }
      if ((st.custom || []).some(function (c) { return c.selected !== false; })) hasSel = true;
      if (hasSel) active.push(fachName(fk) + (st.exam ? ' (' + fmtShort(st.exam) + ')' : ''));
    });
    return active.length ? active.join(', ') + ' · Entwurf' : 'Noch keine Themen gewählt';
  }

  function renderProjects() {
    var box = $('lp-projects');
    if (!box) return;
    var h = '<div class="lp-proj-top">';
    h += '<span class="lp-proj-label">🗂️ Deine Lernplan-Projekte</span>';
    h += '<span class="lp-proj-hint">Du kannst in <b>einem</b> Projekt mehrere Klausuren (gleichzeitig oder nacheinander) planen – oder hier getrennte Projekte anlegen:</span>';
    h += '</div>';
    h += '<div class="lp-proj-tabs">';
    store.projects.forEach(function (p) {
      var active = p.id === state.id;
      var pid = esc(p.id);
      h += '<div class="lp-proj-tab' + (active ? ' lp-active' : '') + '" data-proj-act="switch" data-id="' + pid + '">';
      h += '<div><div>' + esc(p.name) + '</div><span class="lp-proj-sub">' + esc(projSubtitle(p)) + '</span></div>';
      h += '<button type="button" class="lp-proj-icon" data-proj-act="rename" data-id="' + pid + '" title="Projekt umbenennen" aria-label="Projekt umbenennen">✏️</button>';
      if (store.projects.length > 1) {
        h += '<button type="button" class="lp-proj-icon" data-proj-act="del-proj" data-id="' + pid + '" title="Projekt löschen" aria-label="Projekt löschen">&times;</button>';
      }
      h += '</div>';
    });
    h += '<button type="button" class="lp-proj-add" data-proj-act="new">+ Neuer Lernplan</button>';
    h += '</div>';
    box.innerHTML = h;
  }

  function switchProject(id) {
    var target = store.projects.filter(function (p) { return p.id === id; })[0];
    if (!target || target.id === state.id) return;
    state = target;
    store.activeId = state.id;
    save();
    renderSubjects();
    renderTime();
    renderPlan();
    setupVisible(!state.plan);
    $('lp-error').textContent = '';
    toast('Gewechselt zu „' + state.name + '“');
  }

  function openNewProjectModal() {
    var overlay = document.createElement('div');
    overlay.className = 'modal show';
    overlay.style.zIndex = '25000';
    var nextName = 'Lernplan ' + (store.projects.length + 1);
    overlay.innerHTML =
      '<div class="modal-content" style="max-width: 480px;">' +
        '<button class="modal-close" aria-label="Schließen">&times;</button>' +
        '<h2 class="modal-title">Neues Lernplan-Projekt anlegen</h2>' +
        '<p class="modal-desc">Lege einen weiteren Lernplan an – z. B. für die nächste Klausurenphase, ein einzelnes Fach oder einen Nachschreibtermin.</p>' +
        '<div class="form-group" style="margin-top: 12px;">' +
          '<label>Name des Projekts</label>' +
          '<input type="text" class="form-control" id="lp-new-proj-name" maxlength="60" value="' + esc(nextName) + '" placeholder="z. B. Klausurenphase Herbst / Mathe &amp; Chemie">' +
        '</div>' +
        '<label style="display:flex;align-items:flex-start;gap:8px;font-size:0.88rem;color:var(--text-secondary);cursor:pointer;margin:10px 0 16px;">' +
          '<input type="checkbox" id="lp-new-proj-copy" checked style="margin-top:3px;accent-color:var(--forest);">' +
          '<span>Bisherige <b>Selbsteinschätzungen</b>, <b>eigene Themen</b> und <b>Zusatzwissen</b> übernehmen (nur Häkchen &amp; Klausurtermine starten leer)</span>' +
        '</label>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
          '<button type="button" class="btn btn-outline" data-act="cancel">Abbrechen</button>' +
          '<button type="button" class="btn btn-gold" data-act="create" style="width:auto;">Projekt erstellen</button>' +
        '</div>' +
      '</div>';

    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    function create() {
      var nameInp = overlay.querySelector('#lp-new-proj-name');
      var copyChk = overlay.querySelector('#lp-new-proj-copy');
      var name = (nameInp.value || '').trim() || nextName;
      var np = defaults(makeId(), name);
      if (state.settings && state.settings.minutes) np.settings.minutes = state.settings.minutes.slice();
      if (state.settings && state.settings.block) np.settings.block = state.settings.block;
      if (copyChk && copyChk.checked) np.settings.subjects = cloneKnowledgeFromCurrent();
      store.projects.push(np);
      state = np;
      store.activeId = np.id;
      save();
      renderSubjects();
      renderTime();
      renderPlan();
      setupVisible(true);
      $('lp-error').textContent = '';
      close();
      toast('Projekt „' + name + '“ erstellt!');
    }
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { close(); return; }
      var b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.getAttribute('data-act') === 'cancel') close();
      else if (b.getAttribute('data-act') === 'create') create();
    });
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); create(); }
      else if (e.key === 'Escape') close();
    });
    document.body.appendChild(overlay);
    var inp = overlay.querySelector('#lp-new-proj-name');
    if (inp) { inp.focus(); inp.select(); }
  }

  function openRenameProjectModal(id) {
    var proj = store.projects.filter(function (p) { return p.id === id; })[0];
    if (!proj) return;
    var overlay = document.createElement('div');
    overlay.className = 'modal show';
    overlay.style.zIndex = '25000';
    overlay.innerHTML =
      '<div class="modal-content" style="max-width: 440px;">' +
        '<button class="modal-close" aria-label="Schließen">&times;</button>' +
        '<h2 class="modal-title">Projekt umbenennen</h2>' +
        '<div class="form-group" style="margin: 12px 0 16px;">' +
          '<label>Neuer Name</label>' +
          '<input type="text" class="form-control" id="lp-ren-proj-name" maxlength="60" value="' + esc(proj.name) + '">' +
        '</div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
          '<button type="button" class="btn btn-outline" data-act="cancel">Abbrechen</button>' +
          '<button type="button" class="btn btn-gold" data-act="save" style="width:auto;">Speichern</button>' +
        '</div>' +
      '</div>';

    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    function doSave() {
      var val = (overlay.querySelector('#lp-ren-proj-name').value || '').trim();
      if (val) { proj.name = val; save(); renderPlan(); toast('Umbenannt in „' + val + '“'); }
      close();
    }
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { close(); return; }
      var b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.getAttribute('data-act') === 'cancel') close();
      else if (b.getAttribute('data-act') === 'save') doSave();
    });
    overlay.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); doSave(); }
      else if (e.key === 'Escape') close();
    });
    document.body.appendChild(overlay);
    var inp = overlay.querySelector('#lp-ren-proj-name');
    if (inp) { inp.focus(); inp.select(); }
  }

  function deleteProjectById(id) {
    if (store.projects.length <= 1) { openDeleteModal(); return; }
    var target = store.projects.filter(function (p) { return p.id === id; })[0];
    if (!target) return;
    store.projects = store.projects.filter(function (p) { return p.id !== id; });
    if (state.id === id) state = store.projects[0];
    store.activeId = state.id;
    save();
    renderSubjects();
    renderTime();
    renderPlan();
    setupVisible(!state.plan);
    $('lp-error').textContent = '';
    toast('Projekt „' + target.name + '“ gelöscht.');
  }

  function initProjectEvents() {
    var box = $('lp-projects');
    if (!box) return;
    box.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-proj-act]');
      if (!btn) return;
      var act = btn.getAttribute('data-proj-act');
      var id = btn.getAttribute('data-id');
      if (act === 'new') { openNewProjectModal(); }
      else if (act === 'rename') { e.stopPropagation(); openRenameProjectModal(id); }
      else if (act === 'del-proj') { e.stopPropagation(); deleteProjectById(id); }
      else if (act === 'switch') { switchProject(id); }
    });
  }

  function defaultSimMin(fk) {
    if (fk === 'deutsch') return 180;
    if (fk === 'englisch') return 135;
    return 90;
  }

  function getSub(fk) {
    var all = state.settings.subjects;
    var st = all[fk];
    if (!st) st = all[fk] = {};
    if (!st.topics) st.topics = {};
    if (!st.custom) st.custom = [];
    if (!st.files) st.files = [];
    if (st.exam == null) st.exam = '';
    if (!st.simMinutes) st.simMinutes = defaultSimMin(fk);
    if (st.zusatz == null) st.zusatz = '';
    return st;
  }

  /** Alle Themen eines Fachs (Lernzettel + eigene) inkl. Einstellungen */
  function subjTopics(fk) {
    var f = subjectData[fk], st = getSub(fk), out = [];
    (f.categories || []).forEach(function (c) {
      (c.topics || []).forEach(function (t) {
        var key = t.link || ('t:' + t.title);
        var ts = st.topics[key] || {};
        out.push({
          key: key, title: t.title, link: t.link || '', note: '', cat: c.name, custom: false,
          level: ts.level || 2, important: !!ts.important, selected: !!ts.selected
        });
      });
    });
    st.custom.forEach(function (c) {
      out.push({
        key: 'c:' + c.id, title: c.title, link: '', note: c.note || '', cat: 'Eigene Themen', custom: true,
        level: c.level || 2, important: !!c.important, selected: c.selected !== false
      });
    });
    return out;
  }

  function findTopic(fk, key) {
    var list = subjTopics(fk);
    for (var i = 0; i < list.length; i++) if (list[i].key === key) return list[i];
    return null;
  }

  function setTopic(fk, key, prop, val) {
    var st = getSub(fk);
    if (key.indexOf('c:') === 0) {
      var id = key.slice(2);
      st.custom.forEach(function (c) { if (String(c.id) === id) c[prop] = val; });
    } else {
      var ts = st.topics[key] || (st.topics[key] = { selected: false, level: 2, important: false });
      ts[prop] = val;
    }
    save();
  }

  /** Signatur der planungsrelevanten Einstellungen (ohne Zusatzwissen/Start) */
  function settingsSig() {
    var s = state.settings, subs = {};
    Object.keys(subjectData).forEach(function (fk) {
      var sel = subjTopics(fk).filter(function (t) { return t.selected; });
      var st = getSub(fk);
      if (!sel.length && !(st.files && st.files.length)) return;
      subs[fk] = {
        exam: st.exam, sim: st.simMinutes,
        t: sel.map(function (t) { return t.key + ':' + t.level + ':' + (t.important ? 1 : 0); }),
        f: (st.files || []).map(function (fl) { return fl.id; })
      };
    });
    return JSON.stringify({ m: s.minutes, b: s.block, s: subs });
  }

  /* ──────────────────────────────────────────────────────────
     SCHRITT 1 – Fächer & Themen
     ────────────────────────────────────────────────────────── */
  function subjectSummary(fk) {
    var sel = subjTopics(fk).filter(function (t) { return t.selected; }).length;
    var st = getSub(fk);
    var fc = (st.files || []).length;
    if (!sel && !fc) return { cls: ' lp-empty', text: 'nicht ausgewählt' };
    var parts = [];
    if (sel) parts.push(sel + (sel === 1 ? ' Thema' : ' Themen'));
    if (fc) parts.push(fc + (fc === 1 ? ' Übungsblatt' : ' Übungsblätter'));
    var txt = parts.join(' + ');
    txt += st.exam ? ' · Klausur ' + fmtShort(st.exam) : ' · Termin fehlt!';
    return { cls: '', text: txt };
  }

  function renderSubject(fk, open) {
    var f = subjectData[fk], st = getSub(fk), topics = subjTopics(fk);
    var sum = subjectSummary(fk);
    var anySel = topics.some(function (t) { return t.selected; }) || (st.files && st.files.length > 0);
    var prof = getProfile(fk);

    var h = '<details class="lp-subject" data-fach="' + esc(fk) + '"' + (open ? ' open' : '') + '>';
    h += '<summary>' + esc(f.name) + ' <span class="lp-sum-type">' + esc(f.type || '') + '</span>';
    h += '<span class="lp-sum-count' + sum.cls + '">' + esc(sum.text) + '</span></summary>';
    h += '<div class="lp-subject-body">';
    h += '<div class="lp-fach-profile">' + prof.badge + '</div>';
    h += '<div class="lp-fach-bar">';
    h += '<p class="lp-hint"><b>Neu</b> = noch nie gelernt · <b>Unsicher</b> = viele Lücken · <b>Grundlagen</b> = AFB I sitzt · <b>Sicher</b> = auch AFB III klappt · <b>★</b> = besonders klausurrelevant</p>';
    if (topics.length) {
      h += '<button type="button" class="lp-fach-test-btn" data-act="test-fach">🎯 Einstufungs-Test für ' + esc(f.name) + ' starten</button>';
    }
    h += '</div>';

    if (!topics.length) {
      h += '<p class="lp-empty-note">Für dieses Fach gibt es noch keine Lernzettel – füge unten einfach eigene Themen hinzu.</p>';
    }

    var lastCat = null;
    topics.forEach(function (t, i) {
      if (t.cat !== lastCat) { h += '<h3 class="lp-cat">' + esc(t.cat) + '</h3>'; lastCat = t.cat; }
      var k = esc(t.key);
      h += '<div class="lp-topic' + (t.selected ? '' : ' lp-off') + '">';
      h += '<div class="lp-topic-name"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;">';
      h += '<input type="checkbox" data-act="sel" data-key="' + k + '"' + (t.selected ? ' checked' : '') + '>';
      h += '<span>' + esc(t.title) + '</span></label>';
      if (t.custom) {
        h += '<span class="lp-custom-tag">eigenes</span>';
        h += '<button type="button" class="lp-del" data-act="del" data-key="' + k + '" title="Thema löschen" aria-label="Thema löschen">&times;</button>';
      }
      h += '</div>';
      h += '<button type="button" class="lp-test-btn" data-act="test-topic" data-key="' + k + '" title="Kurzer Abfrage-Test, damit die Website deine Stufe einschätzt">🎯 Test</button>';
      h += '<div class="lp-levels" role="radiogroup" aria-label="Wie gut kannst du ' + esc(t.title) + '?">';
      LEVELS.forEach(function (l) {
        h += '<label title="' + esc(l.hint) + '"><input type="radio" name="lv-' + esc(fk) + '-' + i + '" value="' + l.v + '" data-act="lvl" data-key="' + k + '"' + (t.level === l.v ? ' checked' : '') + '>';
        h += '<span class="lv' + l.v + '">' + l.label + '</span></label>';
      });
      h += '</div>';
      h += '<button type="button" class="lp-star' + (t.important ? ' lp-on' : '') + '" data-act="star" data-key="' + k + '" aria-pressed="' + (t.important ? 'true' : 'false') + '" title="Besonders klausurrelevant">★</button>';
      h += '</div>';
    });

    h += '<div class="lp-add-row">';
    h += '<input type="text" class="form-control" data-act="newtitle" maxlength="120" placeholder="Eigenes Thema hinzufügen (z. B. Kurvendiskussion mit Parametern)">';
    h += '<button type="button" class="btn btn-outline" data-act="add">+ Thema</button>';
    h += '</div>';

    h += '<div class="lp-subject-opts' + (anySel ? '' : ' lp-hidden') + '">';
    h += '<div class="form-group"><label>Klausur- / Prüfungstermin</label>';
    h += '<input type="date" class="form-control" data-act="exam" value="' + esc(st.exam) + '"></div>';
    h += '<div class="form-group"><label>Dauer der Klausur (für die Simulation)</label><select class="form-control" data-act="sim">';
    [45, 60, 90, 135, 180, 210, 240, 270, 300, 315].forEach(function (m) {
      h += '<option value="' + m + '"' + (+st.simMinutes === m ? ' selected' : '') + '>' + fmtMin(m) + '</option>';
    });
    h += '</select></div></div>';

    /* --- Eigene Übungsaufgaben / Arbeitsblätter (PDF / TXT / Bild) --- */
    h += '<div class="lp-subject-opts"><div class="form-group lp-full">';
    h += '<div class="lp-files-box">';
    h += '<div class="lp-files-head">';
    h += '<div><label style="margin:0;color:var(--forest);font-family:var(--font-heading);">📄 Eigene Übungsaufgaben / Arbeitsblätter (PDF, Text, Foto)</label>';
    h += '<p class="lp-hint" style="margin:2px 0 0;">Lade Übungsblätter oder Altklausuren hoch: Sie werden als eigene Übungseinheit im Lernplan eingeplant und in deine KI-Prompts einbezogen.</p></div>';
    h += '<label class="lp-upload-btn">📎 Übungsblatt hochladen<input type="file" accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp" multiple data-act="file-upload" style="display:none;"></label>';
    h += '</div>';
    if (st.files && st.files.length) {
      h += '<div class="lp-file-list">';
      st.files.forEach(function (fl) {
        var fid = esc(fl.id);
        var meta = fl.text && fl.text.trim()
          ? '✓ Text ausgelesen (' + (fl.pages ? fl.pages + ' S., ' : '') + Math.round(fl.text.length / 100) / 10 + 'k Zeichen) – wird automatisch in Prompts &amp; Lernplan eingebaut'
          : '📷 Scan / Bild – als Übungseinheit eingeplant (in Gemini einfach per + anhängen oder Text einfügen)';
        h += '<div class="lp-file-item">';
        h += '<div class="lp-file-info"><span>📄</span><div><div class="lp-file-name">' + esc(fl.name) + '</div><div class="lp-file-meta">' + meta + '</div></div></div>';
        h += '<div class="lp-file-actions">';
        h += '<button type="button" class="lp-tool lp-tool-gold" data-act="file-solve" data-fid="' + fid + '" title="Prompt kopieren: Musterlösung &amp; Schritt-für-Schritt-Erklärung zu diesem Blatt">Musterlösung (KI)</button>';
        h += '<button type="button" class="lp-tool" data-act="file-twin" data-fid="' + fid + '" title="Prompt kopieren: Neue Parallelaufgaben im exakt gleichen Stil erstellen">Parallelaufgaben</button>';
        h += '<button type="button" class="lp-tool" data-act="file-edit" data-fid="' + fid + '" title="Ausgelesenen Text ansehen oder bearbeiten">✏️ Text</button>';
        h += '<button type="button" class="lp-del" data-act="file-del" data-fid="' + fid + '" title="Übungsblatt entfernen">&times;</button>';
        h += '</div></div>';
      });
      h += '</div>';
    }
    h += '</div></div></div>';

    h += '<div class="lp-subject-opts"><div class="form-group lp-full">';
    h += '<label>Zusatzwissen – muss ich können, steht aber auf keinem Lernzettel</label>';
    h += '<textarea class="form-control" rows="4" data-act="zusatz" placeholder="z. B. Definitionen aus dem Heft, Formeln vom Arbeitsblatt, Fachbegriffe, Lektüre-Details, Hinweise der Lehrkraft …">' + esc(st.zusatz) + '</textarea>';
    h += '<p class="lp-hint">Wird automatisch in deine Quiz- und Simulations-Prompts eingebaut – hier im Lernplaner und im KI-Quiz-Generator auf der Startseite.</p>';
    if (anySel || st.custom.length || (st.files && st.files.length) || st.exam || (st.zusatz && st.zusatz.trim())) {
      h += '<button type="button" class="lp-fach-reset" data-act="reset-fach">🗑️ Eingaben für ' + esc(f.name) + ' zurücksetzen</button>';
    }
    h += '</div></div>';

    h += '</div></details>';
    return h;
  }

  function renderSubjects() {
    var box = $('lp-subjects');
    var open = {};
    Array.prototype.forEach.call(box.querySelectorAll('details.lp-subject[open]'), function (d) {
      open[d.getAttribute('data-fach')] = true;
    });
    box.innerHTML = Object.keys(subjectData).map(function (fk) { return renderSubject(fk, open[fk]); }).join('');
  }

  function rerenderSubject(fk) {
    var box = $('lp-subjects');
    var old = box.querySelector('details.lp-subject[data-fach="' + fk + '"]');
    if (!old) { renderSubjects(); return; }
    var tmp = document.createElement('div');
    tmp.innerHTML = renderSubject(fk, old.open);
    box.replaceChild(tmp.firstChild, old);
  }

  function updateSummary(fk) {
    var d = $('lp-subjects').querySelector('details.lp-subject[data-fach="' + fk + '"] .lp-sum-count');
    if (!d) return;
    var s = subjectSummary(fk);
    d.className = 'lp-sum-count' + s.cls;
    d.textContent = s.text;
  }

  function addCustom(fk, details) {
    var inp = details.querySelector('[data-act="newtitle"]');
    var title = (inp.value || '').trim();
    if (!title) { inp.focus(); return; }
    var st = getSub(fk);
    st.custom.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), title: title, note: '', level: 2, important: false, selected: true });
    save();
    rerenderSubject(fk);
    var again = $('lp-subjects').querySelector('details.lp-subject[data-fach="' + fk + '"] [data-act="newtitle"]');
    if (again) again.focus();
    markStale();
  }

  /* ──────────────────────────────────────────────────────────
     EINSTUFUNGS-TEST (Wissen abfragen & Stufe 1–4 einschätzen)
     ────────────────────────────────────────────────────────── */
  function prettyMath(str) {
    var s = String(str == null ? '' : str);
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
    s = s.replace(/\\(?:text|mathrm|mathbf)\{([^{}]+)\}/g, '$1');
    s = s.replace(/\\Delta\b/g, 'Δ').replace(/\\alpha\b/g, 'α').replace(/\\beta\b/g, 'β').replace(/\\pi\b/g, 'π').replace(/\\infty\b/g, '∞');
    s = s.replace(/\\cdot\b/g, '·').replace(/\\times\b/g, '×').replace(/\\pm\b/g, '±').replace(/\\approx\b/g, '≈');
    s = s.replace(/\\neq\b/g, '≠').replace(/\\le(?:q)?\b/g, '≤').replace(/\\ge(?:q)?\b/g, '≥');
    s = s.replace(/\\(?:long)?rightarrow\b|\\to\b/g, '→').replace(/\\rightleftharpoons\b|\\leftrightarrow\b/g, '⇌');
    s = s.replace(/\^\\circ/g, '°').replace(/\\[,;!]/g, ' ');
    s = s.replace(/\$([^$]+)\$/g, '$1');
    s = s.replace(/\{([^{}]+)\}/g, '$1');
    return s.replace(/\s+/g, ' ').trim();
  }

  var FALLBACK_CARDS = {
    'mathe/analysis_j1_formelsammlung.html': [
      { tag: 'AFB I · Lernzettel-Check', q: 'Was gibt der Differenzenquotient (f(b) − f(a)) / (b − a) geometrisch an – und was die Ableitung f\'(x₀)?', a: 'Differenzenquotient = mittlere Änderungsrate (Sekantensteigung). Ableitung f\'(x₀) = momentane Änderungsrate (Tangentensteigung im Punkt P(x₀|f(x₀))).' },
      { tag: 'AFB I · Ableitungsregeln', q: 'Wie lauten Potenzregel, Faktorregel und die Ableitungen von sin(x) und cos(x)?', a: 'f(x) = xⁿ → f\'(x) = n·xⁿ⁻¹ · Konstanter Faktor bleibt erhalten · (sin x)\' = cos x · (cos x)\' = −sin x.' },
      { tag: 'AFB I–II · Tangente & Normale', q: 'Wie lautet die allgemeine Tangentengleichung und Normalengleichung an der Stelle u?', a: 'Tangente: y = f\'(u)·(x − u) + f(u) · Normale (senkrecht dazu): y = (−1/f\'(u))·(x − u) + f(u) mit m_t · m_n = −1.' },
      { tag: 'AFB II · Grafisches Ableiten (NEW-Regel)', q: 'Was passiert beim grafischen Ableiten (NEW-Regel) aus einem Extrempunkt (Hoch-/Tiefpunkt) und einem Wendepunkt von f im Graphen von f\'?', a: 'Extrempunkt von f → Nullstelle mit Vorzeichenwechsel bei f\' · Wendepunkt von f → Extrempunkt (lokales Maximum/Minimum der Steigung) bei f\'.' }
    ],
    'chemie/chemische-energetik.html': [
      { tag: 'AFB I · Reaktionsarten', q: 'Was bedeutet exotherm (ΔH < 0) und endotherm (ΔH > 0) für Wärmeabgabe und das Energiediagramm?', a: 'Exotherm (ΔH < 0): gibt Wärme an die Umgebung ab, Produkte liegen energetisch tiefer als Edukte. Endotherm (ΔH > 0): nimmt Wärme auf, Produkte liegen höher als Edukte.' },
      { tag: 'AFB I · Kalorimetrie-Grundformel', q: 'Mit welchen zwei Formeln berechnest du im Kalorimeter zuerst die Wärme Q und daraus die molare Reaktionsenthalpie Δ_R H_m?', a: '1) Q = m · c · ΔT (mit c_Wasser = 4,18 J/(g·K)) · 2) Δ_R H_m = −Q_Wasser / n (mit n = m/M und Vorzeichenwechsel!).' },
      { tag: 'AFB II · Satz von Hess', q: 'Was besagt der Satz von Hess und wie lautet die Formel zur Berechnung von Δ_R H_m aus Standardbildungsenthalpien Δ_f H°_m?', a: 'Die Reaktionsenthalpie hängt nur vom Anfangs- und Endzustand ab, nicht vom Weg: Δ_R H°_m = Summe Δ_f H°_m(Produkte) − Summe Δ_f H°_m(Edukte). Reine Elemente im Standardzustand haben Δ_f H°_m = 0.' },
      { tag: 'AFB II · Experiment-Check', q: 'Was ist der systematische Hauptfehler beim einfachen Becherglas-/Styropor-Kalorimeter und wie wirkt er sich auf den Messwert aus?', a: 'Wärmeverlust an die Umgebung (und Erwärmung des Gefäßes selbst) → gemessenes ΔT ist zu klein → berechneter Betrag von Δ_R H_m fällt kleiner aus als der Literaturwert.' }
    ],
    'deutsch/kurzprosa-interpretation.html': [
      { tag: 'AFB I · Klausur-Bauplan (7 Bausteine)', q: 'Aus welchen 7 Bausteinen besteht dein kompletter Klausur-Bauplan (inkl. der 4 Hauptteil-Blöcke)?', a: '1) Einleitung & Deutungshypothese (8–10 Min.) · 2) Strukturierte Inhaltsangabe in Sinnabschnitten (10–12 Min.) · 3) Block 1: Rahmen, Einstieg & Grundstimmung (15 Min.) · 4) Block 2: Hauptfigur & innerer Konflikt (25 Min.) · 5) Block 3: Figurenkonstellation & Kommunikation (25 Min.) · 6) Block 4: Wendepunkt, Titel & offener Schluss (15 Min.) · 7) Schluss/Fazit (10 Min.).' },
      { tag: 'AFB I–II · Werkzeugkasten A (Zeitgestaltung)', q: 'Worin unterscheiden sich Zeitdeckung, Zeitdehnung und Zeitraffung – und welche Wirkung haben sie im Aufsatz?', a: 'Zeitdeckung (Erzählzeit ≈ erzählte Zeit): Echtzeit, Unmittelbarkeit/quälende Stille · Zeitdehnung (Erzählzeit > erzählte Zeit): psychischer Hochdruck, Schock, Grübeln · Zeitraffung (Erzählzeit < erzählte Zeit): überspringt Belangloses, zeigt monotone Zeit.' },
      { tag: 'AFB II · Werkzeugkasten B (Perspektive & 15-P-Joker)', q: 'Wie unterscheidet man personales vs. neutrales Erzählverhalten – und woran erkennst du den 15-Punkte-Joker „Erlebte Rede“?', a: 'Personal = Innensicht einer Figur (Nähe/Subjektivität) · Neutral = Kamera-Auge/Außensicht (Kälte/Distanz, oft in Dialogen!). Erlebte Rede = 3. Person (Er/Sie) + Präteritum, aber in der Wortwahl/Stimmung der Figur (oft innere Fragen).' },
      { tag: 'AFB II–III · Block 3 & 4 (Kommunikation, Dingsymbol & Syntax)', q: 'Was untersucht man in Block 3 bei Dialogen (Kommunikationstheorie & Syntax) und welche Rolle spielen Dingsymbole in Block 4?', a: 'Block 3: Sachebene (Belanglosigkeiten) vs. Beziehungsebene (Entfremdung/Kontrolle, beredtes Schweigen) sowie Ellipsen, Aposiopese, Parallelismus. Block 4: Dingsymbol/Leitmotiv (z. B. Spiegel, Uhr, Kälte, zerknülltes Blatt) steht für den inneren Zustand/Resignation + Deutung von Titel & offenem Schluss.' }
    ],
    'gk/politisches-system-brd.html': [
      { tag: 'AFB I · Verfassungsprinzipien', q: 'Welche Staatsstrukturprinzipien legt Art. 20 GG fest und was schützt die Ewigkeitsklausel (Art. 79 Abs. 3 GG)?', a: 'Demokratie, Rechtsstaat, Sozialstaat, Bundesstaat, Republik (und Gewaltenteilung). Art. 79 Abs. 3 GG schützt Art. 1 (Menschenwürde) und Art. 20 GG vor jeder Verfassungsänderung.' },
      { tag: 'AFB I–II · Verfassungsorgane', q: 'Welche zentralen Aufgaben hat der Bundestag (und wie unterscheidet sich das konstruktive Misstrauensvotum Art. 67 GG von der Vertrauensfrage Art. 68 GG)?', a: 'Bundestag: Gesetzgebung, Wahl des Bundeskanzlers, Kontrolle der Regierung, Budgetrecht. Art. 67 GG: Bundestag wählt aktiv mit Mehrheit einen neuen Kanzler. Art. 68 GG: Kanzler stellt selbst die Vertrauensfrage.' }
    ]
  };

  function cleanCardText(el) {
    if (!el) return '';
    var clone = el.cloneNode(true);
    Array.prototype.forEach.call(clone.querySelectorAll('.flashcard-label, .formula-label'), function (n) {
      if (n.parentNode) n.parentNode.removeChild(n);
    });
    return prettyMath(clone.textContent || '');
  }

  function extractCardsFromHtml(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var root = doc.querySelector('.content-wrapper') || doc.body;
    if (!root) return [];
    var items = [];
    var seen = {};
    function add(tag, q, a) {
      q = prettyMath(q); a = prettyMath(a);
      if (!q || !a || q.length < 5 || a.length < 3 || q === a) return;
      var k = q.toLowerCase().slice(0, 60);
      if (seen[k]) return;
      seen[k] = 1;
      items.push({ tag: tag, q: q, a: a });
    }

    /* 1. Flashcards im Lernzettel */
    Array.prototype.forEach.call(root.querySelectorAll('.flashcard'), function (fc) {
      var fr = fc.querySelector('.flashcard-front');
      var bk = fc.querySelector('.flashcard-back');
      var q = cleanCardText(fr).replace(/^(?:Frage|Begriff)\s*[:\-–]?\s*/i, '');
      var a = cleanCardText(bk).replace(/^Antwort\s*[:\-–]?\s*/i, '');
      add('AFB I–II · Karteikarte aus deinem Lernzettel', q, a);
    });

    /* 2. Formel-Boxen */
    Array.prototype.forEach.call(root.querySelectorAll('.formula-box'), function (fb) {
      var lblEl = fb.querySelector('.formula-label');
      var label = lblEl ? prettyMath(lblEl.textContent) : '';
      if (!label && fb.previousElementSibling) {
        var prevTxt = prettyMath(fb.previousElementSibling.textContent || '');
        if (prevTxt.length >= 4 && prevTxt.length <= 90) label = prevTxt.replace(/:$/, '');
      }
      var formula = cleanCardText(fb);
      if (label && formula && formula.length >= 3 && formula.length <= 200) {
        add('AFB I · Formel / Gleichung aus deinem Lernzettel', 'Wie lautet die Formel bzw. Gleichung zu: „' + label + '“?', formula);
      }
    });

    /* 3. Tabellen-Zeilen */
    Array.prototype.forEach.call(root.querySelectorAll('table'), function (tbl) {
      var ths = tbl.querySelectorAll('th');
      var th0 = ths.length ? prettyMath(ths[0].textContent) : '';
      var colCount = ths.length;
      Array.prototype.forEach.call(tbl.querySelectorAll('tr'), function (tr) {
        var tds = tr.querySelectorAll('td');
        if (tds.length < 2) return;
        if (colCount && tds.length !== colCount) return; /* überspringt verschobene rowspan-Folgezeilen */
        var c0 = prettyMath(tds[0].textContent);
        var rest = [];
        for (var i = 1; i < tds.length; i++) {
          var txt = prettyMath(tds[i].textContent);
          if (txt) rest.push(txt);
        }
        var ans = rest.join(' · ');
        if (c0.length >= 3 && c0.length <= 65 && ans.length >= 10 && ans.length <= 260) {
          add('AFB I–II · Übersicht aus deinem Lernzettel', 'Erkläre kurz bzw. gib an' + (th0 ? ' (' + th0 + ')' : '') + ': „' + c0 + '“', ans);
        }
      });
    });

    /* 4. Hervorgehobene Schlüsselbegriffe in Merksätzen / Listen */
    if (items.length < 6) {
      Array.prototype.forEach.call(root.querySelectorAll('li, p'), function (el) {
        if (el.closest('table, .flashcard, .formula-box, nav, .page-footer')) return;
        var hl = el.querySelector('.highlight, strong');
        if (!hl) return;
        var term = prettyMath(hl.textContent).replace(/[:–\-]+$/, '').trim();
        var full = prettyMath(el.textContent);
        if (term.length >= 4 && term.length <= 48 && full.length >= term.length + 18 && full.length <= 250) {
          add('AFB I–II · Schlüsselbegriff aus deinem Lernzettel', 'Was gilt im Zusammenhang mit „' + term + '“?', full);
        }
      });
    }

    /* Gleichmäßig 4 Fragen über den gesamten Lernzettel auswählen */
    if (items.length <= 4) return items;
    var picked = [];
    for (var i = 0; i < 4; i++) {
      var idx = Math.min(items.length - 1, Math.floor(i * items.length / 4));
      picked.push(items[idx]);
    }
    return picked;
  }

  function buildTopicQuestions(fk, topic) {
    var opsII = LT.getOperatorNames(fk, 'II', 4) || 'erläutern, analysieren, berechnen';
    var opsIII = LT.getOperatorNames(fk, 'III', 4) || 'beurteilen, erörtern, begründen';
    var afbII = LT.getAfbDescription(fk, 'II') || 'Selbstständiges Erklären, Verknüpfen und Anwenden auf bekannte Zusammenhänge.';
    var afbIII = LT.getAfbDescription(fk, 'III') || 'Transfer auf neue Problemstellungen, eigenständige Begründung und kriteriengeleitete Beurteilung.';
    var zusatz = (getSub(fk).zusatz || '').trim();

    var checkQuestions = [
      {
        tag: 'AFB II · Klausur-Anwendung (' + opsII + ')',
        q: 'Anwendungs-Check zu „' + topic.title + '“: Könntest du jetzt sofort (ohne Spicken auf dem Lernzettel!) eine typische Klausuraufgabe im ' + LT.AFB_LABELS.II + ' (Operatoren z. B. ' + opsII + ') vollständig und mit sauberer Fachsprache lösen?',
        a: 'Kriterium für ' + LT.AFB_LABELS.II + ' in ' + fachName(fk) + ': ' + afbII + (FACH_TIPS[fk] ? ' Wichtig: ' + FACH_TIPS[fk] : '')
      },
      {
        tag: 'AFB III · 15-Punkte-Transfer (' + opsIII + ')',
        q: 'Transfer-Check zu „' + topic.title + '“: Traust du dir auch eine ungewohnte Transfer-, Begründungs- oder Urteilsaufgabe im ' + LT.AFB_LABELS.III + ' (Operatoren z. B. ' + opsIII + ') inklusive Sonderfällen und typischen Klausurfallen sicher zu?',
        a: 'Kriterium für ' + LT.AFB_LABELS.III + ' (13–15 Punkte): ' + afbIII + (zusatz ? ' Denke dabei auch an dein eingetragenes Zusatzwissen!' : '')
      }
    ];

    function finalize(contentCards) {
      if (!contentCards || !contentCards.length) {
        if (FALLBACK_CARDS[topic.link]) {
          contentCards = FALLBACK_CARDS[topic.link].slice();
        } else {
          contentCards = [
            {
              tag: 'AFB I · Active Recall (Grundbegriffe)',
              q: 'Nenne aus dem Kopf die 3–5 wichtigsten Fachbegriffe, Definitionen oder Grundregeln zum Thema „' + topic.title + '“.',
              a: 'Prüfe ehrlich: Konntest du die zentralen Begriffe und Definitionen flüssig und fachsprachlich präzise erklären, ohne erst nachsehen zu müssen?' + (topic.note ? ' (' + topic.note + ')' : '')
            },
            {
              tag: 'AFB I–II · Vorgehen / Struktur / Formeln',
              q: 'Erkläre laut in eigenen Worten (Feynman-Check): Welche Formeln, Gesetze, Argumentationsschritte oder Analysemethoden braucht man bei „' + topic.title + '“?',
              a: 'Prüfe ehrlich: Sitzt das Schritt-für-Schritt-Vorgehen auswendig oder musstest du bei einzelnen Schritten/Formeln noch raten?'
            },
            {
              tag: 'AFB II · Typische Klausurfalle',
              q: 'Was ist bei „' + topic.title + '“ der häufigste Fehler in Klausuren – und worauf musst du besonders achten?',
              a: (FACH_TIPS[fk] || 'Achte auf präzise Fachsprache, vollständige Herleitung/Begründung und die genaue Beachtung des Operators.') + (zusatz ? ' Zusatzwissen: ' + zusatz.slice(0, 180) : '')
            }
          ];
        }
      }
      return contentCards.concat(checkQuestions);
    }

    if (!topic.link) return Promise.resolve(finalize([]));
    return fetch(topic.link)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (html) { return finalize(extractCardsFromHtml(html)); })
      .catch(function () { return finalize([]); });
  }

  function scoreToLevel(pct) {
    if (pct < 30) return 1;
    if (pct < 60) return 2;
    if (pct < 85) return 3;
    return 4;
  }

  function levelPlanExplanation(lv) {
    switch (lv) {
      case 1: return 'Der Lernplaner plant für dich <b>3 Erarbeitungs-Einheiten</b> (Feynman-Methode + Aktiv-Vertiefung) und <b>3 Übungs-Einheiten</b> (AFB I → II → III) ein.';
      case 2: return 'Der Lernplaner plant <b>2 Erarbeitungs-Einheiten</b> zum Lückenschließen und <b>3 aufbauende Übungs-Einheiten</b> (AFB I → II → III) ein.';
      case 3: return 'Die Grundlagen sitzen! Der Planer plant nur noch <b>1 kurze Vertiefung</b> und geht direkt in <b>2 Klausur-Übungseinheiten (Fokus AFB II &amp; III)</b>.';
      case 4: return 'Stark! Du sparst dir das Grundlagentraining und bekommst gezielte <b>AFB-III- &amp; Klausur-Mix-Einheiten</b> plus Spaced Repetition für sichere 15 Punkte.';
    }
    return '';
  }

  function openDiagnosticModal(fk, topicsList) {
    if (!topicsList || !topicsList.length) {
      toast('Füge zuerst ein Thema hinzu.');
      return;
    }
    var overlay = document.createElement('div');
    overlay.className = 'modal show';
    overlay.style.zIndex = '25000';
    overlay.innerHTML =
      '<div class="modal-content" style="max-width: 640px;">' +
        '<button class="modal-close" aria-label="Schließen">&times;</button>' +
        '<div id="lp-diag-body"><p class="modal-desc">Lade Einstufungs-Fragen …</p></div>' +
      '</div>';
    document.body.appendChild(overlay);

    var body = overlay.querySelector('#lp-diag-body');
    var tIdx = 0;
    var qIdx = 0;
    var questions = [];
    var points = 0;
    var maxPoints = 0;
    var results = []; /* { topic, pct, level } */

    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      rerenderSubject(fk);
      markStale();
    }
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    function startTopic(idx) {
      tIdx = idx;
      qIdx = 0;
      points = 0;
      maxPoints = 0;
      var topic = topicsList[tIdx];
      body.innerHTML = '<h2 class="modal-title">🎯 Einstufungs-Test: ' + esc(topic.title) + '</h2>' +
        '<p class="modal-desc">Stelle Fragen aus deinem Lernzettel und den BW-Anforderungsbereichen zusammen …</p>';
      buildTopicQuestions(fk, topic).then(function (qs) {
        questions = qs;
        renderQuestion();
      });
    }

    function renderQuestion() {
      var topic = topicsList[tIdx];
      var q = questions[qIdx];
      var totalTopics = topicsList.length;
      var h = '';
      if (totalTopics > 1) {
        h += '<div style="font-size:0.78rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-secondary);font-weight:700;margin-bottom:2px;">Thema ' + (tIdx + 1) + ' von ' + totalTopics + ' · ' + esc(fachName(fk)) + '</div>';
      }
      h += '<h2 class="modal-title" style="margin-bottom:4px;">🎯 ' + esc(topic.title) + '</h2>';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.84rem;color:var(--text-secondary);margin-bottom:8px;">';
      h += '<span>Frage <b>' + (qIdx + 1) + '</b> von <b>' + questions.length + '</b></span>';
      if (topic.link) h += '<span style="color:var(--forest);">✓ Aus deinem Lernzettel &amp; BW-Operatoren</span>';
      h += '</div>';
      h += '<div class="lp-progress" style="height:8px;margin-bottom:12px;"><div style="width:' + Math.round((qIdx / questions.length) * 100) + '%"></div></div>';

      h += '<div class="lp-diag-card">';
      h += '<span class="lp-diag-tag">' + esc(q.tag) + '</span>';
      h += '<div class="lp-diag-q">' + esc(q.q) + '</div>';
      h += '<p class="lp-hint" id="lp-diag-think" style="margin:0;">💭 Überlege dir die Antwort kurz im Kopf (oder stichpunktartig) und decke dann die Lösung auf.</p>';
      h += '<div class="lp-diag-sol" id="lp-diag-sol" style="display:none;"><b>Lösung / Prüfkriterium:</b><br>' + esc(q.a) + '</div>';
      h += '</div>';

      h += '<div id="lp-diag-reveal-wrap" style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:12px;">';
      h += '<button type="button" class="btn btn-gold" data-diag="reveal" style="flex:1;">👁️ Lösung aufdecken &amp; einschätzen</button>';
      if (totalTopics > 1) {
        h += '<button type="button" class="btn btn-outline" data-diag="skip-topic" style="width:auto;">Thema überspringen</button>';
      }
      h += '</div>';

      h += '<div id="lp-diag-rate-wrap" style="display:none;margin-top:12px;">';
      h += '<div style="font-size:0.85rem;font-weight:700;color:var(--forest);margin-bottom:4px;">Wie gut hättest du das ohne Hilfe gewusst?</div>';
      h += '<div class="lp-diag-rates">';
      h += '<button type="button" class="lp-diag-rate r0" data-diag="rate" data-pts="0"><b>❌ Wusste ich nicht</b><span>0 Punkte · Noch neu / große Lücke</span></button>';
      h += '<button type="button" class="lp-diag-rate r1" data-diag="rate" data-pts="1"><b>〰️ Teilweise / unsicher</b><span>1 Punkt · Ungefähr, aber unvollständig</span></button>';
      h += '<button type="button" class="lp-diag-rate r2" data-diag="rate" data-pts="2"><b>✅ Saß sofort &amp; komplett</b><span>2 Punkte · Präzise &amp; klausurreif</span></button>';
      h += '</div></div>';

      body.innerHTML = h;
    }

    function finishTopic() {
      var topic = topicsList[tIdx];
      var pct = maxPoints ? Math.round((points / maxPoints) * 100) : 50;
      var lv = scoreToLevel(pct);
      var lvObj = LEVELS[lv - 1];

      /* Automatisch im Thema speichern & Thema aktivieren */
      setTopic(fk, topic.key, 'level', lv);
      setTopic(fk, topic.key, 'selected', true);
      results.push({ topic: topic, pct: pct, level: lv });

      var h = '<h2 class="modal-title">Ergebnis: ' + esc(topic.title) + '</h2>';
      h += '<p class="modal-desc">Du hast <b>' + points + ' von ' + maxPoints + ' Punkten (' + pct + ' %)</b> erreicht. Die Website hat deine Stufe automatisch eingetragen und das Thema ausgewählt:</p>';
      h += '<div class="lp-diag-card" style="text-align:center;">';
      h += '<div style="font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-secondary);">Eingeschätzte Lernstufe</div>';
      h += '<div class="lp-diag-badge lv' + lv + '">' + lv + '/4 · ' + esc(lvObj.label) + '</div>';
      h += '<p style="font-size:0.9rem;color:var(--text-primary);margin:6px 0 10px;">' + levelPlanExplanation(lv) + '</p>';
      h += '<div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:6px;">Möchtest du die Stufe von Hand anpassen?</div>';
      h += '<div class="lp-levels" style="justify-content:center;">';
      LEVELS.forEach(function (l) {
        h += '<label><input type="radio" name="diag-override" value="' + l.v + '" data-diag="override" data-val="' + l.v + '"' + (l.v === lv ? ' checked' : '') + '>';
        h += '<span class="lv' + l.v + '">' + esc(l.label) + '</span></label>';
      });
      h += '</div></div>';

      h += '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;margin-top:14px;">';
      h += '<button type="button" class="btn btn-outline" data-diag="ai-test" style="width:auto;font-size:0.85rem;">🤖 Zusätzlich Live-Test-Prompt für Gemini kopieren</button>';
      if (tIdx + 1 < topicsList.length) {
        h += '<button type="button" class="btn btn-gold" data-diag="next-topic" style="width:auto;">Weiter: ' + esc(topicsList[tIdx + 1].title) + ' →</button>';
      } else {
        h += '<button type="button" class="btn btn-gold" data-diag="done" style="width:auto;">Übernehmen &amp; fertig ✓</button>';
      }
      h += '</div>';

      body.innerHTML = h;
    }

    body.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-diag]');
      if (!btn) return;
      var act = btn.getAttribute('data-diag');
      if (act === 'reveal') {
        var sol = body.querySelector('#lp-diag-sol');
        var rev = body.querySelector('#lp-diag-reveal-wrap');
        var rate = body.querySelector('#lp-diag-rate-wrap');
        var think = body.querySelector('#lp-diag-think');
        if (sol) sol.style.display = '';
        if (think) think.style.display = 'none';
        if (rev) rev.style.display = 'none';
        if (rate) rate.style.display = '';
      } else if (act === 'rate') {
        var pts = +btn.getAttribute('data-pts') || 0;
        points += pts;
        maxPoints += 2;
        qIdx++;
        if (qIdx < questions.length) renderQuestion();
        else finishTopic();
      } else if (act === 'skip-topic') {
        if (tIdx + 1 < topicsList.length) startTopic(tIdx + 1);
        else close();
      } else if (act === 'override') {
        var newLv = +btn.getAttribute('data-val');
        var topic = topicsList[tIdx];
        setTopic(fk, topic.key, 'level', newLv);
        if (results.length) results[results.length - 1].level = newLv;
        var badge = body.querySelector('.lp-diag-badge');
        if (badge) {
          badge.className = 'lp-diag-badge lv' + newLv;
          badge.textContent = newLv + '/4 · ' + LEVELS[newLv - 1].label;
        }
        toast('Stufe auf „' + LEVELS[newLv - 1].label + '“ angepasst.');
      } else if (act === 'next-topic') {
        startTopic(tIdx + 1);
      } else if (act === 'ai-test') {
        var t = topicsList[tIdx];
        var prompt = 'Du bist meine Fachlehrkraft für ' + fachName(fk) + ' (Oberstufe Baden-Württemberg). ' +
          'Führe mit mir einen kurzen Einstufungstest zum Thema „' + t.title + '“ durch: ' +
          'Stelle mir nacheinander 4 kurze Fragen (von AFB I bis AFB III), warte jeweils auf meine Antwort, korrigiere sie kurz und empfiehl mir am Ende eine Lernstufe: ' +
          '1 = Neu, 2 = Unsicher, 3 = Grundlagen sitzen, 4 = Sicher (auch AFB III). Starte jetzt direkt mit Frage 1!';
        LT.copyToClipboard(prompt).then(function (ok) {
          if (ok) toast('Einstufungs-Prompt kopiert! Neuer Gemini-Chat → Strg+V.', true);
        });
      } else if (act === 'done') {
        close();
        toast('Einstufung gespeichert ✓');
      }
    });

    startTopic(0);
  }

  /* ──────────────────────────────────────────────────────────
     ÜBUNGSBLÄTTER HOCHLADEN (PDF / TXT / BILD) & KI-PROMPTS
     ────────────────────────────────────────────────────────── */
  var pdfJsPromise = null;
  function ensurePdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfJsPromise) return pdfJsPromise;
    pdfJsPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = function () {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(window.pdfjsLib);
        } else reject(new Error('pdf.js nicht verfügbar'));
      };
      s.onerror = function () { pdfJsPromise = null; reject(new Error('pdf.js konnte nicht geladen werden')); };
      document.head.appendChild(s);
    });
    return pdfJsPromise;
  }

  function readPdfFile(file) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function () {
        var buf = reader.result;
        ensurePdfJs()
          .then(function (pdfjs) { return pdfjs.getDocument({ data: buf }).promise; })
          .then(function (pdf) {
            var maxP = Math.min(pdf.numPages, 25);
            var chain = Promise.resolve('');
            for (var p = 1; p <= maxP; p++) {
              (function (pageNo) {
                chain = chain.then(function (acc) {
                  return pdf.getPage(pageNo).then(function (page) {
                    return page.getTextContent();
                  }).then(function (tc) {
                    var pageTxt = (tc.items || []).map(function (it) { return it.str || ''; }).join(' ').replace(/\s+/g, ' ').trim();
                    return acc + (pageTxt ? (acc ? '\n\n' : '') + '[Seite ' + pageNo + '] ' + pageTxt : '');
                  });
                });
              })(p);
            }
            return chain.then(function (full) {
              var trimmed = full.slice(0, 25000).trim();
              resolve({ text: trimmed, pages: pdf.numPages, isScan: trimmed.length < 20 });
            });
          })
          .catch(function () {
            resolve({ text: '', pages: 0, isScan: true });
          });
      };
      reader.onerror = function () { resolve({ text: '', pages: 0, isScan: true }); };
      reader.readAsArrayBuffer(file);
    });
  }

  function readTextFile(file) {
    return new Promise(function (resolve) {
      var reader = new FileReader();
      reader.onload = function () {
        var txt = String(reader.result || '').slice(0, 25000).trim();
        resolve({ text: txt, pages: 1, isScan: !txt });
      };
      reader.onerror = function () { resolve({ text: '', pages: 0, isScan: true }); };
      reader.readAsText(file);
    });
  }

  function handleFilesUpload(fk, fileList) {
    if (!fileList || !fileList.length) return;
    var st = getSub(fk);
    var filesArr = Array.prototype.slice.call(fileList);
    toast('Lese ' + filesArr.length + (filesArr.length === 1 ? ' Übungsblatt' : ' Übungsblätter') + ' ein …');

    Promise.all(filesArr.map(function (file) {
      var name = file.name || 'Übungsblatt';
      var lower = name.toLowerCase();
      var p;
      if (lower.slice(-4) === '.pdf' || file.type === 'application/pdf') {
        p = readPdfFile(file);
      } else if (lower.slice(-4) === '.txt' || lower.slice(-3) === '.md' || (file.type && file.type.indexOf('text/') === 0)) {
        p = readTextFile(file);
      } else {
        p = Promise.resolve({ text: '', pages: 1, isScan: true });
      }
      return p.then(function (res) {
        return {
          id: 'f_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
          name: name,
          text: res.text || '',
          pages: res.pages || 0,
          isScan: !!res.isScan
        };
      });
    })).then(function (entries) {
      entries.forEach(function (en) { st.files.push(en); });
      save();
      rerenderSubject(fk);
      markStale();
      var extractedCount = entries.filter(function (e) { return e.text && e.text.length >= 20; }).length;
      if (extractedCount === entries.length) {
        toast('Übungsblatt gespeichert & Text erfolgreich ausgelesen! ✓');
      } else {
        toast('Übungsblatt gespeichert! (Bei Scans/Fotos einfach in Gemini per + anhängen oder über „✏️ Text“ einfügen.)');
      }
    });
  }

  function findFile(fk, fid) {
    var st = getSub(fk);
    var list = st.files || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === fid) return list[i];
    return null;
  }

  function openFileEditModal(fk, fid) {
    var fl = findFile(fk, fid);
    if (!fl) return;
    var overlay = document.createElement('div');
    overlay.className = 'modal show';
    overlay.style.zIndex = '25000';
    overlay.innerHTML =
      '<div class="modal-content" style="max-width: 600px;">' +
        '<button class="modal-close" aria-label="Schließen">&times;</button>' +
        '<h2 class="modal-title">📄 ' + esc(fl.name) + '</h2>' +
        '<p class="modal-desc">Hier siehst du den ausgelesenen Text deines Übungsblatts. Falls es ein Foto/Scan ohne Text war, kannst du hier optional Aufgabenstellungen reinkopieren – oder die Datei später direkt in Gemini per <b>+</b> anhängen.</p>' +
        '<div class="form-group" style="margin:12px 0;">' +
          '<label>Aufgabentext / Notizen zum Übungsblatt</label>' +
          '<textarea class="form-control" id="lp-file-text-inp" rows="9" placeholder="Ausgelesener Text oder eigene Aufgaben-Notizen …">' + esc(fl.text || '') + '</textarea>' +
        '</div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
          '<button type="button" class="btn btn-outline" data-act="cancel">Abbrechen</button>' +
          '<button type="button" class="btn btn-gold" data-act="save" style="width:auto;">Speichern</button>' +
        '</div>' +
      '</div>';

    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { close(); return; }
      var b = e.target.closest('[data-act]');
      if (!b) return;
      if (b.getAttribute('data-act') === 'cancel') close();
      else if (b.getAttribute('data-act') === 'save') {
        fl.text = (overlay.querySelector('#lp-file-text-inp').value || '').trim();
        fl.isScan = !fl.text;
        save();
        rerenderSubject(fk);
        close();
        toast('Text zum Übungsblatt gespeichert ✓');
      }
    });
    document.body.appendChild(overlay);
  }

  function copyFilePrompt(fk, fid, mode) {
    var fl = findFile(fk, fid);
    if (!fl) { toast('Übungsblatt nicht gefunden.'); return; }
    var st = getSub(fk);
    var hasTxt = !!(fl.text && fl.text.trim());
    var ops = ['I', 'II', 'III'].map(function (a) { return LT.AFB_LABELS[a] + ': ' + LT.getOperatorNames(fk, a, 6); }).join('\n');
    var p = 'Du bist meine Fachlehrkraft für ' + fachName(fk) + ' (Oberstufe Baden-Württemberg, Ziel: 15 Notenpunkte).\n\n';

    if (fk === 'deutsch') {
      if (mode === 'twin') {
        p += 'AUFGABE (DEUTSCH-AUFSATZTRAINING): Erstelle mir passend zu meinem hochgeladenen Text/Arbeitsblatt „' + fl.name + '“ eine NEUE, vergleichbare Übungs-Kurzgeschichte (bzw. einen Primärtext im gleichen Stil & Schwierigkeitsgrad, durchgehend alle 5 Zeilen mit [Z. 5], [Z. 10] … nummeriert) sowie EINE authentische baden-württembergische Aufsatz-Aufgabenstellung.\n';
        p += '• Gib zuerst nur den neuen Text (mit Zeilennummern) und die Aufsatz-Aufgabenstellung an.\n';
        p += '• Gib darunter (hinter einer deutlichen Trennlinie) einen strukturierten Erwartungshorizont UND einen vollständig ausformulierten 15-Punkte-Musteraufsatz (Einleitung mit TATTE & Deutungshypothese → Inhaltsangabe im Konjunktiv I → aspektorientierter Hauptteil im 15-Punkte-Dreischritt → Schluss) an.\n';
      } else {
        p += 'AUFGABE (DEUTSCH-MUSTERAUFSATZ & INTERPRETATIONSHILFE): Hilf mir beim Interpretieren meines hochgeladenen Textes/Übungsblatts „' + fl.name + '“.\n';
        p += '• Erstelle zuerst einen übersichtlichen Schreibplan (Sinnabschnitte, zentrale Deutungshypothese, Analysestern zu Erzähltechnik, Figuren/Kommunikation & Sprache/Symbolik).\n';
        p += '• Schreibe danach einen vollständig ausformulierten **15-Punkte-Musteraufsatz im Fließtext** (Einleitung mit Aufhänger, TATTE & Deutungshypothese → Inhaltsangabe im Präsens & Konjunktiv I → aspektorientierter Hauptteil im 15-Punkte-Dreischritt [Form → Zitat + Zeile → Deutung] → abiturreifer Schluss).\n';
        p += '• Wenn ich dir gleich meinen eigenen Aufsatz mitschicke, korrigiere ihn Satz für Satz nach BW-Maßstab (0–15 Punkte).\n';
      }
    } else if (mode === 'twin') {
      p += 'AUFGABE: Erstelle mir zu meinem Übungsblatt „' + fl.name + '“ neue PARALLELAUFGABEN (Zwillingsaufgaben) auf exakt demselben Niveau, im selben Aufgabenstil und mit denselben Operatoren.\n';
      p += '• Gib zuerst nur die neuen Aufgabenstellungen (mit Punktzahl/AFB) an.\n';
      p += '• Gib erst ganz am Ende (deutlich abgetrennt) einen vollständigen, kleinschrittigen Erwartungshorizont auf 15-Punkte-Niveau an.\n';
    } else {
      p += 'AUFGABE: Hilf mir beim Bearbeiten meines Übungsblatts „' + fl.name + '“.\n';
      p += '• Erstelle zu jeder Aufgabe auf dem Blatt eine vollständige, kleinschrittige 15-Punkte-Musterlösung (inkl. Lösungsweg, Fachbegriffen und Erklärung typischer Klausurfallen).\n';
      p += '• Wenn ich dir gleich meine eigenen Lösungen mitschicke, korrigiere sie streng nach BW-Maßstab und erkläre mir jeden Fehler.\n';
    }

    if (ops.replace(/AFB I+: /g, '').trim()) {
      p += '\nOffizielle Operatoren in ' + fachName(fk) + ' (Baden-Württemberg):\n' + ops + '\n';
    }
    if (st.zusatz && st.zusatz.trim()) {
      p += '\nMein Zusatzwissen aus dem Unterricht:\n' + st.zusatz.trim() + '\n';
    }
    if (hasTxt) {
      p += '\n=== INHALT DES HOCHGELADENEN ÜBUNGSBLATTS (' + fl.name + ') ===\n' + fl.text.trim() + '\n';
    } else {
      p += '\n=== HINWEIS ZUM ÜBUNGSBLATT (' + fl.name + ') ===\nIch hänge das Übungsblatt „' + fl.name + '“ als PDF oder Bild direkt an diese Nachricht an. Bitte lies alle Aufgaben/Texte daraus ab!\n';
    }

    LT.copyToClipboard(p).then(function (ok) {
      if (!ok) return;
      if (hasTxt) {
        toast('Prompt inkl. Übungsblatt-Text kopiert! Neuer Gemini-Chat → Strg+V.', true);
      } else {
        toast('Prompt kopiert! Neuer Gemini-Chat → Strg+V + Datei „' + fl.name + '“ über + anhängen.', true);
      }
    });
  }

  function initSubjectEvents() {
    var box = $('lp-subjects');

    box.addEventListener('change', function (e) {
      var t = e.target, act = t.getAttribute('data-act');
      if (!act) return;
      var det = t.closest('details.lp-subject');
      if (!det) return;
      var fk = det.getAttribute('data-fach'), key = t.getAttribute('data-key'), st = getSub(fk);
      if (act === 'sel') { setTopic(fk, key, 'selected', t.checked); rerenderSubject(fk); }
      else if (act === 'lvl') { setTopic(fk, key, 'level', +t.value); }
      else if (act === 'exam') { st.exam = t.value; save(); updateSummary(fk); }
      else if (act === 'sim') { st.simMinutes = +t.value; save(); }
      else if (act === 'file-upload') { handleFilesUpload(fk, t.files); t.value = ''; return; }
      else return;
      markStale();
    });

    box.addEventListener('input', function (e) {
      var t = e.target;
      if (t.getAttribute('data-act') !== 'zusatz') return;
      var fk = t.closest('details.lp-subject').getAttribute('data-fach');
      getSub(fk).zusatz = t.value;
      save();
    });

    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'file-upload') return; /* wird über change behandelt */
      var det = b.closest('details.lp-subject');
      if (!det) return;
      var fk = det.getAttribute('data-fach'), key = b.getAttribute('data-key');
      var fid = b.getAttribute('data-fid');
      if (act === 'star') {
        var on = !b.classList.contains('lp-on');
        setTopic(fk, key, 'important', on);
        b.classList.toggle('lp-on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        markStale();
      } else if (act === 'test-topic') {
        var tp = findTopic(fk, key);
        if (tp) openDiagnosticModal(fk, [tp]);
      } else if (act === 'test-fach') {
        var allT = subjTopics(fk);
        var selT = allT.filter(function (x) { return x.selected; });
        openDiagnosticModal(fk, selT.length ? selT : allT);
      } else if (act === 'file-solve') {
        copyFilePrompt(fk, fid, 'solve');
      } else if (act === 'file-twin') {
        copyFilePrompt(fk, fid, 'twin');
      } else if (act === 'file-edit') {
        openFileEditModal(fk, fid);
      } else if (act === 'file-del') {
        var stf = getSub(fk);
        stf.files = (stf.files || []).filter(function (fl) { return fl.id !== fid; });
        save();
        rerenderSubject(fk);
        markStale();
        toast('Übungsblatt entfernt.');
      } else if (act === 'del') {
        var st = getSub(fk), id = key.slice(2);
        st.custom = st.custom.filter(function (c) { return String(c.id) !== id; });
        save();
        rerenderSubject(fk);
        markStale();
      } else if (act === 'add') {
        addCustom(fk, det);
      } else if (act === 'reset-fach') {
        state.settings.subjects[fk] = { topics: {}, custom: [], files: [], exam: '', simMinutes: defaultSimMin(fk), zusatz: '' };
        save();
        rerenderSubject(fk);
        markStale();
        toast(fachName(fk) + ' zurückgesetzt.');
      }
    });

    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.getAttribute('data-act') === 'newtitle') {
        e.preventDefault();
        var det = e.target.closest('details.lp-subject');
        addCustom(det.getAttribute('data-fach'), det);
      }
    });
  }

  /* ──────────────────────────────────────────────────────────
     SCHRITT 2 – Lernzeit
     ────────────────────────────────────────────────────────── */
  function renderTime() {
    var s = state.settings;
    $('lp-start').value = s.start;
    $('lp-block').value = String(s.block);
    $('lp-weekdays').innerHTML = WD.map(function (w, i) {
      return '<label>' + w + '<input type="number" class="form-control" min="0" max="720" step="15" data-wd="' + i + '" value="' + (s.minutes[i] || 0) + '" aria-label="Minuten am ' + w + '"></label>';
    }).join('');
    updateWeekSum();
  }

  function updateWeekSum() {
    var s = state.settings;
    var total = s.minutes.reduce(function (a, b) { return a + b; }, 0);
    var blocks = s.minutes.reduce(function (a, m) { return a + Math.floor(m / s.block); }, 0);
    $('lp-week-sum').textContent = total
      ? 'Zusammen ' + fmtMin(total) + ' pro Woche ≈ ' + blocks + ' Lerneinheiten à ' + s.block + ' Min.'
      : 'Trage mindestens an einem Tag Lernzeit ein.';
  }

  function initTimeEvents() {
    $('lp-start').addEventListener('change', function () {
      if (validDate(this.value)) { state.settings.start = this.value; save(); }
    });
    $('lp-block').addEventListener('change', function () {
      state.settings.block = +this.value; save(); updateWeekSum(); markStale();
    });
    $('lp-weekdays').addEventListener('input', function (e) {
      var i = e.target.getAttribute('data-wd');
      if (i == null) return;
      var v = Math.max(0, Math.min(720, parseInt(e.target.value, 10) || 0));
      state.settings.minutes[+i] = v;
      save(); updateWeekSum(); markStale();
    });
  }

  /* ──────────────────────────────────────────────────────────
     PLANUNG (Fachspezifisch + Hochgeladene Übungsblätter)
     ────────────────────────────────────────────────────────── */
  function buildQueue(t, fk) {
    if (t.isFile) {
      var fid = 'U|' + fk + '|' + t.key + '|1';
      return state.done[fid] ? [] : [{ type: 'U', n: 1, of: 1, afb: 'FILE' }];
    }
    var prof = getProfile(fk);
    var L = t.level;
    var eN = prof.eN[L - 1];
    var uN = prof.uN[L - 1] + (t.important ? 1 : 0);
    var seq = L <= 2 ? ['I', 'II', 'III', 'MIX', 'III', 'MIX'] : ['II', 'III', 'MIX', 'III', 'MIX'];
    var q = [], i;
    for (i = 0; i < eN; i++) q.push({ type: 'E', n: i + 1, of: eN });
    for (i = 0; i < uN; i++) q.push({ type: 'U', n: i + 1, of: uN, afb: seq[i] || 'III' });
    return q.filter(function (task) {
      return !state.done[task.type + '|' + fk + '|' + t.key + '|' + task.n];
    });
  }

  function collectSubjects(start) {
    var subs = [], errors = [];
    Object.keys(subjectData).forEach(function (fk) {
      var topics = subjTopics(fk).filter(function (t) { return t.selected; });
      var st = getSub(fk);
      var files = st.files || [];
      if (!topics.length && !files.length) return;
      if (!validDate(st.exam)) { errors.push('Trage für ' + fachName(fk) + ' einen Klausurtermin ein.'); return; }
      if (diff(start, st.exam) < 1) { errors.push('Der Klausurtermin in ' + fachName(fk) + ' liegt nicht nach dem Planstart (' + fmtShort(start) + ') – Termin ändern oder Themen abwählen.'); return; }
      var sub = { fk: fk, st: st, exam: st.exam, topics: [], remaining: 0, vCount: 0 };
      topics.forEach(function (tp) {
        var t = {
          uid: fk + '|' + tp.key, key: tp.key, title: tp.title, link: tp.link, note: tp.note,
          level: tp.level, important: tp.important, sub: sub, ptr: 0, anchor: null, isFile: false
        };
        t.queue = buildQueue(t, fk);
        sub.remaining += t.queue.length;
        sub.topics.push(t);
      });
      /* Hochgeladene Übungsblätter als eigene Übungs-Einheiten einplanen */
      files.forEach(function (fl) {
        var fKey = 'file:' + fl.id;
        var ft = {
          uid: fk + '|' + fKey, key: fKey, fileId: fl.id, title: '📄 Übungsblatt: ' + fl.name,
          link: '', note: '', level: 2, important: true, sub: sub, ptr: 0, anchor: null, isFile: true
        };
        ft.queue = buildQueue(ft, fk);
        sub.remaining += ft.queue.length;
        sub.topics.push(ft);
      });
      subs.push(sub);
    });
    return { subs: subs, errors: errors };
  }

  function schedule(start, subs, keepDays) {
    var s = state.settings, block = s.block;
    var rdur = 15; /* Wiederholung: kurz & knackig (Blurting + Anki) */
    var warnings = [];

    var lastExam = subs.reduce(function (m, x) { return x.exam > m ? x.exam : m; }, start);
    var n = diff(start, lastExam) + 1;
    var days = [], i;
    for (i = 0; i < n; i++) {
      var date = addDays(start, i);
      days.push({ date: date, cap: s.minutes[wdIdx(date)] || 0, used: 0, sessions: [] });
    }
    subs.forEach(function (sub) {
      sub.examIdx = diff(start, sub.exam);
      var ed = days[sub.examIdx];
      if (ed) ed.cap = Math.floor(ed.cap / 2); /* am Klausurtag nur halbe Lernzeit für andere Fächer */
    });

    var pre = [0];
    days.forEach(function (d, k) { pre.push(pre[k] + Math.floor(d.cap / block)); });
    function avail(a, b) { return b <= a ? 0 : pre[b] - pre[a]; }

    /* --- Klausursimulation, Fehleranalyse, letzter Tag --- */
    subs.sort(function (a, b) { return a.examIdx - b.examIdx; });
    var usedSim = {};

    function pickSim(sub) {
      var e = sub.examIdx;
      if (e < 2) return -1;
      var lo = Math.max(0, e - 6), hi = e - 3;
      if (hi < lo) { hi = e - 2; lo = Math.max(0, e - 3); }
      var best = -1, bc = -1, k;
      for (k = lo; k <= hi; k++) {
        var c = usedSim[k] ? -1 : days[k].cap;
        if (c > bc) { bc = c; best = k; }
      }
      if (bc > 0) return best;
      var bd = 1e9; best = -1;
      for (k = 0; k <= e - 2; k++) {
        if (days[k].cap > 0 && !usedSim[k]) {
          var dd = Math.abs(k - (e - 4));
          if (dd < bd) { bd = dd; best = k; }
        }
      }
      if (best >= 0) return best;
      for (k = 0; k <= e - 2; k++) if (days[k].cap > 0) return k;
      warnings.push('Für die Klausur-Simulation in ' + fachName(sub.fk) + ' gibt es keinen Tag mit Lernzeit – sie liegt jetzt am ' + fmtDay(days[hi].date) + '. Plane dafür bitte extra Zeit ein.');
      return hi;
    }

    subs.forEach(function (sub) {
      sub.finalIdx = sub.examIdx - 1;
      sub.simIdx = -1;
      sub.fehlerIdx = -1;
      if (!state.done['SIM|' + sub.fk]) {
        sub.simIdx = pickSim(sub);
        if (sub.simIdx < 0) warnings.push('Bis zur Klausur in ' + fachName(sub.fk) + ' ist zu wenig Zeit für eine Klausur-Simulation. Rechne stattdessen in den Übungseinheiten mit Zeitlimit.');
        else usedSim[sub.simIdx] = true;
      }
      if (sub.simIdx >= 0 && !state.done['FEHLER|' + sub.fk]) {
        for (var k = sub.simIdx + 1; k < sub.finalIdx; k++) if (days[k].cap > 0) { sub.fehlerIdx = k; break; }
        if (sub.fehlerIdx < 0 && sub.simIdx + 1 < sub.finalIdx) sub.fehlerIdx = sub.simIdx + 1;
      }
      sub.learnEnd = sub.simIdx >= 0 ? sub.simIdx : Math.max(0, sub.finalIdx);
      sub.reviewEnd = Math.max(0, sub.finalIdx);
      sub.total = sub.remaining;
      sub.windowBlocks = avail(0, sub.learnEnd);
      if (sub.examIdx < 7) warnings.push('Nur noch ' + sub.examIdx + ' Tag(e) bis zur Klausur in ' + fachName(sub.fk) + '. Konzentriere dich auf ★-Themen und schwache Themen – setze sichere Themen auf „Sicher“, damit Zeit frei wird.');
    });

    /* --- Wiederholungen (Spaced Repetition) --- */
    var reviews = [], droppedR = 0;
    function makeReviews(t, d0) {
      var overdue = null;
      REVIEW_OFFSETS.forEach(function (off, k) {
        var id = 'R|' + t.sub.fk + '|' + t.key + '|' + (k + 1);
        if (state.done[id]) return;
        var due = d0 + off;
        if (due >= t.sub.reviewEnd) return;
        if (due < 0) { overdue = { id: id, n: k + 1 }; return; }
        reviews.push({ t: t, id: id, n: k + 1, due: due });
      });
      if (overdue) reviews.push({ t: t, id: overdue.id, n: overdue.n, due: 0 });
    }

    /* Bei Neuplanung: Ankerdatum aus bereits erledigten Einheiten übernehmen */
    var anchorDates = {};
    (keepDays || []).forEach(function (day) {
      day.sessions.forEach(function (x) {
        if ((x.type === 'E' || x.type === 'U') && state.done[x.id]) {
          var uid = x.fk + '|' + x.key;
          if (!anchorDates[uid] || day.date < anchorDates[uid]) anchorDates[uid] = day.date;
        }
      });
    });

    var topicsAll = [];
    subs.forEach(function (sub) {
      sub.topics.forEach(function (t) {
        topicsAll.push(t);
        if (anchorDates[t.uid]) { t.anchor = diff(start, anchorDates[t.uid]); makeReviews(t, t.anchor); }
      });
    });

    function mk(type, sub, t, o) {
      var id;
      if (type === 'E' || type === 'U') id = type + '|' + sub.fk + '|' + t.key + '|' + o.n;
      else if (type === 'R') id = o.id;
      else if (type === 'V') id = 'V|' + sub.fk + '|' + t.key + '|' + o.date;
      else id = type + '|' + sub.fk;
      return {
        id: id, type: type, fk: sub.fk, key: t ? t.key : '', title: t ? t.title : '',
        link: t ? t.link : '', note: t ? t.note : '', afb: o.afb || '', min: o.min,
        n: o.n || 0, of: o.of || 0, optional: !!o.optional
      };
    }
    function add(day, x) { day.sessions.push(x); day.used += x.min; }

    function pickV(d) {
      var cand = subs.filter(function (sub) {
        return d < sub.finalIdx && d !== sub.simIdx && d !== sub.fehlerIdx && sub.topics.some(function (t) { return !t.isFile; });
      });
      if (!cand.length) return null;
      var sub = cand[0]; /* nächste Klausur zuerst (subs ist nach Termin sortiert) */
      var sorted = sub.topics.filter(function (t) { return !t.isFile; }).sort(function (a, b) {
        return (a.level - b.level) || ((b.important ? 1 : 0) - (a.important ? 1 : 0));
      });
      var t = sorted[sub.vCount % sorted.length];
      sub.vCount++;
      return mk('V', sub, t, { min: block, afb: 'III', optional: true, date: days[d].date });
    }

    /* --- Tag für Tag verplanen --- */
    for (var d = 0; d < days.length; d++) {
      var day = days[d];
      var tToday = {}, eToday = {}, lastKey = null, lastFk = null, learned = 0;

      subs.forEach(function (sub) {
        if (d === sub.simIdx) add(day, mk('SIM', sub, null, { min: +sub.st.simMinutes || 90 }));
        if (d === sub.fehlerIdx) add(day, mk('FEHLER', sub, null, { min: block }));
        if (d === sub.finalIdx && !state.done['FINAL|' + sub.fk]) add(day, mk('FINAL', sub, null, { min: 30 }));
      });

      var due = reviews.filter(function (r) { return !r.placed && !r.dropped && r.due <= d; });
      due.forEach(function (r) {
        if (d >= r.t.sub.reviewEnd || d - r.due > 3) { r.dropped = true; droppedR++; }
      });
      due = due.filter(function (r) { return !r.dropped; }).sort(function (a, b) { return a.due - b.due; });

      var revCap = day.cap >= rdur ? Math.max(rdur, day.cap * 0.5) : 0, revUsed = 0;
      var placeReview = function (r) {
        if (r.placed || day.cap <= 0) return;
        var urgent = d - r.due >= 2; /* Puffer fast aufgebraucht → darf leicht überziehen */
        var limit = day.cap + (urgent ? 15 : 0);
        if (day.used + rdur <= limit && (urgent || revUsed + rdur <= revCap)) {
          add(day, mk('R', r.t.sub, r.t, { id: r.id, n: r.n, min: rdur }));
          r.placed = true;
          revUsed += rdur;
        }
      };
      var reserve = Math.min(revCap, due.length * rdur);

      /* Lerneinheiten (Erarbeiten / Üben) */
      while (true) {
        var free = day.cap - day.used;
        if (free < block) break;
        if (learned > 0 && free - reserve < block) break;
        var best = null, bs = -1e9;
        for (var ti = 0; ti < topicsAll.length; ti++) {
          var t = topicsAll[ti], sub = t.sub;
          if (t.ptr >= t.queue.length || d >= sub.learnEnd) continue;
          if ((tToday[t.uid] || 0) >= 2) continue;
          var task = t.queue[t.ptr];
          if (task.type === 'E' && eToday[t.uid]) continue;
          /* Pacing: nicht zu weit vorarbeiten – Stoff bis ca. 75 % der Lernphase gleichmäßig verteilen */
          var paceTarget = Math.ceil(sub.total * Math.min(1, avail(0, d + 1) / Math.max(1, 0.75 * sub.windowBlocks))) + 1;
          if (sub.total - sub.remaining >= paceTarget) continue;
          var urg = sub.remaining / Math.max(0.5, avail(d, sub.learnEnd));
          var sc = urg * 2 + (1 - t.ptr / t.queue.length) * 0.3 + (4 - t.level) * 0.08 + (t.important ? 0.15 : 0);
          if (lastKey === t.uid) sc -= 1;
          if (tToday[t.uid]) sc -= 0.4;
          if (lastFk === sub.fk) sc -= 0.25;
          if (sc > bs) { bs = sc; best = t; }
        }
        if (!best) break;
        var tk = best.queue[best.ptr];
        best.ptr++;
        best.sub.remaining--;
        add(day, mk(tk.type, best.sub, best, { min: block, n: tk.n, of: tk.of, afb: tk.afb }));
        tToday[best.uid] = (tToday[best.uid] || 0) + 1;
        if (tk.type === 'E') eToday[best.uid] = 1;
        lastKey = best.uid; lastFk = best.sub.fk; learned++;
        if (best.anchor === null && !best.isFile) { best.anchor = d; makeReviews(best, d); }
      }

      due.forEach(placeReview);

      if (day.cap - day.used >= block) {
        var v = pickV(d);
        if (v) add(day, v);
      }
    }

    /* --- Warnungen --- */
    subs.forEach(function (sub) {
      if (sub.remaining > 0) {
        warnings.push(fachName(sub.fk) + ': ' + sub.remaining + ' Lerneinheit(en) (≈ ' + fmtMin(sub.remaining * block) + ') passen nicht mehr in den Plan. Erhöhe deine Lernzeit, starte früher oder stufe sichere Themen höher ein.');
      }
    });
    if (droppedR > 0) {
      warnings.push(droppedR + ' Wiederholung(en) fanden keinen Platz. Etwas mehr Lernzeit an einzelnen Tagen (oder kürzere Einheiten) macht dein Wissen nachhaltiger.');
    }
    var extraPerWeek = subs.reduce(function (a, sub) {
      return a + sub.remaining * block / Math.max(1, sub.learnEnd / 7);
    }, 0);
    if (extraPerWeek > 0) {
      var extra = Math.ceil(extraPerWeek / 15) * 15;
      warnings.push('Tipp: Mit ungefähr ' + fmtMin(extra) + ' mehr Lernzeit pro Woche würde alles in den Plan passen.');
    }

    return {
      days: days.map(function (x) { return { date: x.date, cap: x.cap, sessions: x.sessions }; }),
      warnings: warnings
    };
  }

  function generate() {
    var err = $('lp-error');
    err.textContent = '';
    var s = state.settings;
    var today = todayStr();
    var start = s.start > today ? s.start : today;

    if (!s.minutes.some(function (m) { return m >= s.block; })) {
      err.textContent = 'Trage an mindestens einem Wochentag so viel Lernzeit ein, dass eine ganze Lerneinheit (' + s.block + ' Min.) hineinpasst.';
      return;
    }
    var c = collectSubjects(start);
    if (c.errors.length) { err.textContent = c.errors.join(' '); return; }
    if (!c.subs.length) { err.textContent = 'Wähle in Schritt 1 mindestens ein Thema oder lade ein Übungsblatt hoch.'; return; }

    /* vergangene Tage eines bestehenden Plans behalten */
    var keep = [];
    if (state.plan && state.plan.days) {
      keep = state.plan.days.filter(function (d) { return d.date < today; });
      keep.forEach(function (d) {
        d.sessions.forEach(function (x) {
          if (!state.done[x.id] && x.type !== 'SIM' && x.type !== 'FEHLER' && x.type !== 'FINAL') x.missed = true;
        });
      });
    }

    var res = schedule(start, c.subs, keep);

    /* heute bereits abgehakte Einheiten im heutigen Tag behalten */
    if (state.plan && state.plan.days && res.days.length && res.days[0].date === today) {
      var oldToday = state.plan.days.filter(function (d) { return d.date === today; })[0];
      if (oldToday) {
        var ids = {};
        res.days[0].sessions.forEach(function (x) { ids[x.id] = 1; });
        var keptDone = oldToday.sessions.filter(function (x) { return state.done[x.id] && !ids[x.id]; });
        res.days[0].sessions = keptDone.concat(res.days[0].sessions);
      }
    }
    var exams = c.subs.map(function (sub) { return { fk: sub.fk, date: sub.exam }; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; });

    state.plan = {
      created: today,
      start: keep.length ? keep[0].date : start,
      days: keep.concat(res.days),
      exams: exams,
      warnings: res.warnings,
      sig: settingsSig()
    };
    save();
    setupVisible(false);
    renderPlan();
    var r = $('lp-result');
    if (r.scrollIntoView) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast('Dein Lernplan ist fertig – viel Erfolg! 🌿');
  }

  /* ──────────────────────────────────────────────────────────
     Texte zu den Einheiten (Fachspezifisch!)
     ────────────────────────────────────────────────────────── */
  var DEUTSCH_BAUSTEIN_LABELS = {
    I:   'Baustein 1–3: Einleitung, Inhaltsangabe & Block 1 (Rahmen/Einstieg)',
    II:  'Hauptteil Block 2 (Hauptfigur/Innenwelt) & Block 3 (Dialog/Kommunikation)',
    III: 'Hauptteil Block 4 (Wendepunkt/Titel/Schluss) & Fazit',
    MIX: 'Kompletter Aufsatz nach dem 7-Schritte-Bauplan'
  };

  function sessionTypeLabel(x) {
    if (x.fk === 'deutsch') {
      if (x.type === 'E') return 'Aufsatz-Handwerk';
      if (x.type === 'U') return x.afb === 'FILE' ? 'Eigener Text' : (x.afb === 'MIX' ? 'Aufsatz-Training' : 'Schreibtraining');
      if (x.type === 'SIM') return 'Probe-Aufsatz (Klausur)';
      if (x.type === 'FEHLER') return 'Aufsatz-Lektorat';
    }
    return TYPE_LABEL[x.type] || x.type;
  }

  function methodText(x) {
    var prof = getProfile(x.fk);
    var tip = FACH_TIPS[x.fk] ? ' ' + FACH_TIPS[x.fk] : '';
    var z = getSub(x.fk).zusatz.trim() ? ' Denk auch an dein Zusatzwissen.' : '';
    switch (x.type) {
      case 'E':
        return (x.n === 1 ? prof.e1 : prof.e2) + z;
      case 'U':
        if (x.afb === 'FILE') {
          if (x.fk === 'deutsch') {
            return '<b>Eigenen Text / eigenes Arbeitsblatt interpretieren:</b> Lies deinen hochgeladenen Text gründlich, markiere Sinnabschnitte &amp; Stilmittel und schreibe deine Interpretation (oder Gliederung + Hauptteil-Absätze) zuerst selbst. Nutze danach die Buttons unten für den <b>15-Punkte-Musteraufsatz</b> oder eine <b>neue Übungs-Kurzgeschichte</b>.';
          }
          return '<b>Eigenes Übungsblatt bearbeiten:</b> Löse die Aufgaben deines hochgeladenen Übungsblatts zuerst komplett selbstständig ohne Spicken (wie in der Klausur). Nutze danach die Buttons unten, um dir von Gemini die 15-Punkte-Musterlösung erklären zu lassen oder neue Parallelaufgaben im gleichen Stil zu generieren.';
        }
        var uSpec = prof['u' + x.afb] || prof.uMIX || '';
        if (x.fk === 'deutsch') {
          return uSpec + '<br><b>Kontrolle:</b> Vergleiche deinen geschriebenen Text danach mit dem <b>15-Punkte-Musteraufsatz</b> von Gemini (oder schick deinen Text direkt in den Chat, damit Gemini ihn Satz für Satz korrigiert!).';
        }
        var a = '';
        if (x.afb === 'MIX') {
          a = uSpec;
        } else {
          a = uSpec + '<br><span style="font-size:0.84rem;color:var(--text-secondary);"><b>' + LT.AFB_LABELS[x.afb] + ' (' + esc(fachName(x.fk)) + '):</b> ' + esc(LT.getAfbDescription(x.fk, x.afb));
          var ops = LT.getOperatorNames(x.fk, x.afb, 6);
          if (ops) a += ' · <i>Operatoren: ' + esc(ops) + '</i>';
          a += '</span>';
        }
        return a + '<br><b>Kontrolle:</b> Erst ohne Hilfsmittel lösen, dann mit dem Erwartungshorizont abgleichen und jeden Fehler im Fehlerprotokoll notieren.' + esc(tip);
      case 'R':
        return prof.r + z;
      case 'SIM':
        if (x.fk === 'deutsch') {
          return '<b>Generalprobe – Einen ganzen Aufsatz unter Klausurbedingungen schreiben (' + fmtMin(x.min) + ' am Stück):</b> Handy weg, nur Stift, Papier &amp; die Kurzgeschichte aus dem KI-Prompt!<br>' +
            '1. <b>Vorarbeit (ca. 15–20 Min.):</b> Kurzgeschichte 2× lesen, Sinnabschnitte, Wendepunkt &amp; Sprachbilder am Rand markieren, Schreibplan (Analysestern) + zentrale Deutungshypothese notieren.<br>' +
            '2. <b>Ganzen Aufsatz im Fließtext schreiben:</b> Einleitung (Aufhänger + TATTE + Deutungshypothese) → Inhaltsangabe (Präsens &amp; Konjunktiv I) → aspektorientierter Hauptteil im <b>15-Punkte-Dreischritt (Form → Zitat mit Zeile → Deutung)</b> → Schluss (Fazit, Rückbezug zur Hypothese, Ausblick) + 10 Min. Sprach- &amp; Komma-Check am Ende!';
        }
        return '<b>Wie im Ernstfall:</b> ' + fmtMin(x.min) + ' am Stück, nur erlaubte Hilfsmittel, Handy in einen anderen Raum. Erst danach die Lösungen ansehen und dich ehrlich mit Notenpunkten bewerten. Notiere, wo dir Zeit gefehlt hat.';
      case 'FEHLER':
        if (x.fk === 'deutsch') {
          return '<b>Aufsatz-Lektorat &amp; 15-Punkte-Feinschliff:</b> Lass deinen Probe-Aufsatz von Gemini nach BW-Abiturmaßstab (60 % Inhalt / 40 % Sprache &amp; Ausdruck) korrigieren. Prüfe gezielt: Sitzt der TATTE-Basissatz + Deutungshypothese? Ist die Inhaltsangabe strikt im Präsens &amp; Konjunktiv I? Hast du im Hauptteil wirklich überall den <b>Dreischritt (Form → Zitat + Zeile → Deutung)</b> eingehalten statt nachzuerzählen? Formuliere deine 2–3 schwächsten Absätze mit deinen starken Analyse-Verben noch einmal neu!';
        }
        return '<b>Aus Fehlern Punkte machen:</b> Gehe Simulation und Fehlerprotokoll durch und sortiere jeden Fehler: Wissenslücke · Operator nicht erfüllt · Flüchtigkeit · Zeitproblem. Für jede Wissenslücke eine Anki-Karte, dann die 1–2 schwächsten Themen gezielt nachüben.';
      case 'FINAL':
        if (x.fk === 'deutsch') {
          return '<b>Letzter Check vor dem Aufsatz:</b> Überfliege noch einmal deinen Aufsatz-Bauplan (TATTE, Konjunktiv-I-Formen, 15-Punkte-Dreischritt, Schulz von Thun / Watzlawick) und deine besten Formulierungshilfen/Analyse-Verben. Kein neuer Stoff mehr – Stifte &amp; Textmarker einpacken und früh schlafen!';
        }
        return '<b>Nur noch leicht wiederholen:</b> Lernzettel überfliegen, Fehlerprotokoll und Anki-Karten durchgehen. Kein neuer Stoff! Materialien packen, etwas Schönes machen und früh schlafen – im Schlaf festigt sich das Gelernte.';
      case 'V':
        if (x.fk === 'deutsch') {
          return '<b>Puffer / 15-Punkte-Schreibtraining:</b> Hast du eine Einheit verpasst? Hol sie jetzt nach. Ist alles erledigt: Übe an einer anspruchsvollen Kurzgeschichte das Entschlüsseln von Leerstellen (Eisberg-Modell) und Dingsymbolen im Dreischritt – genau diese Tiefendeutung bringt 14–15 Punkte!';
        }
        return '<b>Puffer:</b> Hast du eine Einheit verpasst? Hol sie jetzt nach. Ist alles erledigt: AFB-III-Aufgaben zu diesem Thema – genau dort entscheidet sich der Unterschied zwischen 12 und 15 Punkten.';
    }
    return '';
  }

  function metaText(x) {
    var p = [fmtMin(x.min)];
    if (x.type === 'E' && x.of > 1) p.push('Einheit ' + x.n + '/' + x.of);
    if (x.type === 'U') {
      if (x.afb === 'FILE') p.push(x.fk === 'deutsch' ? 'Eigener Übungstext / Arbeitsblatt' : 'Eigenes Übungsblatt');
      else if (x.fk === 'deutsch' && DEUTSCH_BAUSTEIN_LABELS[x.afb]) p.push(DEUTSCH_BAUSTEIN_LABELS[x.afb]);
      else p.push(x.afb === 'MIX' ? 'Klausur-Mix' : LT.AFB_LABELS[x.afb]);
    }
    if (x.type === 'R') p.push(x.n + '. Wiederholung (Spaced Repetition)');
    if (x.optional) p.push('optional');
    return p.join(' · ');
  }

  function deepLink(tool, x, afb) {
    var u = 'index.html?tool=' + tool + '&fach=' + encodeURIComponent(x.fk);
    if (x.link) u += '&topic=' + encodeURIComponent(x.link);
    if (afb) u += '&afb=' + afb;
    return u;
  }

  function toolsHtml(x) {
    var h = '', k = ' data-fach="' + esc(x.fk) + '" data-key="' + esc(x.key) + '"';
    var lz = x.link ? '<a class="lp-tool" href="' + esc(x.link) + '" target="_blank" rel="noopener">Lernzettel</a><a class="lp-tool" href="' + esc(x.link) + '?pdf=1" target="_blank" rel="noopener" title="Lernzettel direkt als PDF speichern">📄 PDF</a>' : '';
    var anki = x.link ? '<a class="lp-tool" href="' + esc(deepLink('anki', x)) + '" target="_blank" rel="noopener">Anki-Karten</a>' : '';
    var isDe = x.fk === 'deutsch';
    function quiz(afb, label) {
      return '<button type="button" class="lp-tool lp-tool-gold" data-act="quiz" data-afb="' + afb + '"' + k + '>' + label + '</button>';
    }
    if (x.type === 'U' && x.afb === 'FILE' && x.key && x.key.indexOf('file:') === 0) {
      var fid = esc(x.key.slice(5));
      var fkAttr = ' data-fach="' + esc(x.fk) + '" data-fid="' + fid + '"';
      h = '<button type="button" class="lp-tool lp-tool-gold" data-act="file-solve"' + fkAttr + '>' + (isDe ? '📄 15-P-Musteraufsatz &amp; Schreibplan (KI)' : '📄 Musterlösung &amp; Erklärung (KI)') + '</button>' +
          '<button type="button" class="lp-tool lp-tool-gold" data-act="file-twin"' + fkAttr + '>' + (isDe ? '🔁 Neue Übungs-Kurzgeschichte generieren' : '🔁 Parallelaufgaben generieren') + '</button>' +
          GEMINI_LINK;
      return '<div class="lp-s-tools">' + h + '</div><div class="lp-s-hint">💬 Neuer Chat → Prompt einfügen (bei einem Scan/Foto die Datei in Gemini über + anhängen).</div>';
    }
    switch (x.type) {
      case 'E':
        h = lz + quiz('I', isDe ? '✍️ Übungs-Kurzgeschichte + Einstieg kopieren' : 'Verständnis-Quiz kopieren') + anki;
        if (x.n === 1 && x.link) h += '<a class="lp-tool" href="' + esc(deepLink('notebook', x)) + '" target="_blank" rel="noopener">NotebookLM</a>';
        break;
      case 'U':
        if (isDe) {
          var deBtnLbl = x.afb === 'I'   ? '✍️ Kurzgeschichte + Training: Einleitung &amp; Inhaltsangabe kopieren'
                       : x.afb === 'II'  ? '✍️ Kurzgeschichte + Training: Hauptteil im Dreischritt kopieren'
                       : x.afb === 'III' ? '✍️ Kurzgeschichte + Training: Tiefendeutung &amp; Schluss kopieren'
                       : '📝 Übungs-Kurzgeschichte + kompletter Aufsatz-Auftrag kopieren';
          h = quiz(x.afb, deBtnLbl) + lz;
        } else {
          h = quiz(x.afb, (x.afb === 'MIX' ? 'Klausur-Mix' : LT.AFB_LABELS[x.afb]) + '-Aufgaben kopieren') + lz;
        }
        break;
      case 'R': h = anki + quiz('MIX', isDe ? '📝 Kurzgeschichte + Aufsatz-Training kopieren' : 'Mini-Test kopieren') + lz; break;
      case 'V': h = quiz('III', isDe ? '✍️ Kurzgeschichte + Tiefendeutungs-Training kopieren' : 'AFB-III-Aufgaben kopieren') + lz; break;
      case 'SIM': h = quiz('SIM', isDe ? '📝 Deutsch-Klausur (Kurzgeschichte + Aufsatz-Auftrag) kopieren' : 'Klausur-Prompt kopieren'); break;
      case 'FEHLER': h = '<button type="button" class="lp-tool lp-tool-gold" data-act="fehler"' + k + '>' + (isDe ? '🔍 Aufsatz-Korrektur &amp; 15-Punkte-Lektorat kopieren' : 'Fehleranalyse-Prompt kopieren') + '</button>'; break;
      case 'FINAL': h = '<a class="lp-tool" href="index.html?tool=anki&fach=' + encodeURIComponent(x.fk) + '" target="_blank" rel="noopener">Anki</a>'; break;
    }
    var hint = AI_HINTS[x.type];
    if (isDe && x.type === 'SIM') {
      hint = '💬 Neuer Chat → Prompt einfügen. Gemini gibt dir eine Kurzgeschichte mit Zeilennummern + 1 Aufsatz-Auftrag (und darunter den 15-P-Musteraufsatz). Chat für die Aufsatz-Korrektur offen lassen!';
    } else if (isDe && x.type === 'FEHLER') {
      hint = '💬 Im Chat deines Probe-Aufsatzes weiterschreiben → Prompt einfügen + deinen geschriebenen Aufsatz anhängen (abgetippt oder als Foto deiner Handschrift).';
    }
    if (hint) h += GEMINI_LINK;
    return h ? '<div class="lp-s-tools">' + h + '</div>' + (hint ? '<div class="lp-s-hint">' + hint + '</div>' : '') : '';
  }

  /* Kurz-Anleitung pro KI-Prompt: neuer Chat? Was muss ich dazugeben? */
  var AI_HINTS = {
    E: '💬 Neuer Chat → Prompt einfügen. Mehr musst du nicht dazugeben. Schick deine Antworten in denselben Chat, dann korrigiert Gemini sie.',
    U: '💬 Neuer Chat → Prompt einfügen. Mehr musst du nicht dazugeben (Lernzettel, hochgeladene Übungsblätter & Zusatzwissen sind schon drin).',
    R: '💬 Neuer Chat → Prompt einfügen. Mehr musst du nicht dazugeben.',
    V: '💬 Neuer Chat → Prompt einfügen. Mehr musst du nicht dazugeben.',
    SIM: '💬 Neuer Chat → Prompt einfügen. Aufgaben auf Papier lösen, erst danach Lösungen lesen. Chat offen lassen – du brauchst ihn für die Fehleranalyse!',
    FEHLER: '💬 Im Chat der Klausur-Simulation weiterschreiben → Prompt einfügen + deine Lösungen anhängen (abgetippt oder als Foto).'
  };

  /* ──────────────────────────────────────────────────────────
     PLAN-ANSICHT
     ────────────────────────────────────────────────────────── */
  function countable(x) { return !x.optional && !x.missed; }

  function progress() {
    var total = 0, done = 0;
    (state.plan ? state.plan.days : []).forEach(function (d) {
      d.sessions.forEach(function (x) {
        if (!countable(x)) return;
        total++;
        if (state.done[x.id]) done++;
      });
    });
    return { total: total, done: done, pct: total ? Math.round(done / total * 100) : 0 };
  }

  function updateProgress() {
    var p = progress();
    var bar = $('lp-prog-bar'), lab = $('lp-prog-label');
    if (bar) bar.style.width = p.pct + '%';
    if (lab) lab.textContent = p.done + ' von ' + p.total + ' Einheiten erledigt (' + p.pct + ' %)' + (p.pct === 100 ? ' – großartig! 🎉' : '');
  }

  function renderSession(x, past) {
    var done = !!state.done[x.id];
    var subTitle = (x.type === 'SIM' || x.type === 'FEHLER' || x.type === 'FINAL')
      ? (x.fk === 'deutsch'
          ? (x.type === 'SIM' ? 'Ganzen Aufsatz schreiben (z. B. Kurzgeschichte interpretieren)'
             : x.type === 'FEHLER' ? 'Aufsatz-Korrektur & 15-Punkte-Feinschliff'
             : 'Aufsatz-Checkliste & Formulierungshilfen')
          : 'alle Themen')
      : esc(x.title);
    var title = esc(fachName(x.fk)) + ' · ' + subTitle;
    var h = '<div class="lp-session' + (done ? ' lp-done' : '') + '" data-id="' + esc(x.id) + '">';
    if (x.missed) h += '<span title="verpasst" style="width:20px;text-align:center;color:var(--text-light);">–</span>';
    else h += '<input type="checkbox" data-act="done" data-id="' + esc(x.id) + '"' + (done ? ' checked' : '') + ' aria-label="Erledigt">';
    h += '<div class="lp-s-main">';
    h += '<div class="lp-s-title"><span class="lp-s-type lp-t-' + x.type + '">' + esc(sessionTypeLabel(x)) + '</span>' + title + '</div>';
    h += '<div class="lp-s-meta">' + esc(metaText(x)) + (x.missed ? ' · verpasst → ' + ((x.type === 'E' || x.type === 'U') ? 'neu eingeplant' : 'übersprungen') : '') + '</div>';
    if (!past) {
      h += '<div class="lp-s-method">' + methodText(x) + '</div>';
      h += toolsHtml(x);
    }
    h += '</div></div>';
    return h;
  }

  function renderPlan() {
    var box = $('lp-result');
    var p = state.plan;
    if (!p || !p.days || !p.days.length) { box.innerHTML = ''; setupVisible(true); return; }

    var today = todayStr();
    var examsByDate = {};
    (p.exams || []).forEach(function (e) { (examsByDate[e.date] = examsByDate[e.date] || []).push(e.fk); });

    var minutes = 0, sessions = 0;
    p.days.forEach(function (d) { d.sessions.forEach(function (x) { if (countable(x)) { sessions++; minutes += x.min; } }); });
    var nextExam = (p.exams || []).filter(function (e) { return e.date >= today; })[0];
    var topicCount = {};
    p.days.forEach(function (d) { d.sessions.forEach(function (x) { if (x.key) topicCount[x.fk + '|' + x.key] = 1; }); });
    var fks = (p.exams || []).map(function (e) { return fachName(e.fk); });
    var lastDate = p.days[p.days.length - 1].date;
    var inRange = today >= p.days[0].date && today <= lastDate;

    var h = '<section class="lp-summary">';
    h += '<h2>Dein Lernplan: ' + esc(state.name || 'Lernplan') + '</h2>';
    h += '<p class="lp-step-desc">' + fmtDay(p.days[0].date) + ' – ' + fmtDay(lastDate) + ' · ' + esc(fks.join(', ')) + '</p>';
    h += '<div class="lp-stats">';
    h += '<div class="lp-stat"><b>' + sessions + '</b><span>Einheiten</span></div>';
    h += '<div class="lp-stat"><b>' + Math.round(minutes / 60) + '</b><span>Lernstunden</span></div>';
    h += '<div class="lp-stat"><b>' + Object.keys(topicCount).length + '</b><span>Themen / Blätter</span></div>';
    if (nextExam) h += '<div class="lp-stat"><b>' + diff(today, nextExam.date) + '</b><span>Tage bis ' + esc(fachName(nextExam.fk)) + '</span></div>';
    h += '</div>';
    h += '<div class="lp-progress"><div id="lp-prog-bar" style="width:0%"></div></div><p id="lp-prog-label" class="lp-progress-label"></p>';
    h += '<div id="lp-stale"></div>';

    (p.warnings || []).forEach(function (w) { h += '<div class="lp-box lp-warn">' + esc(w) + '</div>'; });

    h += '<details class="lp-strategy"><summary>⚙️ Wie wurde dieser Lernplan erstellt (ohne lokale KI)?</summary><ul>';
    h += '<li><b>Mathematischer Planungs-Algorithmus:</b> Dein Kalender wird direkt im Browser von einem fest programmierten Algorithmus berechnet – ganz ohne externe KI.</li>';
    h += '<li><b>Fachspezifisch angepasst:</b> In <b>Mathe</b> plant er mehr Rechen- &amp; Anwendungs-Einheiten, in <b>Deutsch</b> ein aufbauendes <b>Aufsatz-Schreibtraining</b> (TATTE-Einleitung → Inhaltsangabe → Hauptteil im 15-P-Dreischritt → ganzer Probe-Aufsatz zu einer Kurzgeschichte), in <b>Chemie</b> Teilchenebene + Gleichungen + Rechnungen und in <b>GK/Geschichte/Bio</b> aktives Auswendiglernen + Materialanalyse &amp; Urteilsbildung.</li>';
    h += '<li><b>Eigene Übungsblätter inklusive:</b> Hochgeladene PDFs/Arbeitsblätter werden als eigene Übungseinheiten eingeplant und automatisch in deine KI-Prompts integriert.</li>';
    h += '</ul></details>';

    h += '<details class="lp-strategy"><summary>Wer sieht meinen Plan? Wird er gespeichert?</summary><ul>';
    h += '<li><b>Nur du.</b> Der Plan wird nur in <i>diesem</i> Browser auf <i>diesem</i> Gerät gespeichert (Browser-Speicher) – nicht auf GitHub und auf keinem Server. Wer deine Website öffnet, sieht nur einen eigenen, leeren Planer.</li>';
    h += '<li><b>Bleibt gespeichert</b>, auch wenn du die Seite schließt. <b>Weg ist er</b>, wenn du die Browserdaten löschst oder im Inkognito-Modus bist. Auf Handy und PC hast du jeweils einen eigenen Plan.</li>';
    h += '<li><b>Tipp:</b> Über <b>„📤 Plan exportieren / Backup“</b> kannst du ihn jederzeit als PDF, Kalender, Text/Checkliste, Excel-Tabelle oder Backup-Datei (zum Übertragen aufs Handy/Tablet) speichern.</li>';
    h += '<li><b>KI:</b> Was du in Gemini einfügst (Lernzettel, Übungsblätter, Zusatzwissen), geht an Google und landet in deinem Gemini-Verlauf – schreib also nichts Privates hinein.</li>';
    h += '</ul></details>';

    h += '<details class="lp-strategy"><summary>So nutzt du die KI-Prompts</summary><ul>';
    h += '<li><b>Quiz, Übungsaufgaben, Klausur-Simulation:</b> Für jeden Prompt einen <b>neuen Chat</b> – sonst vermischt Gemini alte Themen. Du musst nichts dazugeben: Lernzettel, Operatoren, hochgeladene PDF-Texte und dein Zusatzwissen stecken schon im Prompt.</li>';
    h += '<li><b>Fehleranalyse:</b> Im <b>gleichen Chat</b> wie die Simulation weiterschreiben und deine Lösungen dazugeben (abgetippt oder als Foto).</li>';
    h += '<li><b>KI-Coach:</b> Lege dafür <b>einen eigenen Chat</b> an und behalte ihn. Kopiere einmal pro Woche den aktuellen Coach-Prompt neu hinein. Danach schreibst du z. B. „Start: Chemische Energetik“ und wirst abgefragt.</li>';
    h += '<li>Der Kopieren-Button legt den Prompt in die Zwischenablage → „Gemini öffnen“ → <b>Strg+V</b> (Handy: lange tippen → Einfügen).</li>';
    h += '</ul></details>';

    h += '<details class="lp-strategy"><summary>Warum ist der Plan so aufgebaut? (Lernstrategien)</summary><ul>';
    h += '<li><b>Spaced Repetition:</b> Jedes Thema wird nach 1, 3, 7, 14 … Tagen wiederholt – kurz bevor du es vergessen würdest. So landet es im Langzeitgedächtnis.</li>';
    h += '<li><b>Active Recall:</b> Abrufen statt Lesen (Blurting, Quiz, Anki). Sich-erinnern-Müssen ist anstrengend – und genau deshalb wirksam.</li>';
    h += '<li><b>Interleaving:</b> Themen und Fächer wechseln sich ab, maximal 2 Einheiten pro Thema und Tag. Das trainiert, die richtige Methode selbst zu erkennen – wie in der Klausur.</li>';
    h += '<li><b>Vom Einfachen zum Schweren:</b> Erst verstehen (Feynman-Methode), dann AFB I → II → III → Klausur-Mix. Für 15 Punkte musst du vor allem AFB III sicher können.</li>';
    h += '<li><b>Operatoren:</b> Alle Übungs-Prompts verwenden die BW-Operatoren deines Fachs – du lernst, was „erläutern“, „beurteilen“ oder „erörtern“ genau verlangt.</li>';
    h += '<li><b>Testing-Effekt:</b> 3–6 Tage vor der Klausur eine echte Simulation, danach eine Fehleranalyse – so bleibt Zeit, Lücken zu schließen.</li>';
    h += '<li><b>Fehlerprotokoll:</b> Jeder Fehler wird notiert und erklärt. Das ist die schnellste Abkürzung zu mehr Punkten.</li>';
    h += '<li><b>Pausen & Schlaf:</b> Nach jeder Einheit Pause, ein lernfreier Tag pro Woche und am Vortag kein neuer Stoff. Schlaf ist Teil des Lernens!</li>';
    h += '</ul></details>';

    h += '<div class="lp-toolbar">';
    if (inRange) h += '<button type="button" class="btn btn-gold" data-act="today">Zu heute springen</button>';
    h += '<button type="button" class="btn btn-gold" data-act="export">📤 Plan exportieren / Backup</button>';
    h += '<button type="button" class="btn btn-outline" data-act="print">Drucken / PDF</button>';
    h += '<button type="button" class="btn btn-outline" data-act="ics">Kalender (.ics)</button>';
    h += '<button type="button" class="btn btn-outline" data-act="coach">KI-Coach-Prompt kopieren</button>';
    h += '<a class="btn btn-outline" href="' + GEMINI_URL + '" target="_blank" rel="noopener">Gemini öffnen ↗</a>';
    h += '<button type="button" class="btn btn-outline" data-act="replan">Neu planen ab heute</button>';
    h += '<button type="button" class="btn btn-outline" data-act="edit">Einstellungen bearbeiten</button>';
    h += '<button type="button" class="btn btn-danger" data-act="delete">🗑️ Plan löschen / Zurücksetzen</button>';
    h += '</div></section>';

    var curWeek = null, weekNo = 0;
    p.days.forEach(function (d) {
      var ws = addDays(d.date, -wdIdx(d.date));
      if (ws !== curWeek) {
        curWeek = ws; weekNo++;
        h += '<h2 class="lp-week-title">Woche ' + weekNo + ' · ' + fmtShort(ws) + ' – ' + fmtShort(addDays(ws, 6)) + '</h2>';
      }
      var past = d.date < today, isToday = d.date === today, ex = examsByDate[d.date];
      var cls = 'lp-day' + (isToday ? ' lp-today' : '') + (past ? ' lp-past' : '') + (ex ? ' lp-exam' : '');
      var used = d.sessions.reduce(function (a, x) { return a + (x.optional ? 0 : x.min); }, 0);
      h += '<article class="' + cls + '" id="lp-day-' + d.date + '">';
      h += '<div class="lp-day-head"><span class="lp-day-date">' + fmtDay(d.date) + '</span>';
      if (isToday) h += '<span class="lp-badge">Heute</span>';
      (ex || []).forEach(function (fk) { h += '<span class="lp-badge lp-gold">Klausur ' + esc(fachName(fk)) + '</span>'; });
      if (used) h += '<span class="lp-day-min">' + fmtMin(used) + ' geplant</span>';
      h += '</div>';
      if (ex) h += '<div class="lp-free">Heute zeigst du, was du kannst: ' + esc(ex.map(fachName).join(', ')) + '. Frühstücken, Operatoren genau lesen, Zeit im Blick behalten – du bist vorbereitet!</div>';
      if (d.sessions.length) {
        d.sessions.forEach(function (x) { h += renderSession(x, past); });
      } else if (!ex) {
        h += '<div class="lp-free">' + (d.cap > 0 ? 'Puffertag – hol Verpasstes nach oder gönn dir eine Pause.' : 'Lernfrei – Erholung gehört zum Lernerfolg dazu.') + '</div>';
      }
      h += '</article>';
    });

    box.innerHTML = h;
    updateProgress();
    markStale();
  }

  function markStale() {
    var el = $('lp-stale');
    if (!el || !state.plan) return;
    if (state.plan.sig !== settingsSig()) {
      el.innerHTML = '<div class="lp-box"><strong>Einstellungen geändert.</strong> Dein Plan berücksichtigt das noch nicht. ' +
        '<button type="button" class="lp-tool lp-tool-gold" data-act="replan">Jetzt neu planen</button></div>';
    } else {
      el.innerHTML = '';
    }
  }

  function setupVisible(show) {
    $('lp-setup').style.display = show ? '' : 'none';
    var b = $('lp-generate');
    if (b) b.lastChild.textContent = state.plan ? ' Lernplan neu berechnen' : ' Lernplan erstellen';
  }

  /* ──────────────────────────────────────────────────────────
     Prompts & Exporte
     ────────────────────────────────────────────────────────── */
  function topicsForPrompt(fk, key, afb) {
    if (afb === 'SIM' || !key) {
      return subjTopics(fk).filter(function (t) { return t.selected; });
    }
    var t = findTopic(fk, key);
    return t ? [t] : [];
  }

  function copyQuiz(btn) {
    var fk = btn.getAttribute('data-fach'), key = btn.getAttribute('data-key'), afb = btn.getAttribute('data-afb');
    var topics = topicsForPrompt(fk, key, afb);
    if (!topics.length) { toast('Thema nicht gefunden – ist es noch ausgewählt?'); return; }
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Lädt …';
    LT.loadTopicsText(topics.map(function (t) { return { title: t.title, link: t.link, note: t.note }; }))
      .then(function (text) {
        var st = getSub(fk);
        var fullZusatz = LT.getZusatzwissen ? LT.getZusatzwissen(fk) : st.zusatz.trim();
        var prompt = LT.buildQuizPrompt({
          fachKey: fk,
          topicTitles: topics.map(function (t) { return t.title; }),
          text: text, afb: afb, zusatz: fullZusatz, simMinutes: st.simMinutes
        });
        return LT.copyToClipboard(prompt);
      })
      .then(function (ok) { if (ok) toast(afb === 'SIM' ? 'Kopiert! Neuer Gemini-Chat → Strg+V. Chat für die Fehleranalyse offen lassen.' : 'Kopiert! Neuer Gemini-Chat → Strg+V.', true); })
      .catch(function (e) {
        toast('Lernzettel konnten nicht geladen werden. Öffne die Website über GitHub Pages (nicht als Datei).');
        console.error(e);
      })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  }

  function copyFehler(btn) {
    var fk = btn.getAttribute('data-fach');
    var topics = topicsForPrompt(fk, '', 'SIM').map(function (t) { return t.title; });
    var z = LT.getZusatzwissen ? LT.getZusatzwissen(fk) : getSub(fk).zusatz.trim();

    if (fk === 'deutsch') {
      var pd = 'Du bist eine erfahrene Deutsch-Lehrkraft an einem allgemeinbildenden Gymnasium in Baden-Württemberg.\n';
      pd += 'Ich habe einen Probe-Aufsatz (Klausur-Simulation) zum Thema „' + topics.join(', ') + '“ geschrieben.\n';
      pd += 'Unten füge ich meinen geschriebenen Aufsatz (abgetippt oder als Foto) ein. Bitte korrigiere und bewerte ihn streng nach dem BW-Abiturmaßstab:\n\n';
      pd += '1. GESAMTBEWERTUNG (0–15 Notenpunkte): Bewerte getrennt nach **Inhaltlicher Leistung (60 %)** und **Darstellungsleistung / Sprache / Ausdruck (40 %)**.\n';
      pd += '2. DETAILLIERTER AUFSATZ-CHECK:\n';
      pd += '   • **Einleitung:** Sitzt der Aufhänger, der vollständige **TATTE-Basissatz** und eine präzise **zentrale Interpretationshypothese**?\n';
      pd += '   • **Inhaltsangabe:** Sind die Sinnabschnitte logisch, ist das Tempus durchgehend **Präsens** und wurde bei Figurenäußerungen sauber der **Konjunktiv I** (ohne Zitate!) genutzt?\n';
      pd += '   • **Hauptteil (Analyse & Interpretation):** Wurde aspektorientiert gegliedert (statt linearer Nacherzählung) und überall der **15-Punkte-Dreischritt (1. Form/Aspekt → 2. Zitat mit Zeile → 3. funktionale Deutung)** eingehalten? Wurden Erzähltechnik, Sprache/Symbolik und Kommunikationsmodelle (z. B. Schulz von Thun / Watzlawick) tiefgründig auf den Text angewendet?\n';
      pd += '   • **Schluss:** Gibt es ein komprimiertes Fazit, den Rückbezug zur Eingangshypothese und einen gelungenen Ausblick?\n';
      pd += '3. VORHER → NACHHER (15-PUNKTE-UPGRADE): Nimm meine **3 schwächsten Absätze oder Sätze** aus meinem Aufsatz und schreibe sie mir direkt in einer **perfekten 15-Punkte-Version** (mit gehobenen Analyse-Verben und sauberem Dreischritt) um!\n';
      pd += '4. Nenne mir meine 3 wichtigsten Schreib-Tipps für die echte Klausur.\n';
      if (z) pd += '\nZusatzwissen / Vorgaben meiner Lehrkraft:\n' + z + '\n';
      pd += '\nTEXTGRUNDLAGE & AUFGABENSTELLUNG: stehen weiter oben in diesem Chat (falls das ein neuer Chat ist, füge ich sie hier ein).\n';
      pd += '\nMEIN GESCHRIEBENER AUFSATZ (abgetippt oder als Foto angehängt):\n(hier einfügen)\n';
      LT.copyToClipboard(pd).then(function (ok) { if (ok) toast('Aufsatz-Korrektur-Prompt kopiert! Im Chat der Simulation einfügen + deinen Aufsatz anhängen.', true); });
      return;
    }

    var p = 'Du bist eine erfahrene Lehrkraft für ' + fachName(fk) + ' an einem Gymnasium in Baden-Württemberg.\n';
    p += 'Ich habe eine Klausur-Simulation zu folgenden Themen geschrieben: ' + topics.join(', ') + '.\n';
    p += 'Unten füge ich die Aufgaben, meine Lösungen und den Erwartungshorizont ein. Bitte:\n';
    p += '1. Bewerte meine Lösung streng nach Abitur-Maßstab in Notenpunkten (0–15) und begründe kurz.\n';
    p += '2. Ordne jeden Fehler einer Kategorie zu: Wissenslücke · Operator nicht erfüllt · Flüchtigkeitsfehler · Zeitproblem · Darstellung/Fachsprache.\n';
    p += '3. Nenne meine 3 wichtigsten Baustellen auf dem Weg zu 15 Punkten.\n';
    p += '4. Erstelle zu jeder Wissenslücke 2 gezielte Übungsaufgaben (mit Lösung darunter, deutlich abgetrennt).\n';
    p += '5. Formuliere zu jeder Wissenslücke eine Karteikarte (Vorderseite | Rückseite).\n';
    var ops = ['I', 'II', 'III'].map(function (a) { return LT.AFB_LABELS[a] + ': ' + LT.getOperatorNames(fk, a); }).join('\n');
    if (ops.replace(/AFB I+: /g, '').trim()) p += '\nPrüfe besonders, ob ich die Operatoren richtig umgesetzt habe:\n' + ops + '\n';
    if (z) p += '\nZusatzwissen / Übungsblätter, die ich ebenfalls können muss:\n' + z + '\n';
    p += '\nAUFGABEN & ERWARTUNGSHORIZONT: stehen weiter oben in diesem Chat (falls das ein neuer Chat ist, füge ich sie hier ein).\n';
    p += '\nMEINE LÖSUNGEN (abgetippt oder als Foto angehängt):\n(hier einfügen)\n';
    LT.copyToClipboard(p).then(function (ok) { if (ok) toast('Kopiert! Im Chat der Simulation einfügen + deine Lösungen anhängen.', true); });
  }

  function copyCoach() {
    var p = state.plan, today = todayStr();
    var t = 'Du bist mein persönlicher Lerncoach für die Oberstufe in Baden-Württemberg. Mein Ziel: 15 Notenpunkte.\n\n';
    t += 'MEINE FÄCHER, THEMEN & SELBSTEINSCHÄTZUNG (1 = neu … 4 = sicher, ★ = besonders wichtig):\n';
    (p.exams || []).forEach(function (e) {
      t += '\n' + fachName(e.fk) + ' – Klausur am ' + fmtDay(e.date) + '\n';
      subjTopics(e.fk).filter(function (x) { return x.selected; }).forEach(function (x) {
        t += '  • ' + x.title + ' (' + x.level + '/4 ' + LEVELS[x.level - 1].label + ')' + (x.important ? ' ★' : '') + '\n';
      });
      var files = getSub(e.fk).files || [];
      files.forEach(function (fl) {
        t += '  • Eigenes Übungsblatt: ' + fl.name + '\n';
      });
      var z = getSub(e.fk).zusatz.trim();
      if (z) t += '  Zusatzwissen: ' + z.replace(/\n+/g, ' | ') + '\n';
    });
    t += '\nMEIN PLAN FÜR DIE NÄCHSTEN 7 TAGE:\n';
    p.days.filter(function (d) { return d.date >= today && diff(today, d.date) < 7; }).forEach(function (d) {
      if (!d.sessions.length) return;
      t += fmtDay(d.date) + ': ' + d.sessions.map(function (x) {
        return TYPE_LABEL[x.type] + ' ' + fachName(x.fk) + (x.title ? ' – ' + x.title : '') + (x.afb && x.type === 'U' ? ' (' + x.afb + ')' : '') + (state.done[x.id] ? ' ✓' : '');
      }).join('; ') + '\n';
    });
    var pr = progress();
    t += '\nFortschritt bisher: ' + pr.done + ' von ' + pr.total + ' Einheiten erledigt.\n\n';
    t += 'DEINE AUFGABE:\n';
    t += '1. Gib mir ein kurzes, ehrliches Feedback zu meinem Plan (Risiken, Prioritäten).\n';
    t += '2. Wenn ich dir schreibe „Start: [Thema]“, stellst du mir 5 Active-Recall-Fragen nacheinander (eine pro Nachricht), wartest auf meine Antwort und korrigierst sie knapp.\n';
    t += '3. Verwende bei Aufgaben immer die offiziellen BW-Operatoren des jeweiligen Fachs.\n';
    t += '4. Motiviere mich, aber bleib ehrlich, wenn etwas noch nicht für 15 Punkte reicht.\n';
    LT.copyToClipboard(t).then(function (ok) { if (ok) toast('KI-Coach-Prompt kopiert! Eigener Gemini-Chat → Strg+V (dann z. B. „Start: [Thema]“ schreiben).', true); });
  }

  function downloadBlob(content, mime, filename) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function safeFilename(s) {
    return String(s || 'Lernplan').replace(/[^a-zA-Z0-9äöüÄÖÜß_\-]+/g, '-').replace(/^-+|-+$/g, '') || 'Lernplan';
  }

  function icsEscape(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }
  function icsFold(line) {
    var out = [];
    while (line.length > 60) { out.push(line.slice(0, 60)); line = ' ' + line.slice(60); }
    out.push(line);
    return out.join('\r\n');
  }

  function exportIcs() {
    var p = state.plan;
    if (!p || !p.days || !p.days.length) { toast('Erstelle zuerst deinen Lernplan.'); return; }
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Olga V.//Lernplaner//DE', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:' + (state.name || 'Lernplan')];
    function ev(date, uid, summary, desc) {
      L.push('BEGIN:VEVENT');
      L.push('UID:' + uid + '@lernplaner-olga');
      L.push('DTSTAMP:' + stamp);
      L.push('DTSTART;VALUE=DATE:' + date.replace(/-/g, ''));
      L.push('DTEND;VALUE=DATE:' + addDays(date, 1).replace(/-/g, ''));
      L.push(icsFold('SUMMARY:' + icsEscape(summary)));
      if (desc) L.push(icsFold('DESCRIPTION:' + icsEscape(desc)));
      L.push('TRANSP:TRANSPARENT');
      L.push('END:VEVENT');
    }
    p.days.forEach(function (d) {
      if (d.date < todayStr() || !d.sessions.length) return;
      var mins = d.sessions.reduce(function (a, x) { return a + (x.optional ? 0 : x.min); }, 0);
      var fs = [];
      d.sessions.forEach(function (x) { var n = fachName(x.fk); if (fs.indexOf(n) < 0) fs.push(n); });
      var desc = d.sessions.map(function (x) {
        return '• ' + TYPE_LABEL[x.type] + ': ' + fachName(x.fk) + (x.title ? ' – ' + x.title : '') + ' (' + metaText(x) + ')';
      }).join('\n');
      ev(d.date, 'lp-' + state.id + '-' + d.date, 'Lernen ' + fmtMin(mins) + ' (' + fs.join(', ') + ')', desc);
    });
    (p.exams || []).forEach(function (e) { ev(e.date, 'exam-' + state.id + '-' + e.fk + '-' + e.date, 'Klausur ' + fachName(e.fk), 'Viel Erfolg! Du bist vorbereitet.'); });
    L.push('END:VCALENDAR');
    downloadBlob(L.join('\r\n') + '\r\n', 'text/calendar;charset=utf-8', safeFilename(state.name) + '.ics');
    toast('Kalenderdatei (.ics) heruntergeladen – öffne sie zum Importieren.');
  }

  function buildMarkdownText() {
    var p = state.plan;
    if (!p || !p.days || !p.days.length) return '';
    var pr = progress();
    var lines = [];
    lines.push('# 🌿 ' + (state.name || 'Dein Lernplan'));
    lines.push('Zeitraum: ' + fmtDay(p.days[0].date) + ' bis ' + fmtDay(p.days[p.days.length - 1].date));
    lines.push('Fortschritt: ' + pr.done + ' / ' + pr.total + ' Einheiten erledigt (' + pr.pct + ' %)');
    if (p.exams && p.exams.length) {
      lines.push('Klausurtermine: ' + p.exams.map(function (e) { return fachName(e.fk) + ' am ' + fmtDay(e.date); }).join(' · '));
    }
    lines.push('');
    var curWeek = null, weekNo = 0;
    p.days.forEach(function (d) {
      var ws = addDays(d.date, -wdIdx(d.date));
      if (ws !== curWeek) {
        curWeek = ws; weekNo++;
        lines.push('## Woche ' + weekNo + ' (' + fmtShort(ws) + ' – ' + fmtShort(addDays(ws, 6)) + ')');
      }
      if (!d.sessions.length) {
        lines.push('- **' + fmtDay(d.date) + ':** _Lernfrei / Puffertag_');
        return;
      }
      lines.push('### ' + fmtDay(d.date));
      d.sessions.forEach(function (x) {
        var chk = state.done[x.id] ? '[x]' : '[ ]';
        var label = TYPE_LABEL[x.type] + ' · ' + fachName(x.fk) + ' – ' + (x.title || 'Alle Themen') + ' (' + metaText(x) + ')';
        lines.push('- ' + chk + ' **' + label + '**');
      });
      lines.push('');
    });
    return lines.join('\r\n');
  }

  function exportMarkdown(copyOnly) {
    var md = buildMarkdownText();
    if (!md) { toast('Erstelle zuerst deinen Lernplan.'); return; }
    if (copyOnly) {
      LT.copyToClipboard(md).then(function (ok) {
        if (ok) toast('Lernplan als Text kopiert! Ideal für WhatsApp, Notion, GoodNotes oder Notizen. ✓');
      });
    } else {
      downloadBlob(md, 'text/markdown;charset=utf-8', safeFilename(state.name) + '.md');
      toast('Lernplan als Markdown-/Textdatei (.md) heruntergeladen! ✓');
    }
  }

  function csvCell(val) {
    var s = String(val == null ? '' : val).replace(/"/g, '""');
    return '"' + s + '"';
  }

  function exportCsv() {
    var p = state.plan;
    if (!p || !p.days || !p.days.length) { toast('Erstelle zuerst deinen Lernplan.'); return; }
    var rows = [['Datum', 'Wochentag', 'Fach', 'Art der Einheit', 'Thema / Übungsblatt', 'Details / AFB', 'Dauer (Min.)', 'Status'].map(csvCell).join(';')];
    p.days.forEach(function (d) {
      var wd = WD[wdIdx(d.date)];
      if (!d.sessions.length) {
        rows.push([d.date, wd, '-', 'Lernfrei / Puffer', '-', '-', '0', '-'].map(csvCell).join(';'));
        return;
      }
      d.sessions.forEach(function (x) {
        rows.push([
          d.date,
          wd,
          fachName(x.fk),
          TYPE_LABEL[x.type] || x.type,
          x.title || 'Alle Themen',
          metaText(x),
          String(x.min || 0),
          state.done[x.id] ? 'Erledigt' : 'Offen'
        ].map(csvCell).join(';'));
      });
    });
    downloadBlob('\uFEFF' + rows.join('\r\n'), 'text/csv;charset=utf-8', safeFilename(state.name) + '.csv');
    toast('Excel-/CSV-Tabelle (.csv) heruntergeladen! ✓');
  }

  function exportJsonBackup() {
    save();
    var json = JSON.stringify(store, null, 2);
    downloadBlob(json, 'application/json;charset=utf-8', 'Lernplaner-Backup-' + todayStr() + '.json');
    toast('Backup-Datei (.json) heruntergeladen – damit kannst du alles z. B. aufs Handy übertragen! ✓');
  }

  function importJsonBackup(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var raw = JSON.parse(String(reader.result || 'null'));
        if (!raw || (!Array.isArray(raw.projects) && !raw.settings)) {
          toast('Ungültige Backup-Datei.');
          return;
        }
        localStorage.setItem(KEY, JSON.stringify(raw));
        store = loadStore();
        state = store.projects.filter(function (p) { return p.id === store.activeId; })[0] || store.projects[0];
        save();
        renderProjects();
        renderSubjects();
        renderTime();
        renderPlan();
        setupVisible(!state.plan);
        toast('Backup erfolgreich geladen! Alle Projekte & Eingaben sind wieder da ✓');
      } catch (e) {
        toast('Backup-Datei konnte nicht gelesen werden.');
      }
    };
    reader.readAsText(file);
  }

  function openExportModal() {
    var hasPlan = !!(state.plan && state.plan.days && state.plan.days.length);
    var overlay = document.createElement('div');
    overlay.className = 'modal show';
    overlay.style.zIndex = '25000';
    overlay.innerHTML =
      '<div class="modal-content" style="max-width: 560px;">' +
        '<button class="modal-close" aria-label="Schließen">&times;</button>' +
        '<h2 class="modal-title">📤 Lernplan exportieren &amp; Backup</h2>' +
        '<p class="modal-desc">Speichere deinen Lernplan „<b>' + esc(state.name || 'Lernplan') + '</b>“ in deinem Wunschformat oder übertrage alle Daten auf ein anderes Gerät (z. B. Handy / Tablet):</p>' +
        '<div class="lp-exp-list">' +
          (hasPlan ? (
            '<button type="button" class="lp-exp-card" data-exp="print">' +
              '<div><b>🖨️ Als PDF speichern / Drucken</b><span>Sauberes A4-Layout zum Ausdrucken oder im Druckmenü „Als PDF speichern“.</span></div>' +
              '<span class="lp-exp-badge">PDF / Druck</span>' +
            '</button>' +
            '<button type="button" class="lp-exp-card" data-exp="ics">' +
              '<div><b>📅 In Kalender importieren (.ics)</b><span>Für Apple Kalender (iPhone/iPad/Mac), Google Kalender oder Outlook.</span></div>' +
              '<span class="lp-exp-badge">.ics</span>' +
            '</button>' +
            '<button type="button" class="lp-exp-card" data-exp="copy-md">' +
              '<div><b>📋 Als Text / Checkliste kopieren</b><span>Kopiert den gesamten Plan mit Abhak-Kästchen für WhatsApp, Notion, GoodNotes oder Notizen.</span></div>' +
              '<span class="lp-exp-badge">Zwischenablage</span>' +
            '</button>' +
            '<button type="button" class="lp-exp-card" data-exp="dl-md">' +
              '<div><b>📝 Als Markdown- / Textdatei herunterladen (.md)</b><span>Speichert den kompletten Lernplan als übersichtliche Textdatei.</span></div>' +
              '<span class="lp-exp-badge">.md</span>' +
            '</button>' +
            '<button type="button" class="lp-exp-card" data-exp="csv">' +
              '<div><b>📊 Als Excel- / Google-Sheets-Tabelle (.csv)</b><span>Alle Lerntage, Fächer, Themen, Dauer und Status als Tabelle.</span></div>' +
              '<span class="lp-exp-badge">.csv</span>' +
            '</button>'
          ) : '<p class="lp-hint" style="margin:4px 0;"><i>Hinweis: Erstelle zuerst deinen Lernplan, um auch PDF-, Kalender-, Text- und Excel-Exporte zu nutzen.</i></p>') +
          '<button type="button" class="lp-exp-card" data-exp="json-out">' +
            '<div><b>💾 Komplettes Backup herunterladen (.json)</b><span>Sichert alle deine Lernplan-Projekte, Häkchen, Übungsblätter &amp; Zusatzwissen in einer Datei.</span></div>' +
            '<span class="lp-exp-badge">Backup ↓</span>' +
          '</button>' +
          '<label class="lp-exp-card" style="margin:0;">' +
            '<div><b>📥 Backup-Datei wieder einspielen (.json)</b><span>Lade ein gespeichertes Backup (z. B. vom PC aufs Handy oder Tablet).</span></div>' +
            '<span class="lp-exp-badge">Backup ↑</span>' +
            '<input type="file" accept=".json,application/json" data-exp="json-in" style="display:none;">' +
          '</label>' +
        '</div>' +
        '<div style="display:flex;justify-content:flex-end;margin-top:14px;">' +
          '<button type="button" class="btn btn-outline" data-exp="close">Schließen</button>' +
        '</div>' +
      '</div>';

    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    overlay.querySelector('.modal-close').addEventListener('click', close);
    var fileInp = overlay.querySelector('[data-exp="json-in"]');
    if (fileInp) {
      fileInp.addEventListener('change', function () {
        if (this.files && this.files[0]) {
          importJsonBackup(this.files[0]);
          close();
        }
      });
    }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { close(); return; }
      var b = e.target.closest('[data-exp]');
      if (!b || b.tagName === 'INPUT') return;
      var act = b.getAttribute('data-exp');
      if (act === 'print') { close(); window.print(); }
      else if (act === 'ics') { exportIcs(); }
      else if (act === 'copy-md') { exportMarkdown(true); }
      else if (act === 'dl-md') { exportMarkdown(false); }
      else if (act === 'csv') { exportCsv(); }
      else if (act === 'json-out') { exportJsonBackup(); }
      else if (act === 'close') { close(); }
    });
    document.body.appendChild(overlay);
  }

  function openDeleteModal() {
    var overlay = document.createElement('div');
    overlay.className = 'modal show';
    overlay.style.zIndex = '25000';
    var hasPlan = !!(state.plan && state.plan.days && state.plan.days.length);
    var multi = store.projects.length > 1;
    var pName = esc(state.name || 'Lernplan');
    overlay.innerHTML =
      '<div class="modal-content" style="max-width: 540px;">' +
        '<button class="modal-close" aria-label="Schließen">&times;</button>' +
        '<h2 class="modal-title">Lernplan löschen / zurücksetzen</h2>' +
        '<p class="modal-desc">Aktuelles Projekt: <b>' + pName + '</b>. Wähle aus, was gelöscht werden soll:</p>' +
        '<div style="display: flex; flex-direction: column; gap: 10px; margin-top: 14px;">' +
          (hasPlan ? '<button type="button" class="btn btn-outline" data-del="plan-only" style="text-align: left; padding: 12px 16px;">' +
            '<b>Nur berechneten Kalender-Plan löschen (Eingaben behalten)</b><br>' +
            '<span style="font-size: 0.82rem; font-weight: 400; color: var(--text-secondary);">Löscht den Kalender-Plan und die Häkchen in „' + pName + '“. Deine gewählten Themen, Klausurtermine, Übungsblätter und dein Zusatzwissen bleiben erhalten.</span>' +
          '</button>' : '') +
          '<button type="button" class="btn btn-outline" data-del="reset-proj" style="text-align: left; padding: 12px 16px;">' +
            '<b>Projekt „' + pName + '“ komplett auf Anfang zurücksetzen</b><br>' +
            '<span style="font-size: 0.82rem; font-weight: 400; color: var(--text-secondary);">Leert alle ausgewählten Themen, Termine und den Plan in diesem Projekt' + (multi ? ' (deine anderen Projekte bleiben unberührt)' : '') + '.</span>' +
          '</button>' +
          (multi ? '<button type="button" class="btn btn-danger" data-del="del-proj" style="text-align: left; padding: 12px 16px; border-radius: var(--radius-md);">' +
            '<b>Projekt „' + pName + '“ komplett löschen</b><br>' +
            '<span style="font-size: 0.82rem; font-weight: 400; opacity: 0.9;">Entfernt dieses Projekt aus deiner Projekt-Leiste und wechselt zum nächsten Projekt.</span>' +
          '</button>' : '') +
          '<button type="button" class="btn btn-danger" data-del="all" style="text-align: left; padding: 12px 16px; border-radius: var(--radius-md);">' +
            '<b>Alle Projekte &amp; Daten komplett löschen (Werkseinstellung)</b><br>' +
            '<span style="font-size: 0.82rem; font-weight: 400; opacity: 0.9;">Löscht sämtliche Lernplan-Projekte, Themen, Termine, Übungsblätter und das Zusatzwissen im Browser.</span>' +
          '</button>' +
          '<button type="button" class="btn btn-outline" data-del="cancel" style="margin-top: 4px;">Abbrechen</button>' +
        '</div>' +
      '</div>';

    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { close(); return; }
      var btn = e.target.closest('[data-del]');
      if (!btn) return;
      var mode = btn.getAttribute('data-del');
      if (mode === 'plan-only') {
        state.plan = null;
        state.done = {};
        save();
        renderPlan();
        setupVisible(true);
        close();
        $('lp-setup').scrollIntoView({ behavior: 'smooth', block: 'start' });
        toast('Plan gelöscht – du kannst deine Eingaben jetzt korrigieren.');
      } else if (mode === 'reset-proj') {
        var fresh = defaults(state.id, state.name);
        state.settings = fresh.settings;
        state.plan = null;
        state.done = {};
        save();
        renderSubjects();
        renderTime();
        renderPlan();
        setupVisible(true);
        $('lp-error').textContent = '';
        close();
        $('lp-setup').scrollIntoView({ behavior: 'smooth', block: 'start' });
        toast('Projekt „' + state.name + '“ wurde zurückgesetzt.');
      } else if (mode === 'del-proj') {
        close();
        deleteProjectById(state.id);
      } else if (mode === 'all') {
        var first = defaults('p_1', 'Lernplan 1');
        store = { activeId: first.id, projects: [first] };
        state = first;
        try { localStorage.removeItem(KEY); } catch (err) { /* ignore */ }
        renderProjects();
        renderSubjects();
        renderTime();
        renderPlan();
        setupVisible(true);
        $('lp-error').textContent = '';
        close();
        $('lp-setup').scrollIntoView({ behavior: 'smooth', block: 'start' });
        toast('Alle Projekte und Eingaben wurden komplett zurückgesetzt.');
      } else {
        close();
      }
    });
    document.body.appendChild(overlay);
  }

  /* ──────────────────────────────────────────────────────────
     Events im Plan
     ────────────────────────────────────────────────────────── */
  function initPlanEvents() {
    var box = $('lp-result');

    box.addEventListener('change', function (e) {
      var t = e.target;
      if (t.getAttribute('data-act') !== 'done') return;
      var id = t.getAttribute('data-id');
      if (t.checked) state.done[id] = true; else delete state.done[id];
      save();
      var row = t.closest('.lp-session');
      if (row) row.classList.toggle('lp-done', t.checked);
      updateProgress();
      if (t.checked) toast(['Stark! ✓', 'Weiter so! ✓', 'Eine Einheit näher an den 15 Punkten ✓', 'Erledigt – gönn dir eine Pause ✓'][Math.floor(Math.random() * 4)]);
    });

    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b || b.tagName === 'INPUT') return;
      var act = b.getAttribute('data-act');
      if (act === 'quiz') copyQuiz(b);
      else if (act === 'fehler') copyFehler(b);
      else if (act === 'file-solve') copyFilePrompt(b.getAttribute('data-fach'), b.getAttribute('data-fid'), 'solve');
      else if (act === 'file-twin') copyFilePrompt(b.getAttribute('data-fach'), b.getAttribute('data-fid'), 'twin');
      else if (act === 'export') openExportModal();
      else if (act === 'print') window.print();
      else if (act === 'ics') exportIcs();
      else if (act === 'coach') copyCoach();
      else if (act === 'replan') generate();
      else if (act === 'edit') {
        setupVisible(true);
        $('lp-setup').scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (act === 'delete') {
        openDeleteModal();
      } else if (act === 'today') {
        var el = $('lp-day-' + todayStr());
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  /* ──────────────────────────────────────────────────────────
     Start
     ────────────────────────────────────────────────────────── */
  function init() {
    renderProjects();
    renderSubjects();
    renderTime();
    initProjectEvents();
    initSubjectEvents();
    initTimeEvents();
    initPlanEvents();
    $('lp-generate').addEventListener('click', generate);
    var resetBtn = $('lp-reset');
    if (resetBtn) resetBtn.addEventListener('click', openDeleteModal);
    var expSetupBtn = $('lp-export-setup');
    if (expSetupBtn) expSetupBtn.addEventListener('click', openExportModal);

    /* Fach per URL öffnen: lernplaner.html?fach=mathe */
    var m = /[?&]fach=([^&]+)/.exec(location.search);
    if (m) {
      var det = $('lp-subjects').querySelector('details.lp-subject[data-fach="' + decodeURIComponent(m[1]) + '"]');
      if (det) det.open = true;
    }

    renderPlan();
    setupVisible(!state.plan);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
