/* ============================================================
   lerntools-core.js – Gemeinsame Funktionen für alle Lern-Tools
   (KI-Quiz, Anki, Notebook, Lernplaner)
   ------------------------------------------------------------
   Benötigt: faecher-daten.js (subjectData)
   Optional: operatoren-daten.js (OPERATOREN)
   ============================================================ */

(function () {
  'use strict';

  var STORAGE_KEY = 'lernplaner-v1';

  var AFB_LABELS = {
    I:   'AFB I',
    II:  'AFB II',
    III: 'AFB III',
    MIX: 'Klausur-Mix (AFB I – III)',
    SIM: 'Klausur-Simulation'
  };

  /* Allgemeine Fallback-Beschreibungen, falls für ein Fach keine Daten existieren */
  var AFB_FALLBACK = {
    I:   'Reproduktion: Wiedergeben und Beschreiben von Sachverhalten und Methoden aus dem Unterricht.',
    II:  'Reorganisation & Transfer: Selbstständiges Erklären, Bearbeiten, Ordnen und Anwenden auf neue Zusammenhänge.',
    III: 'Reflexion & Problemlösung: Planmäßiges Verarbeiten komplexer Sachverhalte mit dem Ziel, zu Begründungen, Urteilen und eigenen Lösungen zu gelangen.'
  };

  /* ──────────────────────────────────────────────────────────
     Daten-Helfer
     ────────────────────────────────────────────────────────── */
  function getFach(fachKey) {
    return (typeof subjectData !== 'undefined' && subjectData[fachKey]) || null;
  }

  function getOperatorData(fachKey) {
    if (typeof OPERATOREN === 'undefined') return null;
    return OPERATOREN[fachKey] || null;
  }

  /** Kurzbeschreibung eines AFB für ein Fach */
  function getAfbDescription(fachKey, afb) {
    var d = getOperatorData(fachKey);
    if (d && d.afb && d.afb[afb]) return d.afb[afb];
    return AFB_FALLBACK[afb] || '';
  }

  /** Liste der Operatoren (Array von {op, def}) für ein Fach und einen AFB */
  function getOperators(fachKey, afb) {
    var d = getOperatorData(fachKey);
    if (!d || !d.operatoren || !d.operatoren[afb]) return [];
    return d.operatoren[afb];
  }

  /** Kommagetrennte Kurzliste der Operator-Namen (für UI-Vorschau) */
  function getOperatorNames(fachKey, afb, max) {
    var ops = getOperators(fachKey, afb).map(function (o) { return o.op; });
    if (max && ops.length > max) return ops.slice(0, max).join(', ') + ' …';
    return ops.join(', ');
  }

  function formatSubZusatz(sub) {
    if (!sub) return '';
    var parts = [];
    var z = (sub.zusatz || '').trim();
    if (z) parts.push(z);
    if (Array.isArray(sub.files) && sub.files.length) {
      sub.files.forEach(function (f) {
        if (!f || !f.name) return;
        if (f.text && f.text.trim()) {
          parts.push('--- HOCHGELADENES ÜBUNGSBLATT (' + f.name + ') ---\n' + f.text.trim());
        } else {
          parts.push('--- HOCHGELADENES ÜBUNGSBLATT (' + f.name + ' – als Bild/Scan vorhanden, bitte Aufgabenstil daran orientieren bzw. angehängte Datei beachten) ---');
        }
      });
    }
    return parts.join('\n\n');
  }

  /** Zusatzwissen + hochgeladene Übungsaufgaben (aus dem Lernplaner gespeichert) für ein Fach */
  function getZusatzwissen(fachKey) {
    try {
      var state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!state) return '';
      if (state.settings && state.settings.subjects && state.settings.subjects[fachKey]) {
        var z = formatSubZusatz(state.settings.subjects[fachKey]);
        if (z) return z;
      }
      if (Array.isArray(state.projects)) {
        for (var i = 0; i < state.projects.length; i++) {
          var p = state.projects[i];
          if (p && p.settings && p.settings.subjects && p.settings.subjects[fachKey]) {
            var pz = formatSubZusatz(p.settings.subjects[fachKey]);
            if (pz) return pz;
          }
        }
      }
    } catch (e) { /* ignorieren */ }
    return '';
  }

  /* ──────────────────────────────────────────────────────────
     Lernzettel laden & in Text umwandeln
     ────────────────────────────────────────────────────────── */
  function loadTopicText(link) {
    return fetch(link)
      .then(function (res) {
        if (!res.ok) throw new Error('Datei konnte nicht geladen werden (' + link + ').');
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var text = '';
        var pages = doc.querySelectorAll('.page');
        if (pages.length > 0) {
          pages.forEach(function (page, i) {
            text += '--- SEITE ' + (i + 1) + ' ---\n';
            text += (page.innerText || page.textContent) + '\n\n';
          });
        } else {
          var main = doc.querySelector('.content-wrapper') || doc.body;
          text = main.innerText || main.textContent;
        }
        return text.replace(/[ \t]+\n/g, '\n').replace(/[\r\n]{3,}/g, '\n\n').trim();
      });
  }

  /** Mehrere Themen laden. topics = [{title, link?, note?}] */
  function loadTopicsText(topics) {
    return Promise.all(topics.map(function (t) {
      if (!t.link) {
        return Promise.resolve('=== ZUSATZTHEMA: ' + t.title + ' ===\n(Kein Lernzettel vorhanden – eigenes Thema der Schülerin.)' +
          (t.note ? '\nNotiz: ' + t.note : ''));
      }
      return loadTopicText(t.link).then(function (txt) {
        return '=== LERNZETTEL: ' + t.title + ' ===\n' + txt;
      });
    })).then(function (parts) { return parts.join('\n\n'); });
  }

  /* ──────────────────────────────────────────────────────────
     Operator-Block für Prompts
     ────────────────────────────────────────────────────────── */
  function operatorBlock(fachKey, afbs) {
    var d = getOperatorData(fachKey);
    if (!d) return '';
    var out = '';
    afbs.forEach(function (afb) {
      var ops = getOperators(fachKey, afb);
      out += '\n' + AFB_LABELS[afb] + ' – ' + getAfbDescription(fachKey, afb) + '\n';
      ops.forEach(function (o) { out += '  • ' + o.op + ': ' + o.def + '\n'; });
    });
    if (d.quelle) out += '\n(Quelle der Operatoren: ' + d.quelle + ')\n';
    return out;
  }

  /* ──────────────────────────────────────────────────────────
     Spezial-Prompt für DEUTSCH (Aufsatz / Textinterpretation statt Einzelfragen!)
     ────────────────────────────────────────────────────────── */
  function buildDeutschEssayPrompt(opts, fach, opData, kurs, themen, afb) {
    var p = '';
    p += 'Du bist eine erfahrene Deutsch-Lehrkraft an einem allgemeinbildenden Gymnasium in Baden-Württemberg ';
    p += '(Oberstufe / Abitur nach Bildungsplan 2016).\n';
    if (kurs) p += 'Kursniveau: ' + kurs + '.\n';
    p += 'Thema meines Lernzettels: "' + themen + '".\n\n';

    p += '⚠️ WICHTIGER GRUNDSATZ – ECHTE DEUTSCH-KLAUSUR STATT KLASSENARBEIT:\n';
    p += 'In Deutsch schreibt man KEINE „normale Arbeit“ mit nummerierten Wissensfragen oder Kleinteil-Aufgaben (NICHT: „1. Nennen Sie die Merkmale der Kurzprosa (6 BE)“, „2. Erklären Sie das Vier-Ohren-Modell (8 BE)“), ';
    p += 'sondern EINEN ZUSAMMENHÄNGENDEN AUFSATZ im Fließtext zu einem konkreten literarischen oder pragmatischen Text (z. B. einer Kurzgeschichte)!\n';
    p += 'Mein Lernzettel unten enthält mein Analyse-Handwerkszeug (Aufbau, TATTE-Einleitung, Inhaltsangabe im Konjunktiv I, aspektorientierter Hauptteil im 15-Punkte-Dreischritt, Erzähltechnik, Kommunikationsmodelle nach Schulz von Thun / Watzlawick, Stilmittel & Formulierungshilfen). ';
    p += 'Frage dieses Wissen NIEMALS als theoretische Wissensabfrage ab, sondern gib mir einen konkreten Text, auf den ich dieses Handwerkszeug im Aufsatz anwenden muss!\n\n';

    if (afb === 'SIM') {
      p += 'AUFTRAG – VOLLSTÄNDIGE DEUTSCH-AUFSATZKLAUSUR (Bearbeitungszeit ca. ' + (opts.simMinutes || 180) + ' Minuten):\n';
      p += '1. TEXTGRUNDLAGE: Gib mir zuerst eine vollständige, literarisch anspruchsvolle moderne Kurzgeschichte (ca. 450–650 Wörter, mit Titel, Autor/in und Erscheinungsjahr für den TATTE-Basissatz) auf echtem BW-Oberstufen-/Abiturniveau ';
      p += '(falls ich unten im Zusatzwissen/Übungsblatt nicht schon einen eigenen Primärtext mitgeliefert habe). ';
      p += 'Der Text muss sich perfekt für eine 15-Punkte-Interpretation eignen: Einstieg in medias res, alltägliche Situation mit unausgesprochenem Konflikt (Eisberg-Modell), Dialoge mit Subtext/gestörter Kommunikation (für Schulz von Thun & Watzlawick), markante Erzählperspektive, Leitmotive/Dingsymbole, Wendepunkt und offener Schluss.\n';
      p += '   → Nummeriere den Text zwingend alle 5 Zeilen mit [Z. 5], [Z. 10], [Z. 15] …, damit ich im Aufsatz korrekt mit Zeilenangaben zitieren kann!\n';
      p += '2. AUFGABENSTELLUNG: Formuliere darunter EINE authentische baden-württembergische Klausur-Aufgabenstellung für einen vollständigen Aufsatz (z. B. „**Interpretieren** Sie die vorliegende Kurzgeschichte ‚…‘ von … (Jahr). **Untersuchen** Sie dabei insbesondere die Kommunikationssituation und Beziehung zwischen den Figuren sowie die erzähltechnische und sprachliche Gestaltung.“).\n';
      p += '   → Meine Aufgabe ist es, dazu EINEN kompletten Aufsatz im Fließtext zu schreiben (Einleitung mit Aufhänger + TATTE + Deutungshypothese → Inhaltsangabe im Präsens & Konjunktiv I → aspektorientierter Hauptteil im 15-Punkte-Dreischritt → Schluss mit Fazit, Verifizierung der Hypothese & Ausblick).\n';
      p += '   → Gib die im BW-Deutschabitur übliche Gewichtung an (Inhaltliche Leistung 60 % / Darstellungsleistung & Ausdruck 40 % → 0–15 Notenpunkte).\n';
    } else if (afb === 'MIX') {
      p += 'AUFTRAG – KOMPLETTES AUFSATZ-TRAINING AN EINER KURZGESCHICHTE:\n';
      p += '1. TEXTGRUNDLAGE: Gib mir zuerst eine vollständige, dichte Übungs-Kurzgeschichte (ca. 350–500 Wörter, mit Titel, Autor/in, Erscheinungsjahr und Zeilennummerierung [Z. 5], [Z. 10] …), die reich an Erzähltechnik, Sprachbildern, Leerstellen und Figurenkommunikation ist.\n';
      p += '2. AUFGABENSTELLUNG: Stelle mir darunter EINE übergeordnete Aufsatz-Aufgabenstellung im Stil des BW-Abiturs (**Interpretieren** Sie … / **Untersuchen** Sie dabei insbesondere …), zu der ich einen kompletten Aufsatz (oder einen vollständigen Aufsatz-Entwurf + Einleitung, 2–3 Hauptteil-Absätze im Dreischritt und Schluss) im Fließtext verfasse.\n';
    } else if (afb === 'I') {
      p += 'AUFTRAG – SCHREIBTRAINING 1 (AUFSATZ-EINSTIEG: EINLEITUNG, TATTE & INHALTSANGABE):\n';
      p += '1. TEXTGRUNDLAGE: Gib mir eine prägnante Übungs-Kurzgeschichte (ca. 250–400 Wörter, mit Titel, Autor/in, Erscheinungsjahr, direkter Figurenrede und Zeilennummern [Z. 5], [Z. 10] …).\n';
      p += '2. SCHREIBAUFTRAG (Fließtext statt Stichpunkte!): Stelle mir die Aufgabe, zu dieser Kurzgeschichte den kompletten ersten Teil eines 15-Punkte-Aufsatzes zu schreiben:\n';
      p += '   • Eine gelungene **Einleitung** (thematischer Aufhänger + vollständiger **TATTE-Basissatz** + präzise **zentrale Interpretationshypothese**)\n';
      p += '   • Die Einteilung in **Sinnabschnitte** (mit Zeilenangaben) sowie eine knappe, sachliche **Inhaltsangabe** als Gelenkstelle (zwingend im **Präsens**, in eigenen Worten ohne Zitate und bei Figurenäußerungen im **Konjunktiv I**).\n';
    } else if (afb === 'II') {
      p += 'AUFTRAG – SCHREIBTRAINING 2 (HAUPTTEIL-ANALYSE IM 15-PUNKTE-DREISCHRITT):\n';
      p += '1. TEXTGRUNDLAGE: Gib mir eine literarisch dichte Übungs-Kurzgeschichte (ca. 300–450 Wörter, mit Titel, Autor/in, Erscheinungsjahr und Zeilennummern [Z. 5], [Z. 10] …), die einen klaren Beziehungskonflikt im Dialog, eine markante Erzählperspektive und starke Sprachbilder/Dingsymbole enthält.\n';
      p += '2. SCHREIBAUFTRAG: Stelle mir die Aufgabe, zu diesem Text **2–3 zusammenhängende Hauptteil-Absätze im Fließtext** (aspektorientiertes Verfahren) zu verfassen und dabei konsequent den **15-Punkte-Dreischritt** (**1. Form/Aspekt benennen → 2. Beleg mit Zitat & Zeile → 3. funktionale Deutung**) anzuwenden:\n';
      p += '   • **Absatz 1:** Analyse der Erzähltechnik (Erzählverhalten, Perspektive, Innensicht/Außensicht, Raum- & Zeitgestaltung)\n';
      p += '   • **Absatz 2:** Analyse der Figurenbeziehung & Kommunikation (unter direkter Anwendung von **Schulz von Thun** oder **Watzlawick** aus meinem Lernzettel)\n';
      p += '   • **Absatz 3:** Analyse der sprachlich-stilistischen Gestaltung, Leitmotive und Symbolik.\n';
    } else {
      p += 'AUFTRAG – SCHREIBTRAINING 3 (TIEFENDEUTUNG, EISBERG-MODELL & AUFSATZ-SCHLUSS):\n';
      p += '1. TEXTGRUNDLAGE: Gib mir eine anspruchsvolle Übungs-Kurzgeschichte (ca. 300–450 Wörter, mit Titel, Autor/in, Erscheinungsjahr und Zeilennummern [Z. 5], [Z. 10] …) mit deutlichen Leerstellen (Eisberg-Modell), einem subtilen Wendepunkt und einem offenen/mehrdeutigen Schluss.\n';
      p += '2. SCHREIBAUFTRAG: Stelle mir die Aufgabe, im Fließtext:\n';
      p += '   • Einen tiefgründigen **Deutungs-Absatz** zu den **Leerstellen (Eisberg-Modell)**, dem **Wendepunkt** und der Funktion des **offenen Schlusses** im 15-Punkte-Dreischritt zu schreiben\n';
      p += '   • Einen abiturreifen **Schlussabsatz** zu verfassen (komprimiertes Fazit der Analyse, **Verifizierung/Differenzierung der zentralen Interpretationshypothese** und weiterführender gesellschaftlicher Ausblick ohne private Wertung).\n';
    }

    if (opData && opData.aufgabenarten) {
      p += '\nOrientiere den Aufgabenstil an den offiziellen Aufgabenarten und Operatoren des BW-Deutschabiturs (' + opData.quelle + ').\n';
    }

    p += '\nAUFBAU DEINER ANTWORT:\n';
    p += '1. Zuerst NUR die **Kurzgeschichte / Textgrundlage (mit Zeilennummern [Z. 5], [Z. 10] …)** und darunter die **Aufsatz-Aufgabenstellung** (mit kurzem Schreibhinweis). Noch KEINE Deutung oder Lösung verraten!\n';
    p += '2. Dann eine deutliche Trennlinie mit dem Hinweis: "▼ ERWARTUNGSHORIZONT & 15-PUNKTE-MUSTERAUFSATZ – erst nach dem Schreiben lesen ▼".\n';
    p += '3. Darunter **Teil A – Strukturierter Erwartungshorizont (BW-Maßstab)**:\n';
    p += '   • Zentrale Interpretationshypothese & Gliederung in Sinnabschnitte (mit Zeilenangaben)\n';
    p += '   • Wichtigste Analyse-Ergebnisse zu Erzähltechnik, Figuren & Kommunikation (konkrete Anwendung von Schulz von Thun / Watzlawick!), Sprache/Symbolik & Eisberg-Modell (jeweils mit Zitat + Zeile)\n';
    p += '   • Bewertungsmaßstab (was unterscheidet einen 10-Punkte-Aufsatz von einem 15-Punkte-Aufsatz?).\n';
    p += '4. Darunter **Teil B – Vollständig ausformulierter 15-Punkte-Musteraufsatz (im Fließtext!)**:\n';
    p += '   • Schreibe den geforderten Aufsatz (bzw. die geforderten Aufsatz-Bausteine) komplett als vorbildlichen 15-Punkte-Aufsatz vor – exakt nach den Regeln meines Lernzettels (TATTE, Konjunktiv I, aspektorientierter Aufbau, 15-Punkte-Dreischritt Form → Zitat + Zeile → Deutung und gehobene Analyse-Verben vom Lernzettel)!\n';
    p += '5. Beende deine Antwort mit dem Hinweis: *"📸 Tipp: Schicke mir jetzt deinen geschriebenen Aufsatz (abgetippt oder als Foto deiner Handschrift) hier in den Chat – ich korrigiere ihn dir Satz für Satz und bewerte ihn nach dem BW-Abiturmaßstab (0–15 Notenpunkte)!"*\n';

    if (opts.extra) {
      p += '\nZUSÄTZLICHE WÜNSCHE DER SCHÜLERIN:\n' + opts.extra + '\n';
    }

    if (opts.zusatz) {
      p += '\nZUSATZWISSEN / EIGENE TEXTE ODER ÜBUNGSBLÄTTER (falls hier eine eigene Kurzgeschichte oder Aufgabenstellung steht, nutze vorrangig diese!):\n';
      p += '----------------------------------------\n' + opts.zusatz + '\n----------------------------------------\n';
    }

    p += '\nMEIN DEUTSCH-LERNZETTEL (nutze die Methoden, Modelle, Fachbegriffe und Formulierungshilfen hieraus als verbindlichen Maßstab für die Aufsatz-Anforderungen und den 15-Punkte-Musteraufsatz):\n';
    p += '----------------------------------------\n';
    p += (opts.text || '') + '\n';
    p += '----------------------------------------\n';
    return p;
  }

  /* ──────────────────────────────────────────────────────────
     Quiz-/Übungs-/Klausur-Prompt bauen
     opts = {
       fachKey, topicTitles: [..], text,
       afb: 'I'|'II'|'III'|'MIX'|'SIM',
       extra (eigene Wünsche), zusatz (Zusatzwissen),
       simMinutes (nur SIM)
     }
     ────────────────────────────────────────────────────────── */
  function buildQuizPrompt(opts) {
    var fach = getFach(opts.fachKey) || { name: opts.fachKey, type: '' };
    var opData = getOperatorData(opts.fachKey);
    var afb = opts.afb || 'II';
    var themen = (opts.topicTitles || []).join(', ');
    var kurs = fach.type === 'LK' ? 'Leistungsfach (LK, erhöhtes Anforderungsniveau)'
             : fach.type === 'GK' ? 'Basisfach (GK, grundlegendes Anforderungsniveau)'
             : (fach.type || '');

    /* In Deutsch schreibt man einen ganzen Aufsatz zu einem Text (keine Kleinteil-Arbeit!) */
    if (opts.fachKey === 'deutsch') {
      return buildDeutschEssayPrompt(opts, fach, opData, kurs, themen, afb);
    }

    var p = '';
    p += 'Du bist eine erfahrene Lehrkraft für ' + fach.name + ' an einem allgemeinbildenden Gymnasium in Baden-Württemberg ';
    p += 'und erstellst Aufgaben exakt im Stil des schriftlichen Abiturs (Bildungsplan 2016, BW-Operatorenliste).\n';
    if (kurs) p += 'Kursniveau: ' + kurs + '.\n';
    p += 'Thema: "' + themen + '".\n\n';

    if (opts.fachKey === 'englisch') {
      p += 'WICHTIG FÜR ENGLISCH (BW-KLAUSURFORMAT): Stelle zuerst einen authentischen englischen Ausgangstext (z. B. Excerpt from a short story/novel oder Newspaper article, mit Zeilennummern [l. 5], [l. 10] …) bereit und formuliere die Aufgaben komplett auf Englisch im dreiteiligen BW-Klausurstil (1. Comprehension/Outline [AFB I], 2. Analysis of content, language & style [AFB II], 3. Evaluation: Comment/Discussion/Creative Writing [AFB III]' + (afb === 'SIM' ? ' sowie optional eine deutsche Textvorlage für Mediation' : '') + ').\n\n';
    } else if (opts.fachKey === 'gk' || opts.fachKey === 'geschichte' || opts.fachKey === 'geographie' || opts.fachKey === 'religion' || opts.fachKey === 'psychologie') {
      p += 'WICHTIG FÜR ' + fach.name.toUpperCase() + ' (MATERIALGEBUNDENE BW-KLAUSUR): Stelle wie in einer echten baden-württembergischen Oberstufenklausur kurze, realistische Materialien (z. B. M1: Quellentext/Zeitungsauszug/Fallbeispiel mit Zeilennummern, ggf. M2: Statistik/Position) voran, auf die sich die Teilaufgaben (AFB I: darstellen/herausarbeiten → AFB II: erläutern/vergleichen/einordnen mit Fachwissen → AFB III: kriteriengeleitet beurteilen/erörtern) beziehen!\n\n';
    }

    if (afb === 'SIM') {
      p += 'AUFTRAG: Erstelle eine vollständige KLAUSUR-SIMULATION mit einer Bearbeitungszeit von ca. ' + (opts.simMinutes || 90) + ' Minuten.\n';
      p += '- Mische alle drei Anforderungsbereiche ungefähr im Abitur-Verhältnis (AFB I ca. 30 %, AFB II ca. 40 %, AFB III ca. 30 %).\n';
      p += '- Decke ALLE genannten Themen ab und verknüpfe sie, wo sinnvoll, miteinander (wie in einer echten Klausur).\n';
      p += '- Gib für jede Teilaufgabe Bewertungseinheiten (BE) an und am Ende eine Notenskala (BE → Notenpunkte 0–15).\n';
    } else if (afb === 'MIX') {
      p += 'AUFTRAG: Erstelle Übungsaufgaben als Klausur-Mix über alle Anforderungsbereiche (AFB I ca. 30 %, AFB II ca. 40 %, AFB III ca. 30 %).\n';
      p += '- Kennzeichne bei jeder Aufgabe den AFB und die Bewertungseinheiten (BE).\n';
    } else {
      p += 'AUFTRAG: Erstelle Übungsaufgaben mit Schwerpunkt ' + AFB_LABELS[afb] + '.\n';
      p += 'Bedeutung im Fach ' + fach.name + ': ' + getAfbDescription(opts.fachKey, afb) + '\n';
      p += '- Kennzeichne bei jeder Aufgabe den AFB und die Bewertungseinheiten (BE).\n';
    }

    var afbList = (afb === 'MIX' || afb === 'SIM') ? ['I', 'II', 'III'] : [afb];
    if (opData) {
      p += '\nOPERATOREN (verbindlich): Formuliere jede Aufgabe mit einem Operator aus der folgenden fachspezifischen Liste, ';
      p += 'setze den Operator fett an den Satzanfang und halte dich genau an seine Definition. Verwende keine anderen Arbeitsanweisungen.\n';
      p += operatorBlock(opts.fachKey, afbList);
      if (opData.aufgabenarten && opData.aufgabenarten.length) {
        p += '\nTypische Aufgabenarten im BW-Abitur in diesem Fach (orientiere dich daran, wo passend): ' + opData.aufgabenarten.join('; ') + '.\n';
      }
    } else {
      p += '\nVerwende die offiziellen Operatoren des Fachs ' + fach.name + ' aus der baden-württembergischen Operatorenliste und setze sie fett an den Satzanfang.\n';
    }

    p += '\nAUFBAU DEINER ANTWORT:\n';
    p += '1. Zuerst NUR die Aufgaben (inkl. Material/Kontext, nummeriert, Operator fett, AFB und BE angegeben). Noch keine Lösungen!\n';
    p += '2. Dann eine deutliche Trennlinie mit dem Hinweis "▼ LÖSUNGEN – erst nach dem Bearbeiten lesen ▼".\n';
    p += '3. Darunter ein Erwartungshorizont je Aufgabe: Musterlösung + was für die volle Punktzahl (15 Notenpunkte-Niveau) zwingend enthalten sein muss + typische Fehler, die Punkte kosten.\n';

    if (opts.extra) {
      p += '\nZUSÄTZLICHE WÜNSCHE DER SCHÜLERIN:\n' + opts.extra + '\n';
    }

    p += '\nINHALTLICHE GRUNDLAGE: Stütze die fachlichen Anforderungen, Begriffe, Formeln und Modelle auf meine Lernzettel';
    p += opts.zusatz ? ' sowie das unten angegebene Zusatzwissen' : '';
    p += '. Du darfst realistische Anwendungs-Kontexte, Rechenwerte, Experimente oder Quellentexte passend zu diesen Themen entwerfen, solange sie mit dem Wissen meiner Lernzettel lösbar sind.\n';

    if (opts.zusatz) {
      p += '\nZUSATZWISSEN (muss ich ebenfalls können, steht aber nicht auf den Lernzetteln):\n';
      p += '----------------------------------------\n' + opts.zusatz + '\n----------------------------------------\n';
    }

    p += '\nMEINE LERNZETTEL:\n';
    p += '----------------------------------------\n';
    p += (opts.text || '') + '\n';
    p += '----------------------------------------\n';
    return p;
  }

  /* ──────────────────────────────────────────────────────────
     Zwischenablage (mit Fallback + manuellem Kopier-Dialog)
     ────────────────────────────────────────────────────────── */
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function showManualCopy(text) {
    var overlay = document.createElement('div');
    overlay.className = 'modal show';
    overlay.style.zIndex = '20000';
    overlay.innerHTML =
      '<div class="modal-content">' +
        '<button class="modal-close" aria-label="Schließen">&times;</button>' +
        '<h2 class="modal-title">Bitte manuell kopieren</h2>' +
        '<p class="modal-desc">Dein Browser hat das automatische Kopieren blockiert. Markiere den Text (Strg+A) und kopiere ihn mit Strg+C.</p>' +
        '<textarea class="form-control" rows="12" readonly></textarea>' +
      '</div>';
    overlay.querySelector('textarea').value = text;
    function close() { document.body.removeChild(overlay); }
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.body.appendChild(overlay);
    var ta = overlay.querySelector('textarea');
    ta.focus();
    ta.select();
  }

  /** Kopiert Text. Resolved mit true (kopiert) oder false (manueller Dialog angezeigt). */
  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text)
        .then(function () { return true; })
        .catch(function () {
          if (legacyCopy(text)) return true;
          showManualCopy(text);
          return false;
        });
    }
    if (legacyCopy(text)) return Promise.resolve(true);
    showManualCopy(text);
    return Promise.resolve(false);
  }

  /** Datei-Download (UTF-8 mit BOM) */
  function downloadFile(filename, content, mime) {
    var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    var blob = new Blob([bom, content], { type: (mime || 'text/plain') + ';charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  window.LernTools = {
    STORAGE_KEY: STORAGE_KEY,
    AFB_LABELS: AFB_LABELS,
    getFach: getFach,
    getOperatorData: getOperatorData,
    getAfbDescription: getAfbDescription,
    getOperators: getOperators,
    getOperatorNames: getOperatorNames,
    getZusatzwissen: getZusatzwissen,
    loadTopicText: loadTopicText,
    loadTopicsText: loadTopicsText,
    buildQuizPrompt: buildQuizPrompt,
    copyToClipboard: copyToClipboard,
    showManualCopy: showManualCopy,
    downloadFile: downloadFile
  };
})();
