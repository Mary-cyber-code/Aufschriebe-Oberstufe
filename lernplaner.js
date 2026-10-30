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

  /* UI-Zustand für 3-Schritt-Assistent, Fächer-Pills & Plan-Filter */
  var uiState = {
    step: 1,
    allSteps: false,
    openSubjects: {},
    showAllSubjects: false,
    planFilter: 'all' /* 'all' | 'focus' | 'open' | 'future' */
  };

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
        zusatz: s.zusatz || '',
        taskMode: s.taskMode || 'both',
        attachInAi: s.attachInAi !== false,
        taskNote: s.taskNote || ''
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
      if ((st.files || []).length) hasSel = true;
      if (hasSel) active.push(fachName(fk) + (st.exam ? ' (' + fmtShort(st.exam) + ')' : ''));
    });
    return active.length ? active.join(', ') + ' · Entwurf' : 'Noch keine Themen gewählt';
  }

  function renderProjects() {
    var box = $('lp-projects');
    if (!box) return;
    var h = '<div class="lp-proj-tabs">';
    store.projects.forEach(function (p) {
      var active = p.id === state.id;
      var pid = esc(p.id);
      h += '<div class="lp-proj-tab' + (active ? ' lp-active' : '') + '" data-proj-act="switch" data-id="' + pid + '">';
      h += '<div><div>' + esc(p.name) + '</div><span class="lp-proj-sub">' + esc(projSubtitle(p)) + '</span></div>';
      h += '<button type="button" class="lp-proj-icon" data-proj-act="rename" data-id="' + pid + '" title="Umbenennen" aria-label="Umbenennen">✏️</button>';
      if (store.projects.length > 1) {
        h += '<button type="button" class="lp-proj-icon" data-proj-act="del-proj" data-id="' + pid + '" title="Löschen" aria-label="Löschen">&times;</button>';
      }
      h += '</div>';
    });
    h += '<button type="button" class="lp-proj-add" data-proj-act="new">+ Neuer Plan</button>';
    h += '</div>';
    box.innerHTML = h;
  }

  function switchProject(id) {
    var target = store.projects.filter(function (p) { return p.id === id; })[0];
    if (!target || target.id === state.id) return;
    state = target;
    store.activeId = state.id;
    syncOpenSubjectsWithSelection();
    save();
    renderSubjects();
    renderTime();
    renderExamsOverview();
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
      syncOpenSubjectsWithSelection();
      goToStep(1);
      save();
      renderSubjects();
      renderTime();
      renderExamsOverview();
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
    syncOpenSubjectsWithSelection();
    save();
    renderSubjects();
    renderTime();
    renderExamsOverview();
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
    if (!st.taskMode) st.taskMode = 'both'; /* 'both' | 'own' | 'ai' */
    if (st.attachInAi == null) st.attachInAi = true;
    if (st.taskNote == null) st.taskNote = '';
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

  function isSubjectActive(fk) {
    var st = getSub(fk);
    var sel = subjTopics(fk).some(function (t) { return t.selected; });
    var fc = st.files && st.files.length > 0;
    var tn = st.taskNote && st.taskNote.trim().length > 0;
    return sel || fc || tn;
  }

  function syncOpenSubjectsWithSelection() {
    uiState.openSubjects = {};
    var anyActive = false;
    Object.keys(subjectData).forEach(function (fk) {
      if (isSubjectActive(fk)) {
        uiState.openSubjects[fk] = true;
        anyActive = true;
      }
    });
    if (!anyActive) {
      /* Standardmäßig Mathe aufklappen, damit man sofort sieht, wie ein Fach aussieht */
      uiState.openSubjects.mathe = true;
    }
  }

  /** Signatur der planungsrelevanten Einstellungen (ohne Zusatzwissen/Start) */
  function settingsSig() {
    var s = state.settings, subs = {};
    Object.keys(subjectData).forEach(function (fk) {
      var sel = subjTopics(fk).filter(function (t) { return t.selected; });
      var st = getSub(fk);
      if (!sel.length && !(st.files && st.files.length)) return;
      subs[fk] = {
        exam: st.exam, sim: st.simMinutes, tm: st.taskMode,
        t: sel.map(function (t) { return t.key + ':' + t.level + ':' + (t.important ? 1 : 0); }),
        f: (st.files || []).map(function (fl) { return fl.id; })
      };
    });
    return JSON.stringify({ m: s.minutes, b: s.block, s: subs });
  }

  /* ──────────────────────────────────────────────────────────
     3-SCHRITT-ASSISTENT (STEPPER) & ÜBERSICHTS-BADGES
     ────────────────────────────────────────────────────────── */
  function goToStep(stepNum, doScroll) {
    uiState.step = stepNum;
    [1, 2, 3].forEach(function (n) {
      var panel = $('lp-step-panel-' + n);
      if (panel) {
        panel.classList.toggle('lp-step-hidden', !uiState.allSteps && n !== stepNum);
      }
    });
    var tabs = document.querySelectorAll('.lp-stepper-tab');
    Array.prototype.forEach.call(tabs, function (tab) {
      var tStep = +tab.getAttribute('data-step-go');
      var active = uiState.allSteps || tStep === stepNum;
      tab.classList.toggle('lp-step-active', tStep === stepNum);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (stepNum === 2 || uiState.allSteps) {
      renderExamsOverview();
    }
    renderStepBadges();
    if (doScroll) {
      var target = $('lp-step-panel-' + stepNum) || $('lp-setup');
      if (target && target.scrollIntoView) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderStepBadges() {
    var b1 = $('lp-step1-badge'), b2 = $('lp-step2-badge');
    var activeFks = [];
    var totalTopics = 0;
    var missingExams = 0;
    Object.keys(subjectData).forEach(function (fk) {
      var sel = subjTopics(fk).filter(function (t) { return t.selected; }).length;
      var st = getSub(fk);
      var fc = (st.files || []).length;
      if (sel || fc) {
        activeFks.push(fachName(fk));
        totalTopics += sel + fc;
        if (!validDate(st.exam)) missingExams++;
      }
    });
    if (b1) {
      b1.textContent = activeFks.length
        ? activeFks.length + (activeFks.length === 1 ? ' Fach' : ' Fächer') + ' · ' + totalTopics + ' Themen/Blätter gewählt'
        : 'Themen & Übungsaufgaben wählen';
    }
    if (b2) {
      var wkMin = (state.settings.minutes || []).reduce(function (a, b) { return a + b; }, 0);
      if (!activeFks.length) {
        b2.textContent = fmtMin(wkMin) + '/Woche eingestellt';
      } else if (missingExams > 0) {
        b2.textContent = '⚠️ Noch ' + missingExams + ' Klausurtermin(e) offen · ' + fmtMin(wkMin) + '/Wo.';
      } else {
        b2.textContent = '✓ Alle Termine gesetzt · ' + fmtMin(wkMin) + '/Wo.';
      }
    }
  }

  /* ──────────────────────────────────────────────────────────
     SCHRITT 1 – Fächer-Pills, Themen & Aufgaben-Strategie
     ────────────────────────────────────────────────────────── */
  function subjectSummary(fk) {
    var sel = subjTopics(fk).filter(function (t) { return t.selected; }).length;
    var st = getSub(fk);
    var fc = (st.files || []).length;
    if (!sel && !fc) return { cls: ' lp-empty', text: '0 gewählt' };
    var parts = [];
    if (sel) parts.push(sel + (sel === 1 ? ' Thema' : ' Themen'));
    if (fc) parts.push(fc + (fc === 1 ? ' Blatt' : ' Blätter'));
    return { cls: '', text: '✓ ' + parts.join(' + ') };
  }

  function renderSubjectChips() {
    var box = $('lp-subject-chips');
    if (!box) return;
    var h = '';
    Object.keys(subjectData).forEach(function (fk) {
      var f = subjectData[fk];
      var sel = subjTopics(fk).filter(function (t) { return t.selected; }).length;
      var st = getSub(fk);
      var fc = (st.files || []).length;
      var count = sel + fc;
      var hasData = count > 0 || !!(st.taskNote && st.taskNote.trim());
      var isOpen = !!uiState.openSubjects[fk] || uiState.showAllSubjects || hasData;
      var cls = 'lp-subj-chip' + (isOpen ? ' lp-chip-open' : '') + (hasData ? ' lp-chip-has-data' : '');
      var badge = count > 0 ? ('✓ ' + count) : (isOpen ? 'offen' : '+');
      h += '<button type="button" class="' + cls + '" data-chip-fach="' + esc(fk) + '" aria-pressed="' + (isOpen ? 'true' : 'false') + '">';
      h += '<span>' + esc(f.name) + '</span>';
      h += '<span class="lp-chip-count">' + esc(badge) + '</span>';
      h += '</button>';
    });
    box.innerHTML = h;
    var allBtn = $('lp-show-all-subjects');
    if (allBtn) {
      allBtn.textContent = uiState.showAllSubjects ? 'Nur gewählte Fächer' : 'Alle Fächer zeigen';
    }
  }

  function renderSubject(fk, open) {
    var f = subjectData[fk], st = getSub(fk), topics = subjTopics(fk);
    var sum = subjectSummary(fk);
    var anySel = topics.some(function (t) { return t.selected; }) || (st.files && st.files.length > 0);
    var tm = st.taskMode || 'both';
    var hasFiles = !!(st.files && st.files.length);

    var h = '<details class="lp-subject" data-fach="' + esc(fk) + '"' + (open ? ' open' : '') + '>';
    h += '<summary>' + esc(f.name) + ' <span class="lp-sum-type">' + esc(f.type || '') + '</span>';
    h += '<span class="lp-sum-count' + sum.cls + '">' + esc(sum.text) + '</span></summary>';
    h += '<div class="lp-subject-body">';

    if (topics.length) {
      h += '<div class="lp-fach-bar" style="justify-content:space-between;">';
      h += '<span class="lp-sublabel" style="margin:0;">Themen anhaken &amp; Stand wählen:</span>';
      h += '<button type="button" class="lp-fach-test-btn" data-act="test-fach">🎯 Einstufungs-Test</button>';
      h += '</div>';
    } else {
      h += '<p class="lp-empty-note">Noch keine Lernzettel vorhanden – füge unten einfach eigene Themen hinzu.</p>';
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
      h += '<button type="button" class="lp-test-btn" data-act="test-topic" data-key="' + k + '" title="Kurzer Abfrage-Test zur Einschätzung">🎯 Test</button>';
      h += '<div class="lp-levels" role="radiogroup" aria-label="Wie gut kannst du ' + esc(t.title) + '?">';
      LEVELS.forEach(function (l) {
        h += '<label title="' + esc(l.hint) + '"><input type="radio" name="lv-' + esc(fk) + '-' + i + '" value="' + l.v + '" data-act="lvl" data-key="' + k + '"' + (t.level === l.v ? ' checked' : '') + '>';
        h += '<span class="lv' + l.v + '">' + l.label + '</span></label>';
      });
      h += '</div>';
      h += '<button type="button" class="lp-star' + (t.important ? ' lp-on' : '') + '" data-act="star" data-key="' + k + '" aria-pressed="' + (t.important ? 'true' : 'false') + '" title="Besonders wichtig">★</button>';
      h += '</div>';
    });

    h += '<div class="lp-add-row">';
    h += '<input type="text" class="form-control" data-act="newtitle" maxlength="120" placeholder="+ Eigenes Thema hinzufügen …">';
    h += '<button type="button" class="btn btn-outline" data-act="add">Hinzufügen</button>';
    h += '</div>';

    /* --- KOMPAKTE AUFGABEN-AUSWAHL (EIGENE / KI / BEIDES) --- */
    h += '<div class="lp-task-strategy-box">';
    h += '<div class="lp-task-strategy-title">🏋️ Übungsaufgaben in ' + esc(f.name) + ':</div>';
    h += '<div class="lp-task-modes">';
    var modes = [
      { v: 'both', title: '🌟 Eigene + KI-Aufgaben' },
      { v: 'own',  title: '📎 Nur eigene Aufgaben' },
      { v: 'ai',   title: '🤖 Nur KI-Aufgaben' }
    ];
    modes.forEach(function (m) {
      var chk = tm === m.v;
      h += '<label class="lp-task-mode-card' + (chk ? ' lp-mode-active' : '') + '">';
      h += '<input type="radio" name="tm-' + esc(fk) + '" value="' + m.v + '" data-act="task-mode"' + (chk ? ' checked' : '') + '>';
      h += '<div><b>' + m.title + '</b></div>';
      h += '</label>';
    });
    h += '</div>';

    if (tm === 'both' || tm === 'own' || hasFiles) {
      h += '<div class="lp-task-extra" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">';
      h += '<input type="text" class="form-control" style="flex:1;min-width:190px;" data-act="task-note" value="' + esc(st.taskNote || '') + '" placeholder="Welche Aufgaben hast du? (z. B. Buch S. 74 – oder rechts ganze Seite hochladen/einfügen)">';
      h += '<label class="lp-upload-btn" style="margin:0;">📎 PDF/Seite hochladen<input type="file" accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp" multiple data-act="file-upload" style="display:none;"></label>';
      h += '<button type="button" class="lp-upload-btn" data-act="paste-page" style="margin:0;">📋 Ganze Seite einfügen</button>';
      h += '</div>';
    }

    if (hasFiles) {
      h += '<div class="lp-file-list" style="margin-top:8px;">';
      st.files.forEach(function (fl) {
        var fid = esc(fl.id);
        var ext = ensureFileTasksExtracted(fl);
        var meta = ext.length
          ? ('✓ ' + ext.length + (ext.length === 1 ? ' Aufgabe' : ' Aufgaben') + ' eigenständig extrahiert (AFB I → III)')
          : (fl.text && fl.text.trim() ? '✓ Seitentext geladen (KI extrahiert Aufgaben)' : '📷 Im KI-Chat per + anhängen (KI extrahiert Aufgaben)');
        h += '<div class="lp-file-item" style="flex-direction:column;align-items:stretch;">';
        h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">';
        h += '<div class="lp-file-info"><span>📄</span><div><div class="lp-file-name">' + esc(fl.name) + '</div><div class="lp-file-meta">' + meta + '</div></div></div>';
        h += '<div class="lp-file-actions">';
        h += '<button type="button" class="lp-tool lp-tool-gold" data-act="file-solve" data-fid="' + fid + '">Musterlösung</button>';
        h += '<button type="button" class="lp-tool" data-act="file-twin" data-fid="' + fid + '">Parallelaufgaben</button>';
        h += '<button type="button" class="lp-tool" data-act="file-edit" data-fid="' + fid + '" title="Extrahierte Aufgaben &amp; Seitentext ansehen/bearbeiten">✏️ Aufgaben (' + ext.length + ')</button>';
        h += '<button type="button" class="lp-del" data-act="file-del" data-fid="' + fid + '" title="Entfernen">&times;</button>';
        h += '</div></div>';
        if (ext.length) {
          h += '<details style="margin-top:6px;font-size:0.8rem;color:var(--text-secondary);">';
          h += '<summary style="cursor:pointer;color:var(--forest);font-weight:600;">🔍 Extrahierte Aufgaben aus dieser Seite anzeigen (' + ext.length + ')</summary>';
          h += '<div style="margin-top:6px;padding:8px 10px;background:rgba(58,90,63,0.05);border-radius:6px;display:flex;flex-direction:column;gap:5px;">';
          ext.forEach(function (tk) {
            h += '<div style="line-height:1.35;"><b style="color:var(--forest);">[' + esc(LT.AFB_LABELS[tk.afb] || ('AFB ' + tk.afb)) + '] ' + esc(tk.title) + ':</b> ' + esc(tk.text) + '</div>';
          });
          h += '</div></details>';
        }
        h += '</div>';
      });
      h += '</div>';
    }
    h += '</div>';

    /* --- Optional: Zusatzwissen --- */
    var hasZusatz = !!(st.zusatz && st.zusatz.trim());
    h += '<details class="lp-sub-drawer"' + (hasZusatz ? ' open' : '') + '>';
    h += '<summary>📝 Eigene Notizen / Hinweise der Lehrkraft (optional)' + (hasZusatz ? ' ✓' : '') + '</summary>';
    h += '<div class="lp-sub-drawer-body">';
    h += '<textarea class="form-control" rows="2" data-act="zusatz" placeholder="z. B. Schwerpunkte, Hefteinträge oder Hinweise der Lehrkraft …">' + esc(st.zusatz) + '</textarea>';
    h += '</div></details>';

    if (anySel || st.custom.length || hasFiles || st.exam || hasZusatz || (st.taskNote && st.taskNote.trim())) {
      h += '<div style="margin-top:8px;display:flex;justify-content:flex-end;">';
      h += '<button type="button" class="lp-fach-reset" data-act="reset-fach">🗑️ ' + esc(f.name) + ' zurücksetzen</button>';
      h += '</div>';
    }

    h += '</div></details>';
    return h;
  }

  function renderSubjects() {
    renderSubjectChips();
    renderStepBadges();
    var box = $('lp-subjects');
    if (!box) return;
    var visibleFks = Object.keys(subjectData).filter(function (fk) {
      return uiState.showAllSubjects || uiState.openSubjects[fk] || isSubjectActive(fk);
    });
    if (!visibleFks.length) {
      box.innerHTML = '<div class="lp-box" style="text-align:center;padding:18px;">👆 Tippe oben auf eines oder mehrere Fächer (z. B. <b>Mathematik</b>, <b>Deutsch</b>, <b>Chemie</b>), um deine Themen und Übungsaufgaben auszuwählen!</div>';
      return;
    }
    box.innerHTML = visibleFks.map(function (fk) {
      return renderSubject(fk, true);
    }).join('');
  }

  function rerenderSubject(fk) {
    renderSubjectChips();
    renderStepBadges();
    var box = $('lp-subjects');
    var old = box.querySelector('details.lp-subject[data-fach="' + fk + '"]');
    if (!old) { renderSubjects(); return; }
    var tmp = document.createElement('div');
    tmp.innerHTML = renderSubject(fk, old.open);
    box.replaceChild(tmp.firstChild, old);
  }

  function updateSummary(fk) {
    renderSubjectChips();
    renderStepBadges();
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
    uiState.openSubjects[fk] = true;
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
    'mathe/analysis_j1_abitur_master.html': [
      { tag: 'AFB I–II · Verkettung (u∘v), Ketten- & Produktregel', q: 'Wie lauten Definitionsmenge und Kettenregel für f = u ∘ v, wie lautet die Produktregel – und was gilt für Schnittwinkel β?', a: 'f(x) = (u ∘ v)(x) = u(v(x)) mit x ∈ D_v ∧ v(x) ∈ D_u · Kettenregel: f\'(x) = u\'(v(x))·v\'(x) · Produktregel: f\' = u\'v + uv\' · Schnittwinkel (DEG): β̃ = |arctan(f\'(a)) − arctan(g\'(a))|, falls > 90° dann 180° − β̃.' },
      { tag: 'AFB II–III · NEW-Schema & Umkehrschluss-Fallen', q: 'Nenne die 3 Gegenbeispiele zu: a) stetig ⇒ diff\'bar, b) streng monoton wachsend ⇒ überall f\'(x) > 0, c) f\'(x₀)=0 ∧ f\'\'(x₀)=0 ⇒ Sattelpunkt!', a: 'a) |x| bei x=0 (Knick) bzw. √x bei x=0 (senkrechte Tangente) · b) x³ (smw auf ℝ, aber f\'(0)=0) · c) x⁴ (f\'(0)=f\'\'(0)=0, aber VZW von f\'=4x³ von − nach + ⇒ Tiefpunkt!).' },
      { tag: 'AFB II · Tangente/Normale von außen & Optimierung', q: 'Wie lauten Tangente & Normale von außen durch Q(q|r) ∉ G_f und wie funktioniert der Radikanden-Trick beim Abstand?', a: 'Tangente: r = f\'(u)·(q − u) + f(u) · Normale: r = (−1/f\'(u))·(q − u) + f(u) (bei f\'(u)=0 vertikal x = u). Radikanden-Trick: R(u) = (q−u)² + (r−f(u))² minimieren (R\'(u)=0), am Ende zwingend d_min = √R(u₁) ziehen & Ränder prüfen!' },
      { tag: 'AFB II–III · e-Funktion, Subtangente & e^x = a·x', q: 'Wie leitest du u(x)·e^{g(x)} ab, wo schneidet die Tangente an e^x in u die x-Achse, und wie viele Lösungen hat e^x = a·x?', a: '(u·e^g)\' = [u\' + u·g\']·e^g (Ausklammer-Pflicht!). Subtangenten-Satz: S_x(u − 1 | 0) ⇒ Ursprungstangente bei u = 1 hat Steigung a = e. Lösungen von e^x = ax: a < 0 → 1 · 0 ≤ a < e → 0 · a = e → 1 · a > e → 2.' }
    ],
    'chemie/chemische-energetik.html': [
      { tag: 'AFB I–II · Block 1: Bindungen, Δ_fus H_m & Säureverdünnung', q: 'Begründe die Abstufung Δ_fus H_m(Si > Al > H₂O > H₂S) auf Teilchenebene und nenne die Formel für c₁ aus w & ρ samt Sicherheitsregel!', a: 'Si (50,2 kJ/mol): 3D-Atomgitter (kovalente Bindungen brechen) · Al (10,7): Metallgitter lockern · H₂O (6,0): H-Brücken teilweise brechen · H₂S (2,4): nur Dipol-Dipol/London. c₁ = (w·ρ)/M mit ρ in g/L! „Erst das Wasser (hohes c_W), dann die Säure“ wegen stark exothermer Hydratation (Δ_hyd H ≪ 0) & Siedeverzug.' },
      { tag: 'AFB II · Block 2: 1. Hauptsatz, Salzlösung & Vorzeichen-Schema', q: 'Warum gilt bei Zn + 2 HCl offen |Δ_r H| < |Δ_r U|, wann löst sich ein Salz endotherm, und wie lautet das 3-Stufen-Vorzeichen-Schema?', a: 'Offen (p=konst.) verrichtet H₂(g) Volumenarbeit W = −p·ΔV < 0 (−154,0 vs. −156,5 kJ/mol). Salz endotherm, wenn |Δ_L H_m| > |Δ_hyd H_m| (z. B. NH₄Cl). Schema: 1) ΔT = ϑ_nach − ϑ_vor · 2) Q_Lsg/K = (m·c_W + C_K)·ΔT und Q_Reakt = −Q_Lsg/K · 3) Δ_r H_m = −Q_Lsg/K / n_Unterschuss (ΔT > 0 ⇒ Δ_r H_m < 0).' },
      { tag: 'AFB II–III · Block 3: Heizwert H_i vs. Brennwert H_s & Satz von Hess', q: 'Warum ist H_s > H_i (Ausnahme Graphit!) und wie rechnest du Δ_c H°_m (H₂O(l)) auf H₂O(g), H_s, H_i oder rückwärts auf Δ_f H°_m um?', a: 'Bei H_s kondensiert H₂O(g)→H₂O(l) (H-Brücken setzen −40,7 bzw. −44 kJ/mol frei); Graphit C(s) bildet kein H₂O ⇒ H_s = H_i = 32,7 MJ/kg. Umrechnung: Δ_r H°_m(g) = Δ_c H°_m(l) + ν(H₂O)·40,7 kJ/mol; H_s = |Δ_c H°_m|/M (immer > 0!). Rückwärts: Δ_f H°_m(Stoff) = ∑ν_i Δ_f H°_m(Prod.) − Δ_c H°_m(Stoff).' },
      { tag: 'AFB III · Fehleranalyse & Bombenkalorimeter (Δ_c U → Δ_c H)', q: 'Wann fällt |Δ_r H_m| im Experiment kleiner bzw. größer als der Literaturwert aus – und wie rechnet man im Bombenkalorimeter Δ_c U° in Δ_c H° um?', a: 'Kleiner: Wärmeverlust, C_K = 0 gesetzt, Ruß/unvollständiger Umsatz, nasses Eis. Größer: c_W = 4,184 statt kleinerem c_Salzlösung genutzt! Bombenkalorimeter (V=konst.) misst Δ_c U°; Umrechnung Δ_c H° = Δ_c U° + p·ΔV (bei Knallgas Δn_Gas = −3 mol ⇒ pΔV = −7,41 kJ ⇒ Δ_c H°_m(H₂) = −286,2 kJ/mol).' }
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
            var maxP = Math.min(pdf.numPages, 80);
            var chain = Promise.resolve('');
            for (var p = 1; p <= maxP; p++) {
              (function (pageNo) {
                chain = chain.then(function (acc) {
                  return pdf.getPage(pageNo).then(function (page) {
                    return page.getTextContent();
                  }).then(function (tc) {
                    var items = tc.items || [];
                    var lines = [];
                    var curLine = '';
                    var lastY = null;
                    for (var i = 0; i < items.length; i++) {
                      var it = items[i];
                      var str = it.str || '';
                      var y = (it.transform && it.transform.length >= 6) ? it.transform[5] : null;
                      if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
                        if (curLine.trim()) lines.push(curLine.replace(/\s+/g, ' ').trim());
                        curLine = str;
                      } else {
                        curLine += (curLine && str && !/\s$/.test(curLine) && !/^\s/.test(str) ? ' ' : '') + str;
                      }
                      if (it.hasEOL) {
                        if (curLine.trim()) lines.push(curLine.replace(/\s+/g, ' ').trim());
                        curLine = '';
                        lastY = null;
                      } else if (y !== null) {
                        lastY = y;
                      }
                    }
                    if (curLine.trim()) lines.push(curLine.replace(/\s+/g, ' ').trim());
                    var pageTxt = lines.join('\n').trim();
                    return acc + (pageTxt ? (acc ? '\n\n' : '') + '[Seite ' + pageNo + ']\n' + pageTxt : '');
                  });
                });
              })(p);
            }
            return chain.then(function (full) {
              var trimmed = full.slice(0, 120000).trim();
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
        var txt = String(reader.result || '').slice(0, 120000).trim();
        resolve({ text: txt, pages: 1, isScan: !txt });
      };
      reader.onerror = function () { resolve({ text: '', pages: 0, isScan: true }); };
      reader.readAsText(file);
    });
  }

  /* ──────────────────────────────────────────────────────────
     EIGENSTÄNDIGE AUFGABEN-EXTRAKTION AUS GANZEN SEITEN / KAPITELN
     ────────────────────────────────────────────────────────── */
  function estimateTaskAfb(text) {
    var lower = String(text || '').toLowerCase();
    if (/\b(begründen|begründe|beurteilen|beurteile|erörtern|erörtere|diskutieren|diskutiere|bewerten|bewerte|prüfen|prüfe|entscheiden|entscheide|beweisen|beweise|widerlegen|widerlege|nehmen sie stellung|nimm stellung|gestalten|entwerfen|entwickeln|verallgemeiner|parameter|für welche[ns]?|unter welchen bedingungen|interpretieren|interpretiere)\b/.test(lower)) {
      return 'III';
    }
    if (/\b(untersuchen|untersuche|erklären|erkläre|erläutern|erläutere|vergleichen|vergleiche|analysieren|analysiere|zeigen sie|zeige,?\s+dass|weisen sie nach|weise nach|leiten sie her|leite her|skizzieren|skizziere|begründen sie kurz|charakterisieren|ordnen sie ein|ermitteln)\b/.test(lower)) {
      return 'II';
    }
    return 'I';
  }

  function extractTasksFromPageText(rawText) {
    if (!rawText || !rawText.trim()) return [];
    var text = rawText
      .replace(/\r\n?/g, '\n')
      /* Falls im Fließtext „Aufgabe 1:“ mitten in einer Zeile steht, Zeilenumbruch davor einfügen */
      .replace(/([^\n])\s+((?:Aufgabe|Aufg\.|Übung|Nr\.|Pflichtteil-Aufgabe|Wahlteil-Aufgabe)\s*\d+[a-z]?\s*[:.)])/gi, '$1\n$2');

    var rawLines = text.split('\n');
    var tasks = [];
    var cur = null;
    var curPage = '';
    var hasMultiplePages = /\[Seite\s*\d+\]|\bSeite\s+\d+/i.test(text);

    var pageMarkerRe = /^(?:\[Seite\s*(\d+)\]|Seite\s+(\d+)(?:\s+von\s+\d+)?|S\.\s*(\d+))$/i;
    var startExplicitRe = /^(?:Aufgabe|Aufg\.|Übung|Nr\.|Nummer|Pflichtteil|Wahlteil|Teilaufgabe)\s*([A-Z]?\d+(?:\.\d+)?[a-z]?|\b[IVX]+\b)\s*[:.\-)–]?\s*(.*)$/i;
    var startCodeRe = /^([ABPW]\s*\d+(?:\.\d+)?)\s*[:.)\-–]\s+(.+)$/;
    var startNumRe = /^(\d{1,2})\s*[.)]\s+([A-ZÄÖÜa-zäöüß„"'(].*)$/;
    var subTaskRe = /^(?:[a-z]\)|[a-z]\.|[(][a-z1-9][)]|\d+\.\d+\b)\s+.+/i;
    var operatorStartRe = /^(?:Berechnen|Bestimmen|Untersuchen|Zeigen|Begründen|Erläutern|Beschreiben|Erklären|Skizzieren|Ermitteln|Geben|Nennen|Lösen|Prüfen|Entscheiden|Beurteilen|Diskutieren|Erörtern|Analysieren|Interpretieren|Vergleichen|Charakterisieren|Stellen|Weisen)\s+Sie\b/i;
    var operatorImpRe = /^(?:Berechne|Bestimme|Untersuche|Zeige|Begründe|Erläutere|Beschreibe|Erkläre|Skizziere|Ermittle|Gib\b|Nenne|Löse|Prüfe|Entscheide|Beurteile|Diskutiere|Erörtere|Analysiere|Interpretiere|Vergleiche)\b/i;
    var noiseLineRe = /^(?:Kapitel\s+\d+|Merksatz\b|Merke\b|Definition\b|Satz\b|Infobox\b|©|Alle Rechte vorbehalten)/i;
    var theoryStopRe = /^(?:Merksatz|Merke|Definition|Theorie|Hintergrundwissen|Zusammenfassung|Lösungen\s+zu\b|Erwartungshorizont)\s*[:.\-]?$/i;

    function flushCurrent() {
      if (!cur) return;
      var body = cur.lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
      if (body.length >= 5) {
        var pagePrefix = (hasMultiplePages && cur.page) ? ('S. ' + cur.page + ' · ') : '';
        var baseTitle = cur.title || ('Aufgabe ' + (tasks.length + 1));
        var fullTitle = (pagePrefix && baseTitle.indexOf('S. ') !== 0) ? (pagePrefix + baseTitle) : baseTitle;
        var fullText = fullTitle + ': ' + body;
        tasks.push({
          title: fullTitle,
          page: cur.page ? (+cur.page || 0) : 0,
          seq: tasks.length,
          text: body,
          afb: estimateTaskAfb(fullText)
        });
      }
      cur = null;
    }

    for (var i = 0; i < rawLines.length; i++) {
      var line = rawLines[i].trim();
      if (!line) continue;

      var mPage = pageMarkerRe.exec(line);
      if (mPage) {
        flushCurrent();
        curPage = mPage[1] || mPage[2] || mPage[3] || curPage;
        continue;
      }

      if (noiseLineRe.test(line)) continue;
      if (theoryStopRe.test(line)) {
        flushCurrent();
        continue;
      }

      var mExp = startExplicitRe.exec(line);
      if (mExp) {
        flushCurrent();
        cur = {
          page: curPage,
          title: 'Aufgabe ' + mExp[1].trim(),
          lines: mExp[2] && mExp[2].trim() ? [mExp[2].trim()] : []
        };
        continue;
      }

      var mCode = startCodeRe.exec(line);
      if (mCode) {
        flushCurrent();
        cur = {
          page: curPage,
          title: 'Aufgabe ' + mCode[1].replace(/\s+/g, ''),
          lines: [mCode[2].trim()]
        };
        continue;
      }

      var mNum = startNumRe.exec(line);
      if (mNum) {
        var rest = mNum[2].trim();
        /* Kein Datum wie „12. Oktober“ */
        var isDate = /^(?:Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|\d{4})\b/i.test(rest);
        if (!isDate && rest.length >= 4) {
          flushCurrent();
          cur = {
            page: curPage,
            title: 'Aufgabe ' + mNum[1],
            lines: [rest]
          };
          continue;
        }
      }

      if (cur) {
        /* Wenn wir in einer Aufgabe sind: alle Teilaufgaben a)–z) und Folgezeilen vollständig behalten */
        var curLen = cur.lines.join('\n').length;
        if (subTaskRe.test(line) || curLen < 1800) {
          cur.lines.push(line);
          continue;
        } else {
          flushCurrent();
        }
      }

      /* Falls eine Zeile ohne Nummer direkt mit einem Operator beginnt (z. B. „Berechnen Sie …“) */
      if (operatorStartRe.test(line) || operatorImpRe.test(line)) {
        flushCurrent();
        cur = {
          page: curPage,
          title: 'Aufgabe ' + (tasks.length + 1),
          lines: [line]
        };
      }
    }
    flushCurrent();

    /* Falls der Text zwar eingefügt wurde, aber keine typische Nummerierung hatte:
       Nach Absätzen mit Fragezeichen, Operatoren oder Funktionsgleichungen f(x) suchen */
    if (!tasks.length && rawText.trim().length >= 15) {
      var paras = rawText.replace(/\r\n?/g, '\n').split(/\n\s*\n/);
      paras.forEach(function (p) {
        var cleanP = p.replace(/^\[Seite\s*\d+\]\s*/i, '').trim();
        if (cleanP.length >= 10 && cleanP.length <= 1800) {
          if (/[?=]/.test(cleanP) || operatorStartRe.test(cleanP) || operatorImpRe.test(cleanP) || /\b(?:f\s*\(\s*x\s*\)|Bestimmen|Berechnen|Untersuchen|Begründen|Erläutern|Erklären|Beschreiben|Aufgabe)\b/i.test(cleanP)) {
            tasks.push({
              title: 'Aufgabe ' + (tasks.length + 1),
              page: 0,
              seq: tasks.length,
              text: cleanP,
              afb: estimateTaskAfb(cleanP)
            });
          }
        }
      });
    }

    /* Innerhalb derselben Buchseite nach Schwierigkeit (AFB I → II → III) sortieren,
       aber die Seitenreihenfolge des Buchkapitels beibehalten, damit Unterkapitel aufeinander aufbauen! */
    var afbOrder = { I: 1, II: 2, III: 3 };
    tasks.sort(function (a, b) {
      if (a.page !== b.page) return a.page - b.page;
      var da = (afbOrder[a.afb] || 2) - (afbOrder[b.afb] || 2);
      if (da !== 0) return da;
      return a.seq - b.seq;
    });
    return tasks;
  }

  function ensureFileTasksExtracted(fl) {
    if (!fl) return [];
    if (Array.isArray(fl.extractedTasks)) return fl.extractedTasks;
    if (fl.text && fl.text.trim()) {
      fl.extractedTasks = extractTasksFromPageText(fl.text);
      return fl.extractedTasks;
    }
    fl.extractedTasks = [];
    return fl.extractedTasks;
  }

  function handleFilesUpload(fk, fileList) {
    if (!fileList || !fileList.length) return;
    var st = getSub(fk);
    var filesArr = Array.prototype.slice.call(fileList);
    toast('Lese ' + filesArr.length + (filesArr.length === 1 ? ' Seite / Blatt' : ' Seiten / Blätter') + ' ein & extrahiere Aufgaben …');

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
        var rawTxt = res.text || '';
        var extracted = rawTxt ? extractTasksFromPageText(rawTxt) : [];
        return {
          id: 'f_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
          name: name,
          text: rawTxt,
          extractedTasks: extracted,
          pages: res.pages || 0,
          isScan: !!res.isScan
        };
      });
    })).then(function (entries) {
      var totalExtracted = 0;
      entries.forEach(function (en) {
        st.files.push(en);
        totalExtracted += (en.extractedTasks ? en.extractedTasks.length : 0);
      });
      save();
      rerenderSubject(fk);
      markStale();
      var extractedCount = entries.filter(function (e) { return e.text && e.text.length >= 20; }).length;
      if (totalExtracted > 0) {
        toast('✓ ' + totalExtracted + (totalExtracted === 1 ? ' Aufgabe' : ' Aufgaben') + ' eigenständig aus der Seite extrahiert & nach AFB I → III sortiert!', true);
      } else if (extractedCount === entries.length) {
        toast('Seite gespeichert & Text ausgelesen! Die KI extrahiert daraus im Lernplan alle Aufgaben ✓');
      } else {
        toast('Blatt gespeichert! (Bei Fotos/Scans einfach in Gemini per + anhängen – die KI extrahiert die Aufgaben automatisch.)');
      }
    });
  }

  function openPastePageModal(fk) {
    var st = getSub(fk);
    var overlay = document.createElement('div');
    overlay.className = 'modal show';
    overlay.style.zIndex = '25000';
    overlay.innerHTML =
      '<div class="modal-content" style="max-width: 620px;">' +
        '<button class="modal-close" aria-label="Schließen">&times;</button>' +
        '<h2 class="modal-title">📋 Ganze Seite / Übungstext einfügen (' + esc(fachName(fk)) + ')</h2>' +
        '<p class="modal-desc">Kopiere einfach eine komplette Buchseite, PDF-Seite oder ein Arbeitsblatt hier hinein. Die Website <b>filtert Erklärtexte heraus, extrahiert eigenständig die einzelnen Aufgaben</b> und sortiert sie nach Schwierigkeit (AFB I → III):</p>' +
        '<div class="form-group" style="margin:10px 0;">' +
          '<label>Titel (optional)</label>' +
          '<input type="text" class="form-control" id="lp-paste-page-title" placeholder="z. B. Buch S. 74–75 oder Übungsblatt Ableitungen">' +
        '</div>' +
        '<div class="form-group" style="margin:10px 0;">' +
          '<label>Komplette Seite / Text hier einfügen</label>' +
          '<textarea class="form-control" id="lp-paste-page-text" rows="9" placeholder="Hier den gesamten Text der Buchseite oder des Arbeitsblatts einfügen (Strg+V) …"></textarea>' +
        '</div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
          '<button type="button" class="btn btn-outline" data-act="cancel">Abbrechen</button>' +
          '<button type="button" class="btn btn-gold" data-act="extract-save" style="width:auto;">🔍 Aufgaben extrahieren &amp; speichern</button>' +
        '</div>' +
      '</div>';

    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { close(); return; }
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'cancel') close();
      else if (act === 'extract-save') {
        var raw = (overlay.querySelector('#lp-paste-page-text').value || '').trim();
        var titleInp = (overlay.querySelector('#lp-paste-page-title').value || '').trim();
        if (!raw) {
          toast('Bitte füge zuerst den Text der Seite ein.');
          return;
        }
        var extracted = extractTasksFromPageText(raw);
        var entry = {
          id: 'f_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
          name: titleInp || ('Eingefügte Seite ' + ((st.files ? st.files.length : 0) + 1)),
          text: raw,
          extractedTasks: extracted,
          pages: 1,
          isScan: false
        };
        st.files.push(entry);
        save();
        rerenderSubject(fk);
        renderExamsOverview();
        markStale();
        close();
        if (extracted.length > 0) {
          toast('✓ ' + extracted.length + (extracted.length === 1 ? ' Aufgabe' : ' Aufgaben') + ' eigenständig extrahiert & nach Schwierigkeit (AFB I → III) sortiert!', true);
        } else {
          toast('Seite gespeichert! Die Aufgaben werden beim Erstellen des Plans berücksichtigt ✓');
        }
      }
    });
    document.body.appendChild(overlay);
    var ta = overlay.querySelector('#lp-paste-page-text');
    if (ta) ta.focus();
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
    var extracted = ensureFileTasksExtracted(fl);
    var extHtml = '';
    if (extracted.length) {
      extHtml = '<div style="margin:10px 0;padding:10px 12px;background:rgba(58,90,63,0.06);border:1px solid var(--border-color);border-radius:8px;max-height:180px;overflow-y:auto;">' +
        '<div style="font-size:0.82rem;font-weight:700;color:var(--forest);margin-bottom:6px;">✓ Eigenständig extrahierte Aufgaben (' + extracted.length + ', sortiert AFB I → III):</div>' +
        extracted.map(function (tk) {
          return '<div style="font-size:0.8rem;margin-bottom:6px;line-height:1.4;"><b>[' + esc(LT.AFB_LABELS[tk.afb] || ('AFB ' + tk.afb)) + '] ' + esc(tk.title) + ':</b> ' + esc(tk.text) + '</div>';
        }).join('') +
      '</div>';
    }
    var overlay = document.createElement('div');
    overlay.className = 'modal show';
    overlay.style.zIndex = '25000';
    overlay.innerHTML =
      '<div class="modal-content" style="max-width: 620px;">' +
        '<button class="modal-close" aria-label="Schließen">&times;</button>' +
        '<h2 class="modal-title">📄 ' + esc(fl.name) + '</h2>' +
        '<p class="modal-desc">Hier siehst du die automatisch extrahierten Aufgaben sowie den Seitentext. Beim Speichern werden die Aufgaben automatisch neu aus dem Text extrahiert:</p>' +
        extHtml +
        '<div class="form-group" style="margin:12px 0;">' +
          '<label>Seitentext / Aufgaben zum Blatt</label>' +
          '<textarea class="form-control" id="lp-file-text-inp" rows="8" placeholder="Ganze Seite oder Aufgaben hier einfügen …">' + esc(fl.text || '') + '</textarea>' +
        '</div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
          '<button type="button" class="btn btn-outline" data-act="cancel">Abbrechen</button>' +
          '<button type="button" class="btn btn-gold" data-act="save" style="width:auto;">🔍 Aufgaben neu extrahieren &amp; speichern</button>' +
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
        fl.extractedTasks = fl.text ? extractTasksFromPageText(fl.text) : [];
        save();
        rerenderSubject(fk);
        markStale();
        close();
        toast(fl.extractedTasks.length
          ? ('✓ ' + fl.extractedTasks.length + ' Aufgaben erfolgreich extrahiert & gespeichert!')
          : 'Text zum Übungsblatt gespeichert ✓');
      }
    });
    document.body.appendChild(overlay);
  }

  /* ──────────────────────────────────────────────────────────
     1-KLICK-KOPIER-KASTEN FÜR ALLE KI-PROMPTS
     ────────────────────────────────────────────────────────── */
  function buildCopyBoxHtml(promptText, title, hintText, closeable) {
    var h = '<div class="lp-copy-box lp-inline-copy-box">';
    h += '<div class="lp-copy-box-head">';
    h += '<span>📋 ' + esc(title || 'KI-Prompt') + '</span>';
    h += '<div class="lp-copy-box-btns">';
    h += '<button type="button" class="lp-copy-btn" data-copy-box-btn="1">📋 Kopieren</button>';
    h += '<a href="' + GEMINI_URL + '" target="_blank" rel="noopener noreferrer" class="lp-copy-btn lp-copy-btn--gold">🚀 Gemini öffnen ↗</a>';
    if (closeable !== false) {
      h += '<button type="button" class="lp-copy-btn" data-copy-box-close="1" title="Kasten schließen" style="background:transparent;color:var(--text-secondary);">✕</button>';
    }
    h += '</div></div>';
    h += '<textarea class="lp-copy-textarea" rows="5" readonly aria-label="KI-Prompt zum Kopieren">' + esc(promptText) + '</textarea>';
    if (hintText) {
      h += '<div class="lp-copy-steps"><span>' + hintText + '</span></div>';
    }
    h += '</div>';
    return h;
  }

  function showInlinePromptBox(anchorEl, promptText, title, hintText) {
    if (!anchorEl) return;
    var container = anchorEl.closest('.lp-s-main, .lp-file-item, .lp-summary, .lp-diag-card, .lp-subject-body') || anchorEl.parentNode;
    if (!container) return;
    var existing = container.querySelector('.lp-inline-copy-box');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    Array.prototype.forEach.call(container.querySelectorAll('[data-hidden-by-box]'), function (b) {
      b.style.display = '';
      b.removeAttribute('data-hidden-by-box');
    });
    var actType = anchorEl.getAttribute('data-act');
    if (anchorEl.closest('.lp-s-tools') && (actType === 'quiz' || actType === 'fehler')) {
      anchorEl.setAttribute('data-hidden-by-box', '1');
      anchorEl.style.display = 'none';
    }
    var wrap = document.createElement('div');
    wrap.innerHTML = buildCopyBoxHtml(promptText, title, hintText, true);
    var boxEl = wrap.firstChild;
    container.appendChild(boxEl);
    if (boxEl.scrollIntoView) {
      boxEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function initGlobalCopyBoxEvents() {
    document.addEventListener('click', function (e) {
      var copyBtn = e.target.closest('[data-copy-box-btn]');
      if (copyBtn) {
        var box = copyBtn.closest('.lp-copy-box');
        var ta = box ? box.querySelector('.lp-copy-textarea') : null;
        if (!ta) return;
        var txt = ta.value || '';
        ta.focus();
        ta.select();
        LT.copyToClipboard(txt).then(function (ok) {
          if (ok) {
            var orig = copyBtn.textContent;
            copyBtn.textContent = '✓ Kopiert!';
            setTimeout(function () { copyBtn.textContent = orig; }, 2200);
            toast('Prompt in die Zwischenablage kopiert ✓');
          }
        });
        return;
      }
      var closeBtn = e.target.closest('[data-copy-box-close]');
      if (closeBtn) {
        var cBox = closeBtn.closest('.lp-inline-copy-box');
        if (cBox && cBox.parentNode) {
          var parent = cBox.parentNode;
          parent.removeChild(cBox);
          Array.prototype.forEach.call(parent.querySelectorAll('[data-hidden-by-box]'), function (b) {
            b.style.display = '';
            b.removeAttribute('data-hidden-by-box');
          });
        }
      }
    });
  }

  function copyFilePrompt(fk, fid, mode, triggerBtn) {
    var fl = findFile(fk, fid);
    if (!fl) { toast('Übungsblatt nicht gefunden.'); return; }
    var st = getSub(fk);
    var hasTxt = !!(fl.text && fl.text.trim());
    var ext = ensureFileTasksExtracted(fl);
    var ops = ['I', 'II', 'III'].map(function (a) { return LT.AFB_LABELS[a] + ': ' + LT.getOperatorNames(fk, a, 6); }).join('\n');
    var p = 'Du bist meine Fachlehrkraft für ' + fachName(fk) + ' (Oberstufe Baden-Württemberg, Ziel: 15 Notenpunkte).\n\n';

    if (fk === 'deutsch') {
      if (mode === 'twin') {
        p += 'AUFGABE (DEUTSCH-AUFSATZTRAINING): Erstelle mir passend zu meinem hochgeladenen Text/Arbeitsblatt „' + fl.name + '“ eine NEUE, vergleichbare Übungs-Kurzgeschichte (bzw. einen Primärtext im gleichen Stil & Schwierigkeitsgrad, durchgehend alle 5 Zeilen mit [Z. 5], [Z. 10] … nummeriert) sowie EINE authentische baden-württembergische Aufsatz-Aufgabenstellung.\n';
        p += '• Gib zuerst nur den neuen Text (mit Zeilennummern) und die Aufsatz-Aufgabenstellung an.\n';
        p += '• Gib darunter (hinter einer deutlichen Trennlinie) einen strukturierten Erwartungshorizont UND einen vollständig ausformulierten 15-Punkte-Musteraufsatz nach dem 7-Schritte-Bauplan (Einleitung mit Hypothese → Inhaltsangabe im Konjunktiv I → Hauptteil Block 1–4 im 15-Punkte-Dreischritt → Fazit) an.\n';
      } else {
        p += 'AUFGABE (DEUTSCH-MUSTERAUFSATZ & INTERPRETATIONSHILFE): Hilf mir beim Interpretieren meines hochgeladenen Textes/Übungsblatts „' + fl.name + '“.\n';
        p += '• Extrahiere zuerst eigenständig die Aufgabenstellung(en) und den Primärtext aus der Seite.\n';
        p += '• Erstelle danach einen übersichtlichen Schreibplan (Sinnabschnitte, zentrale Deutungshypothese, Analysestern für Block 1–4).\n';
        p += '• Schreibe anschließend einen vollständig ausformulierten **15-Punkte-Musteraufsatz im Fließtext** (1. Einleitung & Deutungshypothese → 2. Strukturierte Inhaltsangabe im Präsens & Konjunktiv I → 3.–6. Hauptteil Block 1–4 im 15-Punkte-Dreischritt [Form → Zitat + Zeile → Deutung] → 7. Schluss/Fazit).\n';
        p += '• Wenn ich dir gleich meinen eigenen Aufsatz mitschicke, korrigiere ihn Satz für Satz nach BW-Maßstab (0–15 Punkte).\n';
      }
    } else if (mode === 'twin') {
      p += 'AUFGABE: Extrahiere zuerst eigenständig alle Übungsaufgaben aus meiner hochgeladenen Seite / meinem Blatt „' + fl.name + '“ (ignoriere reinen Erklär-/Theorietext auf der Seite) und erstelle mir dazu neue PARALLELAUFGABEN (Zwillingsaufgaben) mit gezielter Schwierigkeits-Steigerung (AFB I Einstieg → AFB II Routine → AFB III 15-Punkte-Transfer) und denselben Operatoren.\n';
      p += '• Gib zuerst die aus meiner Seite extrahierten Originalaufgaben + direkt passend dazu die neuen Parallelaufgaben (sortiert nach Schwierigkeit, mit Punktzahl/AFB) an.\n';
      p += '• Gib erst ganz am Ende (deutlich abgetrennt) einen vollständigen, kleinschrittigen Erwartungshorizont auf 15-Punkte-Niveau an.\n';
    } else {
      p += 'AUFGABE: Hilf mir beim Bearbeiten meiner eingefügten Seite / meines Übungsblatts „' + fl.name + '“.\n';
      p += '• **1. Aufgaben eigenständig extrahieren & sortieren:** Extrahiere zuerst alle einzelnen Übungsaufgaben (inkl. Teilaufgaben a, b, c …) vollständig aus der Seite (filtere allgemeinen Buch-/Theorietext heraus) und sortiere sie nach Schwierigkeit (**AFB I Einstieg → AFB II Routine → AFB III 15-Punkte-Transfer**), damit ich die Aufgaben klar vor mir habe.\n';
      p += '• **2. 15-Punkte-Musterlösungen:** Erstelle danach zu jeder extrahierten Aufgabe eine vollständige, kleinschrittige 15-Punkte-Musterlösung (inkl. Lösungsweg, Fachbegriffen und Erklärung typischer Klausurfallen).\n';
      p += '• Wenn ich dir gleich meine eigenen Lösungen mitschicke, korrigiere sie streng nach BW-Maßstab und erkläre mir jeden Fehler.\n';
    }

    if (ops.replace(/AFB I+: /g, '').trim()) {
      p += '\nOffizielle Operatoren in ' + fachName(fk) + ' (Baden-Württemberg):\n' + ops + '\n';
    }
    if (st.zusatz && st.zusatz.trim()) {
      p += '\nMein Zusatzwissen aus dem Unterricht:\n' + st.zusatz.trim() + '\n';
    }
    if (ext.length) {
      p += '\n=== BEREITS AUTOMATISCH EXTRAHIERTE AUFGABEN AUS DER SEITE (' + ext.length + ' Aufgaben, sortiert AFB I → III) ===\n';
      ext.forEach(function (tk) {
        p += '• [' + (LT.AFB_LABELS[tk.afb] || ('AFB ' + tk.afb)) + '] ' + tk.title + ': ' + tk.text + '\n';
      });
    }
    if (hasTxt) {
      p += '\n=== VOLLSTÄNDIGER SEITENTEXT DES ÜBUNGSBLATTS (' + fl.name + ') ===\n' + fl.text.trim() + '\n';
    } else {
      p += '\n=== HINWEIS ZUR SEITE / ZUM ÜBUNGSBLATT (' + fl.name + ') ===\nIch hänge die Seite / das Übungsblatt „' + fl.name + '“ als PDF oder Bild direkt an diese Nachricht an. Bitte extrahiere daraus eigenständig alle Aufgaben!\n';
    }

    var boxTitle = (mode === 'twin' ? 'Parallelaufgaben-Prompt: ' : 'Musterlösungs-Prompt: ') + fl.name;
    var boxHint = hasTxt
      ? '✓ Die extrahierten Aufgaben (' + ext.length + ') und der Seitentext sind bereits komplett im Prompt enthalten.'
      : '📎 Vergiss nicht, die Datei „' + esc(fl.name) + '“ im KI-Chat über + anzuhängen!';
    if (triggerBtn) {
      showInlinePromptBox(triggerBtn, p, boxTitle, boxHint);
    }

    LT.copyToClipboard(p).then(function (ok) {
      if (!ok) return;
      if (hasTxt) {
        toast('Prompt inkl. extrahierter Aufgaben im Kasten geöffnet & kopiert! Neuer Gemini-Chat → Strg+V.', true);
      } else {
        toast('Prompt geöffnet & kopiert! Neuer Gemini-Chat → Strg+V + Datei „' + fl.name + '“ anhängen.', true);
      }
    });
  }

  function initSubjectEvents() {
    var box = $('lp-subjects');
    var chipBox = $('lp-subject-chips');
    var showAllBtn = $('lp-show-all-subjects');

    if (chipBox) {
      chipBox.addEventListener('click', function (e) {
        var chip = e.target.closest('[data-chip-fach]');
        if (!chip) return;
        var fk = chip.getAttribute('data-chip-fach');
        if (!fk) return;
        if (uiState.showAllSubjects) {
          uiState.showAllSubjects = false;
        }
        if (uiState.openSubjects[fk] && !isSubjectActive(fk)) {
          delete uiState.openSubjects[fk];
        } else {
          uiState.openSubjects[fk] = true;
        }
        renderSubjects();
        var det = box.querySelector('details.lp-subject[data-fach="' + fk + '"]');
        if (det && det.scrollIntoView) {
          det.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }

    if (showAllBtn) {
      showAllBtn.addEventListener('click', function () {
        uiState.showAllSubjects = !uiState.showAllSubjects;
        renderSubjects();
      });
    }

    box.addEventListener('change', function (e) {
      var t = e.target, act = t.getAttribute('data-act');
      if (!act) return;
      var det = t.closest('details.lp-subject');
      if (!det) return;
      var fk = det.getAttribute('data-fach'), key = t.getAttribute('data-key'), st = getSub(fk);
      if (act === 'sel') {
        uiState.openSubjects[fk] = true;
        setTopic(fk, key, 'selected', t.checked);
        rerenderSubject(fk);
        renderExamsOverview();
      } else if (act === 'lvl') {
        setTopic(fk, key, 'level', +t.value);
      } else if (act === 'task-mode') {
        st.taskMode = t.value;
        st.attachInAi = (t.value !== 'ai');
        save();
        rerenderSubject(fk);
      } else if (act === 'attach-ai') {
        st.attachInAi = !!t.checked;
        save();
      } else if (act === 'exam') {
        st.exam = t.value;
        save();
        updateSummary(fk);
        renderExamsOverview();
      } else if (act === 'sim') {
        st.simMinutes = +t.value;
        save();
        renderExamsOverview();
      } else if (act === 'file-upload') {
        uiState.openSubjects[fk] = true;
        handleFilesUpload(fk, t.files);
        t.value = '';
        return;
      } else return;
      markStale();
    });

    box.addEventListener('input', function (e) {
      var t = e.target;
      var act = t.getAttribute('data-act');
      var det = t.closest('details.lp-subject');
      if (!det) return;
      var fk = det.getAttribute('data-fach');
      if (act === 'zusatz') {
        getSub(fk).zusatz = t.value;
        save();
      } else if (act === 'task-note') {
        getSub(fk).taskNote = t.value;
        save();
        renderSubjectChips();
        renderStepBadges();
      }
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
      } else if (act === 'paste-page') {
        openPastePageModal(fk);
      } else if (act === 'file-solve') {
        copyFilePrompt(fk, fid, 'solve', b);
      } else if (act === 'file-twin') {
        copyFilePrompt(fk, fid, 'twin', b);
      } else if (act === 'file-edit') {
        openFileEditModal(fk, fid);
      } else if (act === 'file-del') {
        var stf = getSub(fk);
        stf.files = (stf.files || []).filter(function (fl) { return fl.id !== fid; });
        save();
        rerenderSubject(fk);
        renderExamsOverview();
        markStale();
        toast('Übungsblatt entfernt.');
      } else if (act === 'del') {
        var st = getSub(fk), id = key.slice(2);
        st.custom = st.custom.filter(function (c) { return String(c.id) !== id; });
        save();
        rerenderSubject(fk);
        renderExamsOverview();
        markStale();
      } else if (act === 'add') {
        addCustom(fk, det);
      } else if (act === 'reset-fach') {
        state.settings.subjects[fk] = { topics: {}, custom: [], files: [], exam: '', simMinutes: defaultSimMin(fk), zusatz: '', taskMode: 'both', attachInAi: true, taskNote: '' };
        save();
        rerenderSubject(fk);
        renderExamsOverview();
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
     SCHRITT 2 – Klausurtermine-Übersicht & Lernzeit
     ────────────────────────────────────────────────────────── */
  function renderExamsOverview() {
    var box = $('lp-exams-overview');
    if (!box) return;
    var activeFks = Object.keys(subjectData).filter(function (fk) {
      return isSubjectActive(fk);
    });
    if (!activeFks.length) {
      box.innerHTML = '<div class="lp-box" style="margin-bottom:14px;">⚠️ <b>Noch keine Themen ausgewählt:</b> Wähle zuerst in <button type="button" class="lp-link-btn" data-step-go="1">Schritt 1 (Fächer &amp; Aufgaben)</button> mindestens ein Thema oder Übungsblatt aus, damit du hier die Klausurtermine eintragen kannst.</div>';
      return;
    }
    var h = '<div class="lp-picker-label" style="margin-bottom:8px;">📅 Klausurtermine für deine ausgewählten Fächer:</div>';
    h += '<div class="lp-exam-cards">';
    activeFks.forEach(function (fk) {
      var st = getSub(fk);
      var selCount = subjTopics(fk).filter(function (t) { return t.selected; }).length;
      var fileCount = (st.files || []).length;
      var missing = !validDate(st.exam);
      h += '<div class="lp-exam-card' + (missing ? ' lp-exam-missing' : '') + '">';
      h += '<div class="lp-exam-card-head"><b>' + esc(fachName(fk)) + '</b>';
      h += '<span>' + selCount + ' Themen' + (fileCount ? ' · ' + fileCount + ' Blatt' : '') + '</span></div>';
      h += '<div class="form-group" style="margin:0;"><label style="font-size:0.78rem;">Klausurtermin ' + (missing ? '<span style="color:#B03A2E;">(Pflichtfeld)</span>' : '✓') + '</label>';
      h += '<input type="date" class="form-control" data-act="exam-ov" data-fach="' + esc(fk) + '" value="' + esc(st.exam) + '"></div>';
      h += '<div class="form-group" style="margin:0;"><label style="font-size:0.78rem;">Klausurdauer (Simulation)</label>';
      h += '<select class="form-control" data-act="sim-ov" data-fach="' + esc(fk) + '">';
      [45, 60, 90, 135, 180, 210, 240, 270, 300, 315].forEach(function (m) {
        h += '<option value="' + m + '"' + (+st.simMinutes === m ? ' selected' : '') + '>' + fmtMin(m) + '</option>';
      });
      h += '</select></div></div>';
    });
    h += '</div>';
    box.innerHTML = h;
  }

  function renderTime() {
    var s = state.settings;
    $('lp-start').value = s.start;
    $('lp-block').value = String(s.block);
    $('lp-weekdays').innerHTML = WD.map(function (w, i) {
      return '<label>' + w + '<input type="number" class="form-control" min="0" max="720" step="15" data-wd="' + i + '" value="' + (s.minutes[i] || 0) + '" aria-label="Minuten am ' + w + '"></label>';
    }).join('');
    updateWeekSum();
    renderExamsOverview();
    renderStepBadges();
  }

  function updateWeekSum() {
    var s = state.settings;
    var total = s.minutes.reduce(function (a, b) { return a + b; }, 0);
    var blocks = s.minutes.reduce(function (a, m) { return a + Math.floor(m / s.block); }, 0);
    $('lp-week-sum').textContent = total
      ? 'Zusammen ' + fmtMin(total) + ' pro Woche ≈ ' + blocks + ' Lerneinheiten à ' + s.block + ' Min.'
      : 'Trage mindestens an einem Tag Lernzeit ein.';
    renderStepBadges();
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

    /* Zentrale Klausurtermin-Karten in Schritt 2 */
    var ov = $('lp-exams-overview');
    if (ov) {
      ov.addEventListener('change', function (e) {
        var t = e.target;
        var act = t.getAttribute('data-act');
        var fk = t.getAttribute('data-fach');
        if (!act || !fk) return;
        var st = getSub(fk);
        if (act === 'exam-ov') {
          st.exam = t.value;
          save();
          rerenderSubject(fk);
          renderExamsOverview();
          markStale();
        } else if (act === 'sim-ov') {
          st.simMinutes = +t.value;
          save();
          rerenderSubject(fk);
          markStale();
        }
      });
    }

    /* Schnellwahl-Presets für Wochentage */
    var setupEl = $('lp-setup');
    if (setupEl) {
      setupEl.addEventListener('click', function (e) {
        var stepBtn = e.target.closest('[data-step-go]');
        if (stepBtn) {
          var targetStep = +stepBtn.getAttribute('data-step-go');
          if (targetStep >= 1 && targetStep <= 3) {
            goToStep(targetStep, true);
          }
          return;
        }
        var presetBtn = e.target.closest('[data-preset]');
        if (presetBtn) {
          var p = presetBtn.getAttribute('data-preset');
          if (p === 'normal') state.settings.minutes = [60, 60, 60, 60, 60, 90, 0];
          else if (p === 'intensiv') state.settings.minutes = [90, 90, 90, 90, 90, 120, 120];
          else if (p === 'kompakt') state.settings.minutes = [45, 45, 45, 45, 45, 60, 0];
          save();
          renderTime();
          markStale();
          toast('Lernzeit-Vorlage übernommen ✓');
        }
      });
    }

    var toggleAllBtn = $('lp-toggle-all-steps');
    if (toggleAllBtn) {
      toggleAllBtn.addEventListener('click', function () {
        uiState.allSteps = !uiState.allSteps;
        toggleAllBtn.textContent = uiState.allSteps ? 'Schritt-Ansicht (1–2–3)' : 'Alle Schritte zeigen';
        goToStep(uiState.step, false);
      });
    }
  }

  /* ──────────────────────────────────────────────────────────
     PLANUNG (Fachspezifisch + Hochgeladene Übungsblätter)
     ────────────────────────────────────────────────────────── */
  function buildQueue(t, fk, availBlocksHint) {
    if (t.isFile) {
      var ext = t.extractedTasks || [];
      if (ext.length > 0) {
        /* Alle Aufgaben des Kapitels/Blatts vollständig aufteilen:
           Standardmäßig ca. 3 Aufgaben pro Lerneinheit (oder passend zur verfügbaren Zeit gebündelt),
           sodass JEDE einzelne Aufgabe im Lernplan ihren festen Platz bekommt! */
        var maxUnits = availBlocksHint && availBlocksHint > 0 ? Math.max(1, availBlocksHint) : 20;
        var idealUnits = Math.min(maxUnits, Math.max(1, Math.ceil(ext.length / 3)));
        var chunkSize = Math.max(1, Math.ceil(ext.length / idealUnits));
        var chunks = [];
        for (var c = 0; c < ext.length; c += chunkSize) {
          chunks.push(ext.slice(c, c + chunkSize));
        }
        var fq = [];
        chunks.forEach(function (ch, idx) {
          var unitNo = idx + 1;
          var fid = 'U|' + fk + '|' + t.key + '|' + unitNo;
          if (!state.done[fid]) {
            var shortList = ch.map(function (tk) { return tk.title; }).join(', ');
            var taskLines = ch.map(function (tk) {
              return '• [' + (LT.AFB_LABELS[tk.afb] || ('AFB ' + tk.afb)) + '] ' + tk.title + ': ' + tk.text;
            }).join('\n');
            fq.push({
              type: 'U',
              n: unitNo,
              of: chunks.length,
              afb: 'FILE',
              customMethod: '📘 Heute zu erledigende Aufgaben aus „' + t.rawFileName + '“' +
                (chunks.length > 1 ? (' (Paket ' + unitNo + '/' + chunks.length + ': ' + shortList + ')') : (' (' + shortList + ')')) +
                ':\n' + taskLines
            });
          }
        });
        return fq;
      }
      var singleFid = 'U|' + fk + '|' + t.key + '|1';
      return state.done[singleFid] ? [] : [{ type: 'U', n: 1, of: 1, afb: 'FILE' }];
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
      /* Hochgeladene Seiten / ganze Buchkapitel inkl. ALLER extrahierten Aufgaben sinnvoll auf die verfügbaren Lerntage aufteilen */
      if (files.length) {
        var spanD = Math.max(1, diff(start, st.exam) - 2);
        var totalBlocksBeforeExam = 0;
        for (var di = 0; di < spanD; di++) {
          var dDate = addDays(start, di);
          var dCap = state.settings.minutes[wdIdx(dDate)] || 0;
          totalBlocksBeforeExam += Math.floor(dCap / (state.settings.block || 45));
        }
        var freeBlocksForFiles = Math.max(files.length, totalBlocksBeforeExam - sub.remaining - 2);
        var perFileBlocks = Math.max(1, Math.floor(freeBlocksForFiles / files.length));

        files.forEach(function (fl) {
          var ext = ensureFileTasksExtracted(fl);
          var fKey = 'file:' + fl.id;
          var ft = {
            uid: fk + '|' + fKey, key: fKey, fileId: fl.id, rawFileName: fl.name,
            title: '📄 ' + fl.name + (ext.length ? (' (' + ext.length + ' Aufgaben)') : ''),
            extractedTasks: ext,
            link: '', note: '', level: 2, important: true, sub: sub, ptr: 0, anchor: null, isFile: true
          };
          ft.queue = buildQueue(ft, fk, perFileBlocks);
          sub.remaining += ft.queue.length;
          sub.topics.push(ft);
        });
      }
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
        n: o.n || 0, of: o.of || 0, optional: !!o.optional,
        customMethod: o.customMethod || ''
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
        add(day, mk(tk.type, best.sub, best, { min: block, n: tk.n, of: tk.of, afb: tk.afb, customMethod: tk.customMethod || '' }));
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
    if (x.customMethod && x.customMethod.trim()) {
      return esc(x.customMethod.trim()).replace(/\n+/g, '<br>');
    }
    var prof = getProfile(x.fk);
    var st = getSub(x.fk);
    var tn = (st.taskNote || '').trim();
    switch (x.type) {
      case 'E':
        return x.n === 1 ? prof.e1 : prof.e2;
      case 'U':
        if (x.afb === 'FILE') {
          return x.fk === 'deutsch'
            ? '<b>Eigenen Text interpretieren:</b> Sinnabschnitte &amp; Stilmittel markieren, Aufsatz schreiben und danach mit dem KI-Musteraufsatz abgleichen.'
            : '<b>Eigenes Übungsblatt lösen:</b> Aufgaben selbstständig bearbeiten und danach mit der KI-Musterlösung kontrollieren.';
        }
        var uSpec = prof['u' + x.afb] || prof.uMIX || '';
        if (tn && (st.taskMode === 'both' || st.taskMode === 'own')) {
          return uSpec + ' <span style="color:var(--forest);">· 📎 Eigene Aufgaben: ' + esc(tn) + '</span>';
        }
        return uSpec;
      case 'R':
        return prof.r;
      case 'SIM':
        if (x.fk === 'deutsch') {
          return '<b>Probe-Aufsatz unter Klausurbedingungen (' + fmtMin(x.min) + '):</b> Kurzgeschichte gliedern und kompletten Aufsatz nach dem 7-Schritte-Bauplan im Fließtext schreiben.';
        }
        return '<b>Klausur-Simulation (' + fmtMin(x.min) + ' am Stück):</b> Ohne Spicken unter echten Prüfungsbedingungen lösen, danach mit dem Erwartungshorizont bewerten.';
      case 'FEHLER':
        if (x.fk === 'deutsch') {
          return '<b>Aufsatz-Lektorat:</b> Probe-Aufsatz von der KI nach BW-Maßstab (0–15 Punkte) korrigieren lassen und schwächste Absätze überarbeiten.';
        }
        return '<b>Fehleranalyse:</b> Fehler aus der Simulation durchgehen, Ursachen klären und schwächste Aufgabentypen gezielt nachüben.';
      case 'FINAL':
        return '<b>Letzter Check:</b> Überblick, wichtigste Formeln/Satzschablonen &amp; Anki-Karten kurz durchgehen – kein neuer Stoff mehr.';
      case 'V':
        return '<b>Puffer / 15-Punkte-Training:</b> Verpasstes nachholen oder eine anspruchsvolle AFB-III-Transferaufgabe üben.';
    }
    return '';
  }

  function metaText(x) {
    var p = [fmtMin(x.min)];
    if (x.type === 'E' && x.of > 1) p.push('Einheit ' + x.n + '/' + x.of);
    if (x.type === 'U') {
      if (x.afb === 'FILE') p.push(x.fk === 'deutsch' ? 'Eigener Übungstext / Arbeitsblatt' : 'Eigenes Übungsblatt');
      else if (x.fk === 'deutsch' && DEUTSCH_BAUSTEIN_LABELS[x.afb]) p.push(DEUTSCH_BAUSTEIN_LABELS[x.afb]);
      else p.push(x.afb === 'MIX' ? 'Klausur-Mix' : (LT.AFB_LABELS[x.afb] || x.afb));
    }
    if (x.type === 'R' && x.n) p.push(x.n + '. Wiederholung (Spaced Repetition)');
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
    var lz = x.link ? '<a class="lp-tool" href="' + esc(x.link) + '" target="_blank" rel="noopener">Lernzettel</a>' : '';
    var anki = x.link ? '<a class="lp-tool" href="' + esc(deepLink('anki', x)) + '" target="_blank" rel="noopener">Anki-Karten</a>' : '';
    var isDe = x.fk === 'deutsch';
    var hasAiBox = !!(x.aiPrompt && x.aiPrompt.trim());
    function quiz(afb, label) {
      if (hasAiBox) return '';
      return '<button type="button" class="lp-tool lp-tool-gold" data-act="quiz" data-afb="' + afb + '"' + k + '>📋 ' + label + '</button>';
    }
    if (x.type === 'U' && x.afb === 'FILE' && x.key && x.key.indexOf('file:') === 0) {
      var fid = esc(x.key.slice(5));
      var fkAttr = ' data-fach="' + esc(x.fk) + '" data-fid="' + fid + '"';
      h = '<button type="button" class="lp-tool lp-tool-gold" data-act="file-solve"' + fkAttr + '>' + (isDe ? '📋 Musteraufsatz (Prompt)' : '📋 Musterlösung (Prompt)') + '</button>' +
          '<button type="button" class="lp-tool lp-tool-gold" data-act="file-twin"' + fkAttr + '>' + (isDe ? '🔁 Neue Kurzgeschichte' : '🔁 Parallelaufgaben') + '</button>';
      return '<div class="lp-s-tools">' + h + '</div>';
    }
    switch (x.type) {
      case 'E':
        h = lz + quiz('I', isDe ? 'Übungs-Kurzgeschichte (Prompt)' : 'Verständnis-Quiz (Prompt)') + anki;
        if (x.n === 1 && x.link) h += '<a class="lp-tool" href="' + esc(deepLink('notebook', x)) + '" target="_blank" rel="noopener">NotebookLM</a>';
        break;
      case 'U':
        if (isDe) {
          var deBtnLbl = x.afb === 'I'   ? 'Kurzgeschichte · Baustein 1–3 (Prompt)'
                       : x.afb === 'II'  ? 'Kurzgeschichte · Block 2 &amp; 3 (Prompt)'
                       : x.afb === 'III' ? 'Kurzgeschichte · Block 4 &amp; Fazit (Prompt)'
                       : 'Übungs-Kurzgeschichte (Prompt)';
          h = quiz(x.afb, deBtnLbl) + lz;
        } else {
          h = quiz(x.afb, (x.afb === 'MIX' ? 'Klausur-Mix' : (LT.AFB_LABELS[x.afb] || x.afb)) + '-Aufgaben (Prompt)') + lz;
        }
        break;
      case 'R': h = anki + quiz('MIX', isDe ? 'Aufsatz-Training (Prompt)' : 'Mini-Test (Prompt)') + lz; break;
      case 'V': h = quiz('III', isDe ? 'Tiefendeutung (Prompt)' : '15-P-Aufgaben AFB III (Prompt)') + lz; break;
      case 'SIM': h = quiz('SIM', isDe ? 'Deutsch-Klausur (Prompt)' : 'Klausur-Simulation (Prompt)'); break;
      case 'FEHLER':
        if (!hasAiBox) {
          h = '<button type="button" class="lp-tool lp-tool-gold" data-act="fehler"' + k + '>📋 ' + (isDe ? 'Aufsatz-Korrektur (Prompt)' : 'Fehleranalyse (Prompt)') + '</button>';
        }
        break;
      case 'FINAL': h = '<a class="lp-tool" href="index.html?tool=anki&fach=' + encodeURIComponent(x.fk) + '" target="_blank" rel="noopener">Anki</a>'; break;
    }
    var out = h ? '<div class="lp-s-tools">' + h + '</div>' : '';
    if (hasAiBox) {
      out += buildCopyBoxHtml(
        x.aiPrompt.trim(),
        'KI-Prompt / Aufgaben (' + fachName(x.fk) + ')',
        '',
        false
      );
    }
    return out;
  }

  /* ──────────────────────────────────────────────────────────
     PLAN-ANSICHT (MIT FILTER-LEISTE & KOPIER-KÄSTEN)
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
          ? (x.type === 'SIM' ? 'Ganzen Aufsatz schreiben (Kurzgeschichte interpretieren)'
             : x.type === 'FEHLER' ? 'Aufsatz-Korrektur & 15-Punkte-Feinschliff'
             : '7-Schritte-Bauplan & Satzschablonen-Check')
          : (x.title ? esc(x.title) : 'alle Themen'))
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
    p.days.forEach(function (d) { d.sessions.forEach(function (x) { if (x.key || x.title) topicCount[x.fk + '|' + (x.key || x.title)] = 1; }); });
    var fks = (p.exams || []).map(function (e) { return fachName(e.fk); });
    var lastDate = p.days[p.days.length - 1].date;
    var inRange = today >= p.days[0].date && today <= lastDate;

    var h = '<section class="lp-summary">';
    h += '<h2>' + esc(state.name || 'Lernplan') + (p.isAiPlan ? ' <span class="lp-badge lp-gold" style="vertical-align:middle;margin-left:6px;">🤖 KI-Plan</span>' : '') + '</h2>';
    h += '<p class="lp-step-desc">' + fmtDay(p.days[0].date) + ' – ' + fmtDay(lastDate) + (fks.length ? ' · ' + esc(fks.join(', ')) : '') + '</p>';
    h += '<div class="lp-stats">';
    h += '<div class="lp-stat"><b>' + sessions + '</b><span>Einheiten</span></div>';
    h += '<div class="lp-stat"><b>' + Math.round(minutes / 60 * 10) / 10 + '</b><span>Lernstunden</span></div>';
    h += '<div class="lp-stat"><b>' + Object.keys(topicCount).length + '</b><span>Themen / Blätter</span></div>';
    if (nextExam) h += '<div class="lp-stat"><b>' + diff(today, nextExam.date) + '</b><span>Tage bis ' + esc(fachName(nextExam.fk)) + '</span></div>';
    h += '</div>';
    h += '<div class="lp-progress"><div id="lp-prog-bar" style="width:0%"></div></div><p id="lp-prog-label" class="lp-progress-label"></p>';
    h += '<div id="lp-stale"></div>';

    (p.warnings || []).forEach(function (w) { h += '<div class="lp-box lp-warn">' + esc(w) + '</div>'; });

    h += '<div class="lp-toolbar">';
    if (inRange) h += '<button type="button" class="btn btn-gold" data-act="today">Zu heute</button>';
    h += '<button type="button" class="btn btn-gold" data-act="export">📤 Export / Backup</button>';
    h += '<button type="button" class="btn btn-outline" data-act="print">🖨️ PDF / Drucken</button>';
    h += '<button type="button" class="btn btn-outline" data-act="coach">📋 KI-Coach</button>';
    h += '<button type="button" class="btn btn-outline" data-act="edit">⚙️ Einstellungen</button>';
    h += '<button type="button" class="btn btn-danger" data-act="delete">🗑️ Löschen</button>';
    h += '</div></section>';

    /* --- Filter-Leiste für deutlich bessere Übersicht auf allen Geräten --- */
    h += '<div class="lp-filter-bar lp-noprint">';
    h += '<span class="lp-filter-label">🔍 Ansicht:</span>';
    var filters = [
      { id: 'all',    label: '📅 Alle Tage (' + p.days.length + ')' },
      { id: 'focus',  label: '🎯 Fokus: Heute &amp; 3 Tage' },
      { id: 'open',   label: '⏳ Nur offene Einheiten' },
      { id: 'future', label: '⏭️ Vergangene ausblenden' }
    ];
    filters.forEach(function (f) {
      h += '<button type="button" class="lp-filter-chip' + (uiState.planFilter === f.id ? ' lp-filter-active' : '') + '" data-act="filter-plan" data-filter="' + f.id + '">' + f.label + '</button>';
    });
    h += '</div>';

    var filteredDays = p.days.filter(function (d) {
      if (uiState.planFilter === 'future') return d.date >= today;
      if (uiState.planFilter === 'focus') {
        var delta = diff(today, d.date);
        return delta >= 0 && delta <= 3;
      }
      if (uiState.planFilter === 'open') {
        if (examsByDate[d.date]) return true;
        return d.sessions.some(function (x) { return !state.done[x.id] && !x.missed; });
      }
      return true;
    });

    if (!filteredDays.length) {
      h += '<div class="lp-box" style="text-align:center;padding:20px;">Für diesen Filter sind aktuell keine Tage sichtbar. <button type="button" class="lp-tool lp-tool-gold" data-act="filter-plan" data-filter="all" style="margin-left:8px;">Alle Tage anzeigen</button></div>';
    }

    var curWeek = null, weekNo = 0;
    filteredDays.forEach(function (d) {
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
      el.innerHTML = '<div class="lp-box"><strong>Einstellungen geändert.</strong> ' +
        '<button type="button" class="lp-tool lp-tool-gold" data-act="edit">In den Einstellungen aktualisieren</button></div>';
    } else {
      el.innerHTML = '';
    }
  }

  function setupVisible(show) {
    $('lp-setup').style.display = show ? '' : 'none';
    var b = $('lp-generate');
    var sp = b ? b.querySelector('span') : null;
    if (sp) sp.textContent = state.plan ? 'Sofort-Plan neu berechnen' : 'Sofort-Plan erstellen';
  }

  /* ──────────────────────────────────────────────────────────
     SCHRITT 3 – OPTION A: KI-MASTER-PROMPT & KI-PLAN-IMPORT
     ────────────────────────────────────────────────────────── */
  function buildTaskInstructionForPrompt(fk) {
    var st = getSub(fk);
    var tm = st.taskMode || 'both';
    var tn = (st.taskNote || '').trim();
    var hasFiles = !!(st.files && st.files.length);
    var lines = [];
    if (tm === 'own') {
      lines.push('• AUFGABEN-STRATEGIE: **Fokus auf meine eigenen Aufgaben / mein Buchkapitel – ALLE vorhandenen Aufgaben müssen vollständig im Lernplan untergebracht und sinnvoll auf die Lerntage aufgeteilt werden (sortiert nach Unterthema & Schwierigkeit AFB I → AFB II → AFB III)**.');
    } else if (tm === 'both') {
      lines.push('• AUFGABEN-STRATEGIE: **ALLE meine eigenen Aufgaben (aus meinem Buchkapitel / Übungsblatt) vollständig einplanen & sinnvoll auf die Lerntage aufteilen + wo nötig gezielte KI-Zusatzaufgaben ergänzen (AFB I → AFB II → AFB III)**.');
    } else {
      lines.push('• AUFGABEN-STRATEGIE: **Erstelle mir neue, abiturreife 15-Punkte-Übungsaufgaben mit klarer Schwierigkeits-Steigerung (AFB I → AFB II → AFB III)**.');
    }
    if (st.attachInAi !== false && (tm === 'both' || tm === 'own')) {
      lines.push('• PFLICHT BEI GANZEN BUCHKAPITELN / SEITEN: Wenn ich ein ganzes Kapitel aus dem Buch (oder mehrere Seiten/Arbeitsblätter) reinstelle bzw. anhänge, **extrahiere daraus eigenständig ausnahmslos ALLE Aufgaben (inkl. Teilaufgaben a, b, c …)**! Lass keine Aufgabe weg, sondern übernimm für mich die **sinnvolle Aufteilung auf meine Lerntage**, sodass ich an jedem Tag genau weiß, **welche Aufgaben (mit Seite, Nummer & vollem Wortlaut)** ich an diesem Tag zu tun habe!');
    }
    if (tn) {
      lines.push('• MEINE VORHANDENEN AUFGABEN / MATERIALIEN: ' + tn);
    }
    if (hasFiles) {
      st.files.forEach(function (fl) {
        var ext = ensureFileTasksExtracted(fl);
        if (ext.length) {
          lines.push('• BEREITS EXTRAHIERTE AUFGABEN AUS „' + fl.name + '“ (insgesamt ' + ext.length + ' Aufgaben – bitte ALLE ' + ext.length + ' Aufgaben sinnvoll auf die Lerntage verteilen!):');
          ext.forEach(function (tk, idx) {
            lines.push('  ' + (idx + 1) + '. [' + (LT.AFB_LABELS[tk.afb] || ('AFB ' + tk.afb)) + '] ' + tk.title + ': ' + tk.text.replace(/\n+/g, ' / '));
          });
        }
        if (fl.text && fl.text.trim()) {
          lines.push('• VOLLSTÄNDIGER TEXT DES KAPITELS / DER SEITEN „' + fl.name + '“ (bitte sicherstellen, dass wirklich ALLE darin vorkommenden Aufgaben im Lernplan aufgeteilt sind):\n' + fl.text.trim().slice(0, 50000));
        } else {
          lines.push('• HOCHGELADENES KAPITEL / SEITEN „' + fl.name + '“ (wird als PDF/Bild im Chat angehängt – bitte ALLE Aufgaben daraus eigenständig extrahieren und komplett auf die Lerntage aufteilen!).');
        }
      });
    }
    return lines.join('\n');
  }

  function generateMasterPrompt() {
    var err = $('lp-error');
    if (err) err.textContent = '';
    var s = state.settings;
    var today = todayStr();
    var start = s.start > today ? s.start : today;

    if (!s.minutes.some(function (m) { return m >= s.block; })) {
      if (err) err.textContent = 'Trage in Schritt 2 an mindestens einem Wochentag genug Lernzeit für eine Lerneinheit (' + s.block + ' Min.) ein.';
      return;
    }
    var c = collectSubjects(start);
    if (c.errors.length) {
      if (err) err.textContent = c.errors.join(' ');
      return;
    }
    if (!c.subs.length) {
      if (err) err.textContent = 'Wähle in Schritt 1 zuerst mindestens ein Thema oder lade ein Übungsblatt hoch.';
      return;
    }

    var btn = $('lp-btn-master-prompt');
    var origText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Lade Lernzettel & erstelle 15-Punkte-Master-Prompt …'; }

    var allSelectedTopics = [];
    c.subs.forEach(function (sub) {
      subjTopics(sub.fk).filter(function (t) { return t.selected; }).forEach(function (t) {
        allSelectedTopics.push({ fk: sub.fk, title: t.title, link: t.link, note: t.note, level: t.level, important: t.important });
      });
    });

    LT.loadTopicsText(allSelectedTopics.map(function (t) { return { title: fachName(t.fk) + ' – ' + t.title, link: t.link, note: t.note }; }))
      .catch(function () { return ''; })
      .then(function (loadedLzText) {
        var lastExam = c.subs.reduce(function (m, x) { return x.exam > m ? x.exam : m; }, start);
        var totalDays = Math.min(60, diff(start, lastExam) + 1);
        var calLines = [];
        for (var i = 0; i < totalDays; i++) {
          var dStr = addDays(start, i);
          var cap = s.minutes[wdIdx(dStr)] || 0;
          var exFks = c.subs.filter(function (sub) { return sub.exam === dStr; }).map(function (sub) { return fachName(sub.fk); });
          calLines.push('  - ' + dStr + ' (' + WD[wdIdx(dStr)] + '): ' + cap + ' Min. Lernzeit verfügbar' + (exFks.length ? ' [🔥 KLAUSURTAG: ' + exFks.join(', ') + ']' : ''));
        }

        var p = 'Du bist mein persönlicher 15-Punkte-Oberstufen-Tutor und Abitur-Prüfer an einem allgemeinbildenden Gymnasium in Baden-Württemberg (Bildungsplan 2016).\n';
        p += 'Mein Ziel sind **15 Notenpunkte (sehr gut plus)** – also volle Punktzahl in AFB I (Reproduktion), AFB II (Reorganisation/Anwendung) und insbesondere **AFB III (Transfer, Problemlösen, Begründung & Urteil)**.\n\n';

        p += '============================================================\n';
        p += '1. MEINE FÄCHER, THEMEN, KÖNNENSSTAND & AUFGABEN-STRATEGIE\n';
        p += '============================================================\n';
        c.subs.forEach(function (sub) {
          var fk = sub.fk;
          var st = sub.st;
          p += '\n### FACH: ' + fachName(fk).toUpperCase() + ' (Fach-Kürzel für den Export: `' + fk + '`)\n';
          p += '• Klausurtermin: ' + sub.exam + ' (' + fmtDay(sub.exam) + ') · Dauer der Klausur-Simulation: ' + st.simMinutes + ' Min.\n';
          if (fk === 'mathe') {
            p += '• Fach-Anforderung (BW): Ca. 20 % Regeln/Kochrezept verstehen, **80 % aktives Rechnen, Anwenden und Begründen** (Hilfsmittelfreier Pflichtteil + Wahlteil, „Begründen Sie“ / „Entscheiden Sie“ / Parameter / grafisches Ableiten).\n';
          } else if (fk === 'deutsch') {
            p += '• Fach-Anforderung (BW): **Einen durchgehenden Aufsatz im Fließtext schreiben** nach dem **7-Schritte-Klausur-Bauplan** (1. Einleitung & Deutungshypothese → 2. Strukturierte Inhaltsangabe im Präsens/Konjunktiv I → 3. Block 1: Rahmen/Einstieg/Grundstimmung → 4. Block 2: Hauptfigur & innerer Konflikt/Erlebte Rede → 5. Block 3: Figurenkonstellation & Kommunikation → 6. Block 4: Wendepunkt/Dingsymbol/Titel/offener Schluss → 7. Fazit) im 15-Punkte-Dreischritt (Form → Zitat + Zeile → Deutung).\n';
          }
          var selT = subjTopics(fk).filter(function (t) { return t.selected; });
          if (selT.length) {
            p += '• Ausgewählte Themen & mein aktueller Stand (1 = Neu, 2 = Unsicher, 3 = Grundlagen sitzen, 4 = Sicher):\n';
            selT.forEach(function (t) {
              p += '  - „' + t.title + '“ → Stufe ' + t.level + '/4 (' + LEVELS[t.level - 1].label + ')' + (t.important ? ' [★ BESONDERS KLAUSURRELEVANT]' : '') + '\n';
            });
          }
          var ops = ['I', 'II', 'III'].map(function (a) { return '  - ' + LT.AFB_LABELS[a] + ': ' + LT.getOperatorNames(fk, a, 8); }).join('\n');
          if (ops.trim()) {
            p += '• Offizielle BW-Operatoren:\n' + ops + '\n';
          }
          p += buildTaskInstructionForPrompt(fk) + '\n';
          if (st.zusatz && st.zusatz.trim()) {
            p += '• Zusatzwissen / Hinweise meiner Lehrkraft:\n  ' + st.zusatz.trim().replace(/\n+/g, '\n  ') + '\n';
          }
        });

        p += '\n============================================================\n';
        p += '2. MEIN VERFÜGBARER ZEITRAHMEN & KALENDER\n';
        p += '============================================================\n';
        p += '• Bevorzugte Länge einer Lerneinheit: ' + s.block + ' Minuten (+ Pause danach)\n';
        p += '• Verfügbare Lerntage von ' + start + ' bis ' + lastExam + ':\n' + calLines.join('\n') + '\n';

        p += '\n============================================================\n';
        p += '3. DEIN AUFTRAG FÜR MEINEN 15-PUNKTE-LERNPLAN (ALLE AUFGABEN SINNVOLL AUFTEILEN)\n';
        p += '============================================================\n';
        p += '1. **ALLE Aufgaben aus meinem Buchkapitel / meinen Seiten vollständig einplanen & sinnvoll aufteilen (PFLICHT):**\n';
        p += '   - Wenn ich ein ganzes Kapitel aus dem Buch, PDF-Seiten oder Arbeitsblätter mitgegeben habe: **Extrahiere daraus eigenständig ausnahmslos ALLE Übungsaufgaben (inkl. Teilaufgaben a, b, c …)** und filtere bloßen Erklärtext heraus.\n';
        p += '   - **Keine Aufgabe weglassen:** Im fertigen Lernplan müssen **ALLE Aufgaben des Kapitels** untergebracht sein!\n';
        p += '   - **Deine Hauptaufgabe ist die sinnvolle Aufteilung:** Teile mir für jeden Lerntag und jede Lerneinheit genau zu, **wann ich welche Aufgaben (mit Seitenzahl, Aufgabennummer, Teilaufgaben & vollständigem Aufgabenwortlaut)** bearbeiten soll – didaktisch klug geordnet nach den Unterthemen des Kapitels und mit klarer Schwierigkeits-Steigerung (**vom leichten Einstieg AFB I über Routine AFB II bis zum 15-Punkte-Transfer AFB III**).\n';
        p += '   - Schreibe die für den jeweiligen Tag eingeteilten **Aufgaben im vollständigen Wortlaut** sowohl in `AUFGABEN:` (Übersicht, welche Nummern heute dran sind) als auch komplett zwischen `PROMPT_START` und `PROMPT_ENDE`.\n';
        p += '2. **Wissenschaftliche Lernstruktur:**\n';
        p += '   - Plane kurze Erarbeitungs-Einheiten (`E`), die aufeinander aufbauenden Aufgaben-Pakete aus meinem Kapitel (`U` mit `I`, `II`, `III`, `MIX`), kurze Wiederholungen (`R` nach Spaced Repetition), eine echte Klausur-Simulation (`SIM` ca. 3–5 Tage vor der Klausur), eine Fehleranalyse (`FEHLER`) und am Vortag der Klausur nur einen leichten letzten Check (`FINAL`, 30 Min.).\n';
        p += '3. **Alle Folge-Prompts & Tages-Aufgaben für meine Website vorbereiten:**\n';
        p += '   - Schreibe für jede Lerneinheit zwischen `PROMPT_START` und `PROMPT_ENDE` die **heute zu bearbeitenden Aufgaben aus meinem Buchkapitel im vollen Wortlaut** + einen **sofort kopierbaren KI-Prompt** (damit mir die KI bei Bedarf Musterlösungen auf 15-Punkte-Niveau oder Hilfestellungen zu genau diesen Aufgaben gibt).\n';
        p += '4. **WICHTIG – GESAMTE ANTWORT IN EINEM EINZIGEN KOPIER-TEXTFELD (CODEBLOCK) AUSGEBEN (PFLICHT):**\n';
        p += '   - Schreibe den gesamten Lernplan (von `===LERNPLAN_START===` bis `===LERNPLAN_ENDE===`) **in EINEN EINZIGEN Markdown-Codeblock (` ```text ... ``` `)**!\n';
        p += '   - **Ganz wichtig für Gemini:** Verwende innerhalb dieses Codeblocks **KEINE** weiteren dreifachen Backticks (```` ``` ````), damit das Textfeld nicht unterbrochen wird und ich in Gemini oben rechts mit **einem einzigen Klick auf „Kopieren“** die komplette Antwort auf einmal kopieren kann!\n\n';
        p += 'Nutze für deinen Codeblock exakt diese Vorlage:\n\n';
        p += '```text\n';
        p += '===LERNPLAN_START===\n';
        p += 'TAG: YYYY-MM-DD\n';
        p += 'EINHEIT: [Typ: E oder U oder R oder SIM oder FEHLER oder FINAL] | [Fach-Kürzel, z.B. ' + c.subs[0].fk + '] | [Dauer in Min, z.B. ' + s.block + '] | [AFB: I oder II oder III oder MIX] | [Kurzer Titel der Einheit]\n';
        p += 'AUFGABEN: [Konkrete Schritt-für-Schritt-Anleitung für diese Einheit: Welche aus meinen Seiten extrahierten Aufgaben (in gesteigerter Reihenfolge!) + welche Methodik heute dran sind]\n';
        p += 'PROMPT_START\n';
        p += '[Schreibe hier die für heute extrahierten Original-Aufgaben im vollen Wortlaut + den kompletten Kopier-Prompt für einen neuen KI-Chat hinein – OHNE Backticks!]\n';
        p += 'PROMPT_ENDE\n';
        p += '===LERNPLAN_ENDE===\n';
        p += '```\n';

        if (loadedLzText && loadedLzText.trim()) {
          p += '\n============================================================\n';
          p += '4. INHALT MEINER AUSGEWÄHLTEN LERNZETTEL (ALS GRUNDLAGE)\n';
          p += '============================================================\n';
          p += loadedLzText.slice(0, 28000) + '\n';
        }

        var wrap = $('lp-master-prompt-wrap');
        var ta = $('lp-master-prompt-text');
        if (ta) ta.value = p;
        if (wrap) {
          wrap.style.display = '';
          if (wrap.scrollIntoView) wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return LT.copyToClipboard(p);
      })
      .then(function (ok) {
        if (ok) {
          toast('15-Punkte-Master-Prompt im Kasten erstellt & kopiert! Jetzt in Gemini (Deep Think / Pro) einfügen.', true);
        } else {
          toast('Master-Prompt im Kasten erstellt! Klicke auf „Kopieren“.');
        }
      })
      .then(function () {
        if (btn) { btn.disabled = false; btn.textContent = origText; }
      });
  }

  function resolveFachKey(rawFk) {
    var clean = String(rawFk || '').toLowerCase().replace(/[^a-zäöüß]/g, '').trim();
    if (subjectData[clean]) return clean;
    var found = null;
    Object.keys(subjectData).forEach(function (k) {
      var n = (subjectData[k].name || '').toLowerCase();
      if (clean === k || n.indexOf(clean) >= 0 || clean.indexOf(k) >= 0) found = k;
    });
    if (found) return found;
    var active = Object.keys(subjectData).filter(isSubjectActive);
    return active[0] || 'mathe';
  }

  function importAiPlan() {
    var err = $('lp-error');
    if (err) err.textContent = '';
    var inp = $('lp-ai-import-text');
    var raw = (inp && inp.value ? inp.value : '').trim();
    if (!raw) {
      if (err) err.textContent = 'Bitte füge zuerst die Antwort der KI in das Textfeld unter „2. KI-Antwort hier einfügen“ ein.';
      if (inp) inp.focus();
      return;
    }

    /* Extrahiere Bereich zwischen ===LERNPLAN_START=== und ===LERNPLAN_ENDE===, falls vorhanden */
    var blockMatch = /===\s*LERNPLAN_START\s*===([\s\S]*?)(?:===\s*LERNPLAN_ENDE\s*===|$)/i.exec(raw);
    var body = blockMatch ? blockMatch[1] : raw;

    var lines = body.split(/\r?\n/);
    var daysMap = {};
    var curDate = null;
    var curSession = null;
    var inPrompt = false;
    var promptBuf = [];
    var sessionCounter = 0;

    function flushPrompt() {
      if (curSession && promptBuf.length) {
        var joined = promptBuf.join('\n').trim();
        if (joined) {
          curSession.aiPrompt = (curSession.aiPrompt ? curSession.aiPrompt + '\n\n' : '') + joined;
        }
      }
      promptBuf = [];
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var trimmed = line.trim();
      var cleanLine = trimmed.replace(/^[\-*•>\s]+/, '').replace(/^\*\*|\*\*$/g, '').replace(/\*\*/g, '');

      /* Äußere Markdown-Codeblock-Zeilen (```text ... ```) aus Gemini ignorieren */
      if (/^```/.test(trimmed)) {
        continue;
      }

      if (/^PROMPT_START\b/i.test(cleanLine)) {
        inPrompt = true;
        promptBuf = [];
        continue;
      }
      if (/^PROMPT_ENDE\b/i.test(cleanLine)) {
        inPrompt = false;
        flushPrompt();
        continue;
      }
      if (inPrompt) {
        promptBuf.push(line);
        continue;
      }

      /* TAG: YYYY-MM-DD (oder Überschrift mit YYYY-MM-DD) */
      var tagMatch = /^(?:TAG|DATUM|LERntag)\s*:\s*(\d{4}-\d{2}-\d{2})/i.exec(cleanLine) ||
                     /^(?:#+\s*)?(\d{4}-\d{2}-\d{2})\b/.exec(cleanLine);
      if (tagMatch && validDate(tagMatch[1])) {
        curDate = tagMatch[1];
        if (!daysMap[curDate]) daysMap[curDate] = [];
        curSession = null;
        continue;
      }

      /* EINHEIT: Typ | Fach | Dauer | AFB | Titel */
      var einheitMatch = /^EINHEIT\s*:\s*(.+)$/i.exec(cleanLine);
      if (einheitMatch && curDate) {
        var parts = einheitMatch[1].split('|').map(function (s) { return s.trim().replace(/^\[|\]$/g, ''); });
        var rawType = (parts[0] || 'U').toUpperCase().replace(/[^A-Z]/g, '');
        if (['E', 'U', 'R', 'SIM', 'FEHLER', 'FINAL', 'V'].indexOf(rawType) < 0) rawType = 'U';
        var fk = resolveFachKey(parts[1] || '');
        var dur = parseInt(parts[2], 10) || state.settings.block || 45;
        var afbRaw = (parts[3] || 'II').toUpperCase().replace(/^AFB\s*/i, '').trim();
        if (['I', 'II', 'III', 'MIX', 'FILE'].indexOf(afbRaw) < 0) afbRaw = 'II';
        var title = parts.slice(4).join(' | ').trim() || (parts[3] && ['I', 'II', 'III', 'MIX'].indexOf(afbRaw) < 0 ? parts[3] : 'Lerneinheit');
        sessionCounter++;
        curSession = {
          id: 'AI|' + curDate + '|' + sessionCounter,
          type: rawType,
          fk: fk,
          key: 'ai_' + sessionCounter,
          title: title,
          link: '',
          note: '',
          afb: afbRaw,
          min: dur,
          n: 1,
          of: 1,
          optional: false,
          customMethod: '',
          aiPrompt: ''
        };
        /* Falls der Titel zu einem bekannten Lernzettel passt, Link automatisch verknüpfen! */
        var knownTopics = subjTopics(fk);
        for (var kt = 0; kt < knownTopics.length; kt++) {
          if (knownTopics[kt].link && title.toLowerCase().indexOf(knownTopics[kt].title.toLowerCase().slice(0, 12)) >= 0) {
            curSession.link = knownTopics[kt].link;
            curSession.key = knownTopics[kt].key;
            break;
          }
        }
        daysMap[curDate].push(curSession);
        continue;
      }

      /* AUFGABEN: ... */
      var aufgMatch = /^(?:AUFGABEN|METHODIK|INHALT|BESCHREIBUNG)\s*:\s*(.+)$/i.exec(cleanLine);
      if (aufgMatch && curSession) {
        curSession.customMethod = (curSession.customMethod ? curSession.customMethod + '\n' : '') + aufgMatch[1].trim();
        continue;
      }

      /* Mehrzeilige Fortsetzung von AUFGABEN */
      if (curSession && trimmed && !/^===/.test(trimmed)) {
        curSession.customMethod = (curSession.customMethod ? curSession.customMethod + '\n' : '') + trimmed;
      }
    }

    var dates = Object.keys(daysMap).sort();
    if (!dates.length || !sessionCounter) {
      if (err) {
        err.textContent = 'Der KI-Text enthielt noch keine erkennbaren Lerntage im Format „TAG: JJJJ-MM-TT“ und „EINHEIT: …“. Bitte nutze den generierten Master-Prompt aus Schritt 1 und kopiere die vollständige Antwort der KI.';
      }
      return;
    }

    var firstDate = dates[0];
    var lastDate = dates[dates.length - 1];
    var activeExams = [];
    Object.keys(subjectData).forEach(function (fk) {
      var st = getSub(fk);
      if (validDate(st.exam) && (isSubjectActive(fk) || raw.toLowerCase().indexOf(fk) >= 0)) {
        activeExams.push({ fk: fk, date: st.exam });
        if (st.exam > lastDate) lastDate = st.exam;
      }
    });
    activeExams.sort(function (a, b) { return a.date < b.date ? -1 : 1; });

    var spanDays = Math.min(90, Math.max(1, diff(firstDate, lastDate) + 1));
    var fullDays = [];
    for (var dIdx = 0; dIdx < spanDays; dIdx++) {
      var dStr = addDays(firstDate, dIdx);
      fullDays.push({
        date: dStr,
        cap: state.settings.minutes[wdIdx(dStr)] || 0,
        sessions: daysMap[dStr] || []
      });
    }

    state.plan = {
      created: todayStr(),
      start: firstDate,
      days: fullDays,
      exams: activeExams,
      warnings: [],
      sig: settingsSig(),
      isAiPlan: true
    };
    save();
    setupVisible(false);
    renderPlan();
    var r = $('lp-result');
    if (r && r.scrollIntoView) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast('KI-Lernplan erfolgreich importiert & auf der Website angezeigt! 🎉');
  }

  /* ──────────────────────────────────────────────────────────
     Prompts & Exporte
     ────────────────────────────────────────────────────────── */
  function topicsForPrompt(fk, key, afb) {
    if (afb === 'SIM' || !key) {
      return subjTopics(fk).filter(function (t) { return t.selected; });
    }
    var t = findTopic(fk, key);
    return t ? [t] : subjTopics(fk).filter(function (tp) { return tp.selected; });
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
        var taskInfo = buildTaskInstructionForPrompt(fk);
        var combinedZusatz = [fullZusatz, taskInfo].filter(Boolean).join('\n\n');
        var prompt = LT.buildQuizPrompt({
          fachKey: fk,
          topicTitles: topics.map(function (t) { return t.title; }),
          text: text, afb: afb, zusatz: combinedZusatz, simMinutes: st.simMinutes
        });
        showInlinePromptBox(
          btn,
          prompt,
          (afb === 'SIM' ? 'Klausur-Simulations-Prompt' : ('Übungs-Prompt (' + (afb === 'MIX' ? 'Klausur-Mix' : ('AFB ' + afb)) + ')')) + ' – ' + fachName(fk),
          (st.attachInAi && (st.taskMode === 'both' || st.taskMode === 'own'))
            ? '📎 Tipp: Falls du eigene Aufgabenblätter hast, hänge sie in Gemini einfach per + an – der Prompt berücksichtigt deine Aufgaben-Strategie!'
            : '✓ Lernzettel, BW-Operatoren & Zusatzwissen sind bereits komplett im Kasten enthalten.'
        );
        return LT.copyToClipboard(prompt);
      })
      .then(function (ok) {
        if (ok) toast(afb === 'SIM' ? 'Im Kopier-Kasten geöffnet & kopiert! Neuer Gemini-Chat (Deep Think / Pro) → Strg+V.' : 'Im Kopier-Kasten geöffnet & kopiert! Neuer Gemini-Chat → Strg+V.', true);
      })
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
      pd += '2. DETAILLIERTER AUFSATZ-CHECK NACH DEM 7-SCHRITTE-BAUPLAN:\n';
      pd += '   • **1. Einleitung & Deutungshypothese:** Sitzt der Basissatz und eine präzise psychologische/zwischenmenschliche Deutungshypothese?\n';
      pd += '   • **2. Strukturierte Inhaltsangabe:** Sind die Sinnabschnitte logisch, Tempus strikt **Präsens** und indirekte Rede im **Konjunktiv I** (ohne Zitate)?\n';
      pd += '   • **3.–6. Hauptteil (Block 1–4):** Wurde in allen 4 Blöcken (Rahmen/Einstieg, Hauptfigur/Innenwelt mit Erlebter Rede, Figurenkonstellation/Kommunikation, Wendepunkt/Dingsymbol/Titel/offener Schluss) konsequent der **15-Punkte-Dreischritt (1. Form → 2. Zitat + Zeile → 3. funktionale Deutung)** eingehalten?\n';
      pd += '   • **7. Schluss / Fazit:** Gibt es den Rückbezug zur Hypothese, die Synthese von Inhalt & Form sowie den impliziten Appell?\n';
      pd += '3. VORHER → NACHHER (15-PUNKTE-UPGRADE): Nimm meine **3 schwächsten Absätze oder Sätze** aus meinem Aufsatz und schreibe sie mir direkt in einer **perfekten 15-Punkte-Version** um!\n';
      pd += '4. Nenne mir meine 3 wichtigsten Schreib-Tipps für die echte Klausur.\n';
      if (z) pd += '\nZusatzwissen / Vorgaben meiner Lehrkraft:\n' + z + '\n';
      pd += '\nTEXTGRUNDLAGE & AUFGABENSTELLUNG: stehen weiter oben in diesem Chat (falls das ein neuer Chat ist, füge ich sie hier ein).\n';
      pd += '\nMEIN GESCHRIEBENER AUFSATZ (abgetippt oder als Foto angehängt):\n(hier einfügen)\n';
      showInlinePromptBox(btn, pd, 'Aufsatz-Korrektur & 15-Punkte-Lektorat (Deutsch)', '💬 Im selben Chat wie deine Klausur-Simulation einfügen + deinen Aufsatz anhängen.');
      LT.copyToClipboard(pd).then(function (ok) { if (ok) toast('Aufsatz-Korrektur-Prompt im Kasten geöffnet & kopiert!', true); });
      return;
    }

    var p = 'Du bist eine erfahrene Lehrkraft für ' + fachName(fk) + ' an einem Gymnasium in Baden-Württemberg.\n';
    p += 'Ich habe eine Klausur-Simulation zu folgenden Themen geschrieben: ' + topics.join(', ') + '.\n';
    p += 'Unten füge ich die Aufgaben, meine Lösungen und den Erwartungshorizont ein. Bitte:\n';
    p += '1. Bewerte meine Lösung streng nach Abitur-Maßstab in Notenpunkten (0–15) und begründe kurz.\n';
    p += '2. Ordne jeden Fehler einer Kategorie zu: Wissenslücke · Operator nicht erfüllt · Flüchtigkeitsfehler · Zeitproblem · Darstellung/Fachsprache.\n';
    p += '3. Nenne meine 3 wichtigsten Baustellen auf dem Weg zu 15 Punkten.\n';
    p += '4. Erstelle zu jeder Wissenslücke 3 aufbauende Übungsaufgaben mit Schwierigkeits-Steigerung (AFB I → AFB II → AFB III, mit Lösung darunter).\n';
    p += '5. Formuliere zu jeder Wissenslücke eine Karteikarte (Vorderseite | Rückseite).\n';
    var ops = ['I', 'II', 'III'].map(function (a) { return LT.AFB_LABELS[a] + ': ' + LT.getOperatorNames(fk, a); }).join('\n');
    if (ops.replace(/AFB I+: /g, '').trim()) p += '\nPrüfe besonders, ob ich die Operatoren richtig umgesetzt habe:\n' + ops + '\n';
    if (z) p += '\nZusatzwissen / Übungsblätter, die ich ebenfalls können muss:\n' + z + '\n';
    p += '\nAUFGABEN & ERWARTUNGSHORIZONT: stehen weiter oben in diesem Chat (falls das ein neuer Chat ist, füge ich sie hier ein).\n';
    p += '\nMEINE LÖSUNGEN (abgetippt oder als Foto angehängt):\n(hier einfügen)\n';
    showInlinePromptBox(btn, p, 'Fehleranalyse-Prompt (' + fachName(fk) + ')', '💬 Im Chat der Klausur-Simulation einfügen + deine Lösungen anhängen.');
    LT.copyToClipboard(p).then(function (ok) { if (ok) toast('Fehleranalyse-Prompt im Kasten geöffnet & kopiert!', true); });
  }

  function copyCoach(triggerBtn) {
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
      var tn = (getSub(e.fk).taskNote || '').trim();
      if (tn) t += '  • Eigene Übungsaufgaben: ' + tn + '\n';
      var z = getSub(e.fk).zusatz.trim();
      if (z) t += '  Zusatzwissen: ' + z.replace(/\n+/g, ' | ') + '\n';
    });
    t += '\nMEIN PLAN FÜR DIE NÄCHSTEN 7 TAGE:\n';
    p.days.filter(function (d) { return d.date >= today && diff(today, d.date) < 7; }).forEach(function (d) {
      if (!d.sessions.length) return;
      t += fmtDay(d.date) + ': ' + d.sessions.map(function (x) {
        return (TYPE_LABEL[x.type] || x.type) + ' ' + fachName(x.fk) + (x.title ? ' – ' + x.title : '') + (x.afb && x.type === 'U' ? ' (' + x.afb + ')' : '') + (state.done[x.id] ? ' ✓' : '');
      }).join('; ') + '\n';
    });
    var pr = progress();
    t += '\nFortschritt bisher: ' + pr.done + ' von ' + pr.total + ' Einheiten erledigt.\n\n';
    t += 'DEINE AUFGABE:\n';
    t += '1. Gib mir ein kurzes, ehrliches Feedback zu meinem Plan (Risiken, Prioritäten).\n';
    t += '2. Wenn ich dir schreibe „Start: [Thema]“, stellst du mir 5 aufbauende Fragen/Aufgaben mit Schwierigkeits-Steigerung (von AFB I bis AFB III) nacheinander (eine pro Nachricht), wartest auf meine Antwort und korrigierst sie knapp.\n';
    t += '3. Verwende bei Aufgaben immer die offiziellen BW-Operatoren des jeweiligen Fachs.\n';
    t += '4. Wenn du mir einen Prompt zum Kopieren schreibst, setze ihn immer in einen Codeblock-Kasten (```text ... ```).\n';
    t += '5. Motiviere mich, aber bleib ehrlich, wenn etwas noch nicht für 15 Punkte reicht.\n';
    if (triggerBtn) {
      showInlinePromptBox(triggerBtn, t, 'Persönlicher 15-Punkte-KI-Coach-Prompt', '💬 Lege dir dafür einen eigenen Chat in Gemini an und schreibe danach z. B. „Start: [Thema]“.');
    }
    LT.copyToClipboard(t).then(function (ok) { if (ok) toast('KI-Coach-Prompt im Kasten geöffnet & kopiert!', true); });
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
        return '• ' + (TYPE_LABEL[x.type] || x.type) + ': ' + fachName(x.fk) + (x.title ? ' – ' + x.title : '') + ' (' + metaText(x) + ')';
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
        var label = (TYPE_LABEL[x.type] || x.type) + ' · ' + fachName(x.fk) + ' – ' + (x.title || 'Alle Themen') + ' (' + metaText(x) + ')';
        lines.push('- ' + chk + ' **' + label + '**');
        if (x.customMethod) lines.push('  - _Aufgaben:_ ' + x.customMethod.replace(/\r?\n/g, ' '));
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
        syncOpenSubjectsWithSelection();
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
          ) : '<p class="lp-hint" style="margin:4px 0;"><i>Hinweis: Erstelle zuerst deinen Lernplan, um auch PDF-, Text- und Tabellen-Exporte zu nutzen.</i></p>') +
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
        syncOpenSubjectsWithSelection();
        goToStep(1);
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
        syncOpenSubjectsWithSelection();
        goToStep(1);
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
      else if (act === 'file-solve') copyFilePrompt(b.getAttribute('data-fach'), b.getAttribute('data-fid'), 'solve', b);
      else if (act === 'file-twin') copyFilePrompt(b.getAttribute('data-fach'), b.getAttribute('data-fid'), 'twin', b);
      else if (act === 'export') openExportModal();
      else if (act === 'print') window.print();
      else if (act === 'ics') exportIcs();
      else if (act === 'coach') copyCoach(b);
      else if (act === 'replan') generate();
      else if (act === 'filter-plan') {
        uiState.planFilter = b.getAttribute('data-filter') || 'all';
        renderPlan();
      } else if (act === 'edit') {
        setupVisible(true);
        $('lp-setup').scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (act === 'delete') {
        openDeleteModal();
      } else if (act === 'today') {
        if (uiState.planFilter !== 'all') {
          uiState.planFilter = 'all';
          renderPlan();
        }
        var el = $('lp-day-' + todayStr());
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  /* ──────────────────────────────────────────────────────────
     Start
     ────────────────────────────────────────────────────────── */
  function init() {
    syncOpenSubjectsWithSelection();

    /* Fach per URL öffnen: lernplaner.html?fach=mathe */
    var m = /[?&]fach=([^&]+)/.exec(location.search);
    if (m) {
      var urlFk = decodeURIComponent(m[1]);
      if (subjectData[urlFk]) {
        uiState.openSubjects[urlFk] = true;
      }
    }

    renderProjects();
    renderSubjects();
    renderTime();
    goToStep(1, false);

    initGlobalCopyBoxEvents();
    initProjectEvents();
    initSubjectEvents();
    initTimeEvents();
    initPlanEvents();

    $('lp-generate').addEventListener('click', generate);
    var masterBtn = $('lp-btn-master-prompt');
    if (masterBtn) masterBtn.addEventListener('click', generateMasterPrompt);
    var copyMasterBtn = $('lp-copy-master-btn');
    if (copyMasterBtn) {
      copyMasterBtn.addEventListener('click', function () {
        var ta = $('lp-master-prompt-text');
        if (!ta || !ta.value) return;
        ta.focus();
        ta.select();
        LT.copyToClipboard(ta.value).then(function (ok) {
          if (ok) {
            copyMasterBtn.textContent = '✓ Kopiert!';
            setTimeout(function () { copyMasterBtn.textContent = '📋 Auf einmal kopieren'; }, 2200);
            toast('Master-Prompt auf einmal kopiert! Jetzt in Gemini (Deep Think / Pro) einfügen.', true);
          }
        });
      });
    }
    var importAiBtn = $('lp-btn-import-ai-plan');
    if (importAiBtn) importAiBtn.addEventListener('click', importAiPlan);

    var resetBtn = $('lp-reset');
    if (resetBtn) resetBtn.addEventListener('click', openDeleteModal);
    var expSetupBtn = $('lp-export-setup');
    if (expSetupBtn) expSetupBtn.addEventListener('click', openExportModal);

    renderPlan();
    setupVisible(!state.plan);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

