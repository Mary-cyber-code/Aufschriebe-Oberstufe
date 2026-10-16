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

  /** Zusatzwissen (aus dem Lernplaner gespeichert) für ein Fach */
  function getZusatzwissen(fachKey) {
    try {
      var state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (state && state.settings && state.settings.subjects && state.settings.subjects[fachKey]) {
        return (state.settings.subjects[fachKey].zusatz || '').trim();
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
     Quiz-/Übungs-Prompt bauen
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

    var p = '';
    p += 'Du bist eine erfahrene Lehrkraft für ' + fach.name + ' an einem allgemeinbildenden Gymnasium in Baden-Württemberg ';
    p += 'und erstellst Aufgaben exakt im Stil des schriftlichen Abiturs (Bildungsplan 2016, BW-Operatorenliste).\n';
    if (kurs) p += 'Kursniveau: ' + kurs + '.\n';
    p += 'Thema: "' + themen + '".\n\n';

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
    p += '1. Zuerst NUR die Aufgaben (nummeriert, Operator fett, AFB und BE angegeben). Noch keine Lösungen!\n';
    p += '2. Dann eine deutliche Trennlinie mit dem Hinweis "▼ LÖSUNGEN – erst nach dem Bearbeiten lesen ▼".\n';
    p += '3. Darunter ein Erwartungshorizont je Aufgabe: Musterlösung + was für die volle Punktzahl (15 Notenpunkte-Niveau) zwingend enthalten sein muss + typische Fehler, die Punkte kosten.\n';

    if (opts.extra) {
      p += '\nZUSÄTZLICHE WÜNSCHE DER SCHÜLERIN:\n' + opts.extra + '\n';
    }

    p += '\nINHALTLICHE GRUNDLAGE: Verwende für die Aufgaben AUSSCHLIESSLICH die Fakten aus meinen Lernzetteln';
    p += opts.zusatz ? ' sowie das unten angegebene Zusatzwissen' : '';
    p += '. Erfinde keine Inhalte, die darüber hinausgehen.\n';

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
