/* ============================================================
   Bullet Journal Lern-Website – Hauptskript
   Rendert Dashboard & Fach-Ansicht aus faecher-daten.js,
   steuert View-Wechsel und Animationen.
   Rein statisches Vanilla JS, kompatibel mit GitHub Pages.
   ============================================================ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     SVG-ICONS  (einfarbig, leicht handgezeichnet)
     Jeder Key entspricht einem Fach-Schlüssel in subjectData.
     ────────────────────────────────────────────────────────── */
  const ICONS = {

    /* Mathematik – Dreieck / Geometrie */
    mathe:
      '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M6 26L16 6l10 20H6z"/><path d="M11 19h10"/>' +
      '</svg>',

    /* Chemie – Erlenmeyerkolben */
    chemie:
      '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12 5h8"/><path d="M13 5v7l-7 14h20l-7-14V5"/>' +
      '</svg>',

    /* Gemeinschaftskunde – Säulengebäude */
    gk:
      '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M6 26h20"/><path d="M9 26V14m7 12V14m7 12V14"/>' +
        '<path d="M5 14h22"/><path d="M16 8L5 14h22z"/>' +
      '</svg>',

    /* Deutsch – Buch mit Stift */
    deutsch:
      '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M5 27V7a2 2 0 012-2h14a2 2 0 012 2v20"/>' +
        '<path d="M5 27h16a2 2 0 002-2"/>' +
        '<path d="M9 10h8M9 14h5"/>' +
        '<path d="M24 13l-5 5-.5 2.5L21 20l5-5z"/>' +
      '</svg>',

    /* Englisch – aufgeschlagenes Buch */
    englisch:
      '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M16 7c-2-2-6-3-11-2v19c5-1 9 0 11 2m0-19c2-2 6-3 11-2v19c-5-1-9 0-11 2V7z"/>' +
      '</svg>',

    /* Biologie – Blatt */
    biologie:
      '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M6 26Q6 6 26 6c0 12-8 20-20 20z"/>' +
        '<path d="M6 26C12 20 20 12 26 6" opacity="0.4"/>' +
      '</svg>',

    /* Kunst – Farbpalette */
    kunst:
      '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M16 4C9.4 4 4 9.4 4 16s5.4 12 12 12c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4c3.6 0 6.6-3 6.6-6.6C28 8.6 22.6 4 16 4z"/>' +
        '<circle cx="11" cy="12" r="2"/>' +
        '<circle cx="17" cy="10" r="2"/>' +
        '<circle cx="22" cy="14" r="2"/>' +
        '<circle cx="11" cy="19" r="2"/>' +
      '</svg>',

    /* Sport – Blitz / Energie */
    sport:
      '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M19 4L9 16h7l-4 12 12-14h-7z"/>' +
      '</svg>',

    /* Religion – Kreuz */
    religion:
      '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M16 4v24M9 11h14"/>' +
      '</svg>',

    /* Geschichte – Sanduhr */
    geschichte:
      '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M10 4h12M10 28h12"/>' +
        '<path d="M11 4c0 7 5 10 5 12s-5 5-5 12"/>' +
        '<path d="M21 4c0 7-5 10-5 12s5 5 5 12"/>' +
      '</svg>',

    /* Geographie – Globus */
    geographie:
      '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
        '<circle cx="16" cy="16" r="11"/>' +
        '<ellipse cx="16" cy="16" rx="5" ry="11"/>' +
        '<path d="M5 16h22"/>' +
      '</svg>',

    /* Psychologie – Psi Symbol */
    psychologie:
      '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M16 4v24" />' +
        '<path d="M8 12c0 8 4 10 8 10s8-2 8-10" />' +
      '</svg>'
  };

  /* Zurück-Pfeil */
  var BACK_ARROW =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/></svg>';


  /* ──────────────────────────────────────────────────────────
     DOM-Referenzen
     ────────────────────────────────────────────────────────── */
  var dashboardView = document.getElementById('dashboard-view');
  var subjectView   = document.getElementById('subject-view');
  var dashboardMain = document.getElementById('dashboard-main');


  /* ──────────────────────────────────────────────────────────
     Hilfsfunktionen
     ────────────────────────────────────────────────────────── */

  /** Deterministische kleine Rotation aus dem Fach-Key */
  function getRotations(key) {
    var hash = 0;
    for (var i = 0; i < key.length; i++) hash += key.charCodeAt(i);
    return {
      card: ((hash * 7) % 30 - 15) / 10,    // -1.5° … +1.5°
      tape: ((hash * 11) % 40 - 20) / 10     // -2.0° … +2.0°
    };
  }

  /** CSS-Variable für den Akzentnamen */
  function av(name) { return 'var(--' + name + ')'; }


  /* ──────────────────────────────────────────────────────────
     DASHBOARD RENDERN
     ────────────────────────────────────────────────────────── */
  function renderDashboard() {
    dashboardMain.innerHTML = '';

    SECTION_CONFIG.forEach(function (sec) {
      /* Fächer dieser Sektion sammeln */
      var entries = [];
      Object.keys(subjectData).forEach(function (key) {
        if (subjectData[key].section === sec.id) entries.push([key, subjectData[key]]);
      });
      if (entries.length === 0) return;

      /* Sektion */
      var sectionEl = document.createElement('section');
      sectionEl.className = 'section reveal';
      sectionEl.setAttribute('aria-labelledby', 'section-' + sec.id);

      /* Header */
      var headerEl = document.createElement('div');
      headerEl.className = 'section-header';
      headerEl.innerHTML =
        '<h2 class="section-title" id="section-' + sec.id + '">' +
          '<span class="section-dot section-dot--' + sec.id + '" aria-hidden="true"></span>' +
          sec.title +
        '</h2>' +
        '<span class="section-line" aria-hidden="true"></span>';
      sectionEl.appendChild(headerEl);

      /* Grid */
      var gridEl = document.createElement('div');
      gridEl.className = 'subjects-grid';

      entries.forEach(function (pair) {
        var key  = pair[0];
        var data = pair[1];
        var rot  = getRotations(key);

        var card = document.createElement('a');
        card.href = '#' + key;
        card.className = 'subject-card reveal';
        card.id = 'card-' + key;
        card.style.setProperty('--card-accent', av(data.accent));
        card.style.setProperty('--card-rotate', rot.card + 'deg');
        card.style.setProperty('--tape-rotate', rot.tape + 'deg');
        card.setAttribute('aria-label', data.name + ' – ' + data.type);

        card.innerHTML =
          '<span class="card-icon" aria-hidden="true">' + (ICONS[key] || '') + '</span>' +
          '<span class="card-title">' + data.name + '</span>' +
          '<span class="card-badge">' + data.type + '</span>';

        card.addEventListener('click', function (e) {
          e.preventDefault();
          navigateTo(key);
        });

        gridEl.appendChild(card);
      });

      sectionEl.appendChild(gridEl);
      dashboardMain.appendChild(sectionEl);
    });

    initScrollReveal();
  }


  /* ──────────────────────────────────────────────────────────
     FACH-ANSICHT RENDERN
     ────────────────────────────────────────────────────────── */
  function renderSubjectView(key) {
    var data = subjectData[key];
    if (!data) return;

    var accent     = av(data.accent);
    var hasContent = data.categories && data.categories.length > 0;
    var catHTML    = '';

    if (hasContent) {
      catHTML = data.categories.map(function (cat) {
        var topicsHTML = cat.topics.map(function (t) {
          return (
            '<li class="topic-item">' +
              '<a href="' + t.link + '" class="topic-link" style="--topic-accent:' + accent + '">' +
                t.title +
              '</a>' +
            '</li>'
          );
        }).join('');

        return (
          '<div class="category-block reveal">' +
            '<h3 class="category-header" style="--category-accent:' + accent + '">' +
              cat.name +
            '</h3>' +
            '<ul class="topic-list" style="--topic-accent:' + accent + '">' +
              topicsHTML +
            '</ul>' +
          '</div>'
        );
      }).join('');
    } else {
      catHTML =
        '<div class="empty-state reveal">' +
          '<p class="empty-text">Hier ist noch Platz für neue Notizen …</p>' +
          '<p class="empty-hint">Trage deine Themen in <code>faecher-daten.js</code> ein!</p>' +
        '</div>';
    }

    subjectView.innerHTML =
      '<nav class="subject-nav reveal">' +
        '<button class="back-button" aria-label="Zurück zum Dashboard">' +
          BACK_ARROW +
          '<span>Zurück zum Journal</span>' +
        '</button>' +
      '</nav>' +

      '<header class="subject-header reveal">' +
        '<span class="subject-icon" style="color:' + accent + '" aria-hidden="true">' +
          (ICONS[key] || '') +
        '</span>' +
        '<h1 class="subject-title">' + data.name + '</h1>' +
        '<span class="subject-badge" style="--badge-accent:' + accent + '">' + data.type + '</span>' +
      '</header>' +

      '<div class="subject-content">' +
        catHTML +
      '</div>';

    /* Zurück-Button Event */
    var backBtn = subjectView.querySelector('.back-button');
    if (backBtn) {
      backBtn.addEventListener('click', function (e) {
        e.preventDefault();
        navigateTo(null);
      });
    }

    initScrollReveal();
  }


  /* ──────────────────────────────────────────────────────────
     VIEW-WECHSEL MIT ANIMATION
     ────────────────────────────────────────────────────────── */
  var isTransitioning = false;

  function switchView(fromEl, toEl, onMiddle) {
    if (isTransitioning) return;
    isTransitioning = true;

    /* Phase 1: Ausblenden */
    fromEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    fromEl.style.opacity    = '0';
    fromEl.style.transform  = 'translateY(-18px)';

    setTimeout(function () {
      fromEl.style.display    = 'none';
      fromEl.style.opacity    = '';
      fromEl.style.transform  = '';
      fromEl.style.transition = '';

      /* Inhalt wechseln */
      if (onMiddle) onMiddle();

      /* Phase 2: Einblenden */
      toEl.style.display   = 'block';
      toEl.style.opacity   = '0';
      toEl.style.transform = 'translateY(18px)';

      window.scrollTo({ top: 0, behavior: 'instant' });

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          toEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          toEl.style.opacity    = '1';
          toEl.style.transform  = 'translateY(0)';

          setTimeout(function () {
            toEl.style.transition = '';
            isTransitioning = false;
          }, 420);
        });
      });
    }, 320);
  }


  /* ──────────────────────────────────────────────────────────
     NAVIGATION (Hash-basiert)
     ────────────────────────────────────────────────────────── */
  var currentSubject = null;

  function navigateTo(key) {
    if (isTransitioning) return;

    if (key && subjectData[key]) {
      if (currentSubject === key) return;
      history.pushState({ subject: key }, '', '#' + key);
      showSubject(key);
    } else {
      if (currentSubject === null) return;
      history.pushState({ subject: null }, '', window.location.pathname + window.location.search);
      showDashboard();
    }
  }

  function showSubject(key) {
    currentSubject = key;
    document.title = subjectData[key].name + ' · Oberstufen-Aufschriebe';

    if (dashboardView.style.display !== 'none') {
      switchView(dashboardView, subjectView, function () { renderSubjectView(key); });
    } else {
      renderSubjectView(key);
      subjectView.style.display = 'block';
      subjectView.style.opacity = '1';
      subjectView.style.transform = 'translateY(0)';
    }
  }

  function showDashboard() {
    currentSubject = null;
    document.title = 'Oberstufen-Aufschriebe · Lernzettel für die Kursstufe';

    if (subjectView.style.display === 'block') {
      switchView(subjectView, dashboardView);
    } else {
      dashboardView.style.display = 'block';
      dashboardView.style.opacity = '1';
      dashboardView.style.transform = 'translateY(0)';
    }
  }

  function handleRoute() {
    var hash = window.location.hash.slice(1);
    if (hash && subjectData[hash]) {
      showSubject(hash);
    } else {
      showDashboard();
    }
  }


  /* ──────────────────────────────────────────────────────────
     SCROLL REVEAL  (IntersectionObserver)
     ────────────────────────────────────────────────────────── */
  function initScrollReveal() {
    var elements = document.querySelectorAll('.reveal:not(.visible)');

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
      );
      elements.forEach(function (el) { observer.observe(el); });
    } else {
      elements.forEach(function (el) { el.classList.add('visible'); });
    }
  }


  /* ──────────────────────────────────────────────────────────
     PARALLAX DOT-GRID
     ────────────────────────────────────────────────────────── */
  function initParallax() {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          document.body.style.backgroundPositionY = (12 + window.scrollY * 0.08) + 'px';
          ticking = false;
        });
        ticking = true;
      }
    });
  }


  /* ──────────────────────────────────────────────────────────
     FULLSCREEN TOGGLE
     ────────────────────────────────────────────────────────── */
  function initFullscreen() {
    var btn = document.getElementById('fullscreen-toggle');
    if (!btn) return;
    
    btn.addEventListener('click', function() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(function(err) {
          console.warn('Vollbild konnte nicht aktiviert werden: ', err);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    });
    
    document.addEventListener('fullscreenchange', function() {
      if (document.fullscreenElement) {
        // Zu "Minimieren"-Icon wechseln
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>';
        btn.setAttribute('title', 'Vollbild beenden');
        btn.setAttribute('aria-label', 'Vollbild beenden');
      } else {
        // Zu "Vollbild"-Icon wechseln
        btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>';
        btn.setAttribute('title', 'Vollbild umschalten');
        btn.setAttribute('aria-label', 'Vollbild umschalten');
      }
    });
  }

  /* ──────────────────────────────────────────────────────────
     QUIZ GENERATOR MODAL
     ────────────────────────────────────────────────────────── */
  function initQuizGenerator() {
    var openBtn = document.getElementById('open-quiz-modal');
    var closeBtn = document.getElementById('close-quiz-modal');
    var modal = document.getElementById('quiz-modal');
    
    var subjectSelect = document.getElementById('quiz-subject');
    var topicGroup = document.getElementById('quiz-topic-group');
    var topicSelect = document.getElementById('quiz-topic');
    
    var generateBtn = document.getElementById('generate-quiz-prompt');
    var successBox = document.getElementById('quiz-success');
    var customText = document.getElementById('quiz-custom');

    if (!openBtn || !modal) return;

    // 1. Dropdown 1 (Fächer) befüllen
    Object.keys(subjectData).forEach(function(key) {
      var fach = subjectData[key];
      if (fach.categories && fach.categories.length > 0) {
        var opt = document.createElement('option');
        opt.value = key;
        opt.textContent = fach.name;
        subjectSelect.appendChild(opt);
      }
    });

    // 2. Wenn Fach gewählt wird -> Dropdown 2 (Themen inkl. Ordner) befüllen
    subjectSelect.addEventListener('change', function() {
      var fachKey = this.value;
      topicSelect.innerHTML = '<option value="">-- Bitte wählen --</option>';
      
      if (!fachKey) {
        topicGroup.style.display = 'none';
        return;
      }

      var fach = subjectData[fachKey];
      
      fach.categories.forEach(function(cat) {
        if (cat.topics && cat.topics.length > 0) {
          var optgroup = document.createElement('optgroup');
          optgroup.label = "Ordner: " + cat.name;
          
          cat.topics.forEach(function(t) {
            var opt = document.createElement('option');
            opt.value = t.link;
            opt.textContent = t.title;
            optgroup.appendChild(opt);
          });
          
          topicSelect.appendChild(optgroup);
        }
      });
      
      topicGroup.style.display = 'block';
    });

    // 3. Modal öffnen / schließen
    openBtn.addEventListener('click', function() {
      modal.classList.add('show');
      successBox.style.display = 'none';
      generateBtn.style.display = 'inline-flex';
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866m-6 .17h8c1.105 0 2 .91 2 2.035v10.857C20 21.09 19.105 22 18 22h-8c-1.105 0-2-.911-2-2.036V9.107c0-1.124.895-2.036 2-2.036z"/></svg> Prompt generieren & kopieren';
    });

    closeBtn.addEventListener('click', function() {
      modal.classList.remove('show');
    });

    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.classList.remove('show');
    });

    // 4. Prompt generieren (fachspezifische BW-Operatoren via LernTools)
    generateBtn.addEventListener('click', function() {
      var link = topicSelect.value;
      if (!link) {
        alert("Bitte wähle zuerst ein Fach und einen Lernzettel aus!");
        return;
      }
      if (!window.LernTools) {
        alert("lerntools-core.js konnte nicht geladen werden.");
        return;
      }

      var fachKey = subjectSelect.value;
      var afbElement = document.querySelector('input[name="quiz-afb"]:checked');
      var afb = afbElement ? afbElement.value : "II";
      var topicName = topicSelect.options[topicSelect.selectedIndex].text;
      var extra = customText.value.trim();
      var zusatzBox = document.getElementById('quiz-zusatz');
      var zusatz = (zusatzBox && zusatzBox.checked) ? LernTools.getZusatzwissen(fachKey) : '';

      generateBtn.textContent = 'Lade Lernzettel...';
      generateBtn.disabled = true;

      LernTools.loadTopicText(link)
        .then(function(textContent) {
          var prompt = LernTools.buildQuizPrompt({
            fachKey: fachKey,
            topicTitles: [topicName],
            text: textContent,
            afb: afb,
            extra: extra,
            zusatz: zusatz
          });
          return LernTools.copyToClipboard(prompt);
        })
        .then(function(ok) {
          generateBtn.style.display = 'none';
          if (ok) successBox.style.display = 'block';
        })
        .catch(function(err) {
          alert("Fehler beim Laden des Lernzettels: " + err.message);
          generateBtn.textContent = 'Fehler aufgetreten';
          generateBtn.disabled = false;
        });
    });

    // 5. Fachspezifische AFB-Infos + Operatoren (und Deutsch-Aufsatz-Modus) anzeigen
    var lastQuizFach = '';
    function updateAfbInfo() {
      var info = document.getElementById('quiz-afb-info');
      var zGroup = document.getElementById('quiz-zusatz-group');
      var fachKey = subjectSelect.value;
      if (!info || !window.LernTools) return;

      /* Radio-Beschriftungen je nach Fach (Deutsch = Aufsatz-Training statt Kleinteil-Arbeit) anpassen */
      var isDe = fachKey === 'deutsch';
      if (fachKey !== lastQuizFach) {
        lastQuizFach = fachKey;
        if (isDe) {
          var mixRadio = document.querySelector('input[name="quiz-afb"][value="MIX"]');
          if (mixRadio) mixRadio.checked = true;
        }
      }
      var radioLabels = {
        I:   isDe ? 'Aufsatz-Baustein 1: Einleitung (TATTE) & Inhaltsangabe (an einer Kurzgeschichte)' : 'AFB I (Reproduktion)',
        II:  isDe ? 'Aufsatz-Baustein 2: Hauptteil-Analyse im 15-P-Dreischritt (an einer Kurzgeschichte)' : 'AFB II (Reorganisation & Transfer)',
        III: isDe ? 'Aufsatz-Baustein 3: Tiefendeutung (Eisberg) & Schluss (an einer Kurzgeschichte)' : 'AFB III (Reflexion & Problemlösung)',
        MIX: isDe ? '✍️ Ganzer Aufsatz / Klausur (Vollständige Kurzgeschichte + 1 Aufsatz-Auftrag + 15-P-Musteraufsatz)' : 'Klausur-Mix (AFB I – III)'
      };
      Array.prototype.forEach.call(document.querySelectorAll('input[name="quiz-afb"]'), function(r) {
        var lbl = r.parentNode;
        if (!lbl || !radioLabels[r.value]) return;
        /* Textknoten hinter dem Input aktualisieren */
        while (lbl.childNodes.length > 1) lbl.removeChild(lbl.lastChild);
        lbl.appendChild(document.createTextNode(' ' + radioLabels[r.value]));
      });

      if (!fachKey) { info.style.display = 'none'; if (zGroup) zGroup.style.display = 'none'; return; }

      var afbEl = document.querySelector('input[name="quiz-afb"]:checked');
      var afb = afbEl ? afbEl.value : 'II';
      var esc = function(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
      var html = '';
      if (isDe) {
        if (afb === 'MIX') {
          html = '<b>✍️ Echte Deutsch-Klausur (Aufsatz im Fließtext statt Einzel-Fragen!):</b><br>' +
                 'Gemini gibt dir <b>1) eine komplette Übungs-Kurzgeschichte mit Zeilennummern [Z. 5], [Z. 10] …</b>, darunter <b>2) EINE authentische BW-Aufsatz-Aufgabenstellung</b> (z. B. <i>„Interpretieren Sie die Kurzgeschichte …“</i>) und unter der Trennlinie <b>3) den Erwartungshorizont + einen komplett ausformulierten 15-Punkte-Musteraufsatz</b>!';
        } else if (afb === 'I') {
          html = '<b>✍️ Aufsatz-Baustein 1 (Einleitung &amp; Inhaltsangabe):</b><br>Du bekommst eine kurze Übungs-Kurzgeschichte (mit Zeilennummern) und trainierst die <b>Einleitung (Aufhänger + TATTE + Deutungshypothese)</b> sowie die <b>Inhaltsangabe im Präsens &amp; Konjunktiv I</b> (inkl. 15-Punkte-Musterlösung).';
        } else if (afb === 'II') {
          html = '<b>✍️ Aufsatz-Baustein 2 (Hauptteil im 15-Punkte-Dreischritt):</b><br>Du bekommst eine dichte Übungs-Kurzgeschichte und trainierst 2–3 <b>aspektorientierte Hauptteil-Absätze</b> (Erzähltechnik, Kommunikation nach Schulz von Thun / Watzlawick, Sprache/Symbolik) im Dreischritt: <b>Form → Zitat + Zeile → Deutung</b>.';
        } else {
          html = '<b>✍️ Aufsatz-Baustein 3 (Tiefendeutung &amp; Schluss):</b><br>Du bekommst eine Übungs-Kurzgeschichte mit offenem Schluss und trainierst die <b>Deutung der Leerstellen (Eisberg-Modell)</b> sowie einen abiturreifen <b>Schlussabsatz</b> (Fazit, Hypothesen-Rückbezug, Ausblick).';
        }
      } else if (afb === 'MIX') {
        html = '<b>Klausur-Mix in ' + esc(subjectData[fachKey].name) + ':</b> AFB I ca. 30 %, AFB II ca. 40 %, AFB III ca. 30 % – wie im Abitur.';
        ['I', 'II', 'III'].forEach(function(a) {
          var ops = LernTools.getOperatorNames(fachKey, a, 6);
          if (ops) html += '<br><b>AFB ' + a + ':</b> <i>' + esc(ops) + '</i>';
        });
      } else {
        html = '<b>AFB ' + afb + ' in ' + esc(subjectData[fachKey].name) + ':</b> ' + esc(LernTools.getAfbDescription(fachKey, afb));
        var ops = LernTools.getOperatorNames(fachKey, afb);
        if (ops) html += '<br><b>Operatoren:</b> <i>' + esc(ops) + '</i>';
      }
      info.innerHTML = html;
      info.style.display = 'block';

      if (zGroup) zGroup.style.display = LernTools.getZusatzwissen(fachKey) ? 'block' : 'none';
    }

    subjectSelect.addEventListener('change', updateAfbInfo);
    Array.prototype.forEach.call(document.querySelectorAll('input[name="quiz-afb"]'), function(r) {
      r.addEventListener('change', updateAfbInfo);
    });
    openBtn.addEventListener('click', updateAfbInfo);
  }

  /* ──────────────────────────────────────────────────────────
     ANKI GENERATOR MODAL
     ────────────────────────────────────────────────────────── */
  function initAnkiGenerator() {
    var openBtn = document.getElementById('open-anki-modal');
    var closeBtn = document.getElementById('close-anki-modal');
    var modal = document.getElementById('anki-modal');
    
    var subjectSelect = document.getElementById('anki-subject');
    var topicGroup = document.getElementById('anki-topic-group');
    var topicSelect = document.getElementById('anki-topic');
    
    var generateBtn = document.getElementById('generate-anki-prompt');
    var successBox = document.getElementById('anki-success');
    var customText = document.getElementById('anki-custom');
    var pasteArea = document.getElementById('anki-paste-area');
    var downloadBtn = document.getElementById('download-anki-csv');

    if (!openBtn || !modal) return;

    // 1. Dropdown 1 (Fächer) befüllen
    Object.keys(subjectData).forEach(function(key) {
      var fach = subjectData[key];
      if (fach.categories && fach.categories.length > 0) {
        var opt = document.createElement('option');
        opt.value = key;
        opt.textContent = fach.name;
        subjectSelect.appendChild(opt);
      }
    });

    // 2. Wenn Fach gewählt wird -> Dropdown 2 (Themen inkl. Ordner) befüllen
    subjectSelect.addEventListener('change', function() {
      var fachKey = this.value;
      topicSelect.innerHTML = '<option value="">-- Bitte wählen --</option>';
      
      if (!fachKey) {
        topicGroup.style.display = 'none';
        return;
      }

      var fach = subjectData[fachKey];
      
      fach.categories.forEach(function(cat) {
        if (cat.topics && cat.topics.length > 0) {
          var optgroup = document.createElement('optgroup');
          optgroup.label = "Ordner: " + cat.name;
          
          cat.topics.forEach(function(t) {
            var opt = document.createElement('option');
            opt.value = t.link;
            opt.textContent = t.title;
            optgroup.appendChild(opt);
          });
          
          topicSelect.appendChild(optgroup);
        }
      });
      
      topicGroup.style.display = 'block';
    });

    // 3. Modal öffnen / schließen
    openBtn.addEventListener('click', function() {
      modal.classList.add('show');
      successBox.style.display = 'none';
      pasteArea.value = '';
      generateBtn.style.display = 'inline-flex';
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866m-6 .17h8c1.105 0 2 .91 2 2.035v10.857C20 21.09 19.105 22 18 22h-8c-1.105 0-2-.911-2-2.036V9.107c0-1.124.895-2.036 2-2.036z"/></svg> Prompt generieren & kopieren';
    });

    closeBtn.addEventListener('click', function() {
      modal.classList.remove('show');
    });

    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.classList.remove('show');
    });

    // 4. Prompt generieren
    generateBtn.addEventListener('click', function() {
      var link = topicSelect.value;
      if (!link) {
        alert("Bitte wähle zuerst ein Fach und einen Lernzettel aus!");
        return;
      }
      
      var topicName = topicSelect.options[topicSelect.selectedIndex].text;
      var extra = customText.value.trim();

      generateBtn.textContent = 'Lade Lernzettel...';
      generateBtn.disabled = true;

      fetch(link)
        .then(function(res) {
          if (!res.ok) throw new Error("Datei konnte nicht geladen werden.");
          return res.text();
        })
        .then(function(html) {
          // HTML parsen
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, "text/html");
          var textContent = "";
          
          var pages = doc.querySelectorAll('.page');
          if (pages.length > 0) {
            pages.forEach(function(page) {
              textContent += (page.innerText || page.textContent) + "\n\n";
            });
          } else {
            var mainContent = doc.querySelector('.content-wrapper') || doc.body;
            textContent = mainContent.innerText || mainContent.textContent;
          }
          
          // Zu viele Leerzeilen bereinigen
          textContent = textContent.replace(/[\r\n]{3,}/g, '\n\n').trim();

          // Baue den Prompt für Anki
          var prompt = "Du bist ein Experte im Erstellen von Lernmaterialien und Karteikarten.\n\n";
          prompt += "Ich möchte Karteikarten für das Programm 'Anki' zum Thema \"" + topicName + "\" erstellen.\n";
          prompt += "Bitte lies dir den folgenden Text durch und erstelle daraus detaillierte, gut lernbare Karteikarten.\n\n";
          prompt += "WICHTIGE REGELN FÜR DEINE ANTWORT:\n";
          prompt += "1. Antworte AUSSCHLIESSLICH mit dem CSV-Text. Kein Hallo, keine Erklärungen, kein Markdown-Codeblock.\n";
          prompt += "2. Das Format jeder Zeile muss exakt so aussehen: Frage;Antwort\n";
          prompt += "3. Halte die Fragen präzise und die Antworten kurz und einprägsam. Achte darauf, dass innerhalb der Antwort keine Zeilenumbrüche stehen, sondern schreibe sie in einen fortlaufenden Satz oder trenne mit Kommata.\n";
          
          if (extra) {
            prompt += "4. Zusätzliche Wünsche des Schülers:\n" + extra + "\n\n";
          }

          var ankiZusatz = window.LernTools ? LernTools.getZusatzwissen(subjectSelect.value) : '';
          if (ankiZusatz) {
            prompt += "\nErstelle zusätzlich Karteikarten zu folgendem Zusatzwissen, das ebenfalls prüfungsrelevant ist (gleiches Format):\n" + ankiZusatz + "\n";
          }
          
          prompt += "\nHier ist der Text, den du als einzige Grundlage nutzen sollst:\n";
          prompt += "----------------------------------------\n";
          prompt += textContent + "\n";
          prompt += "----------------------------------------\n";

          return navigator.clipboard.writeText(prompt);
        })
        .then(function() {
          successBox.style.display = 'block';
          generateBtn.style.display = 'none';
        })
        .catch(function(err) {
          alert("Fehler beim Laden des Lernzettels: " + err.message);
          generateBtn.textContent = 'Fehler aufgetreten';
        });
    });

    // 5. TXT Datei generieren & herunterladen (Anki-kompatibel mit Tabs)
    downloadBtn.addEventListener('click', function() {
      var content = pasteArea.value.trim();
      if (!content) {
        alert("Bitte füge zuerst den Text von Gemini ein!");
        return;
      }
      
      // Konvertiere ; zu Tab (\t) für perfekten Anki-Import
      var lines = content.split('\n');
      var processedLines = lines.map(function(line) {
        var firstSemi = line.indexOf(';');
        if (firstSemi !== -1) {
          return line.substring(0, firstSemi) + '\t' + line.substring(firstSemi + 1);
        }
        return line;
      });
      var finalContent = processedLines.join('\n');
      
      // UTF-8 BOM hinzufügen für korrekte Umlaute in Excel/Anki
      var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      var blob = new Blob([bom, finalContent], { type: 'text/plain;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      
      var link = document.createElement('a');
      link.href = url;
      var safeName = topicSelect.options[topicSelect.selectedIndex].text.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = safeName + '_karteikarten.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  /* ──────────────────────────────────────────────────────────
     GEMINI NOTEBOOK EXPORT
     ────────────────────────────────────────────────────────── */
  function initNotebookExport() {
    var openBtn = document.getElementById('open-notebook-modal');
    var closeBtn = document.getElementById('close-notebook-modal');
    var modal = document.getElementById('notebook-modal');
    
    var subjectSelect = document.getElementById('notebook-subject');
    var topicGroup = document.getElementById('notebook-topic-group');
    var topicSelect = document.getElementById('notebook-topic');
    
    var downloadBtn = document.getElementById('download-notebook-txt');
    var successBox = document.getElementById('notebook-success');

    if (!openBtn || !modal) return;

    // 1. Dropdown 1 (Fächer) befüllen
    Object.keys(subjectData).forEach(function(key) {
      var fach = subjectData[key];
      if (fach.categories && fach.categories.length > 0) {
        var opt = document.createElement('option');
        opt.value = key;
        opt.textContent = fach.name;
        subjectSelect.appendChild(opt);
      }
    });

    // 2. Wenn Fach gewählt wird -> Themen befüllen
    subjectSelect.addEventListener('change', function() {
      var fachKey = this.value;
      topicSelect.innerHTML = '<option value="">-- Bitte w\u00e4hlen --</option>';
      
      if (!fachKey) {
        topicGroup.style.display = 'none';
        return;
      }

      var fach = subjectData[fachKey];
      
      fach.categories.forEach(function(cat) {
        if (cat.topics && cat.topics.length > 0) {
          var optgroup = document.createElement('optgroup');
          optgroup.label = "Ordner: " + cat.name;
          
          cat.topics.forEach(function(t) {
            var opt = document.createElement('option');
            opt.value = t.link;
            opt.textContent = t.title;
            optgroup.appendChild(opt);
          });
          
          topicSelect.appendChild(optgroup);
        }
      });
      
      topicGroup.style.display = 'block';
    });

    // 3. Modal öffnen / schließen
    openBtn.addEventListener('click', function() {
      modal.classList.add('show');
      successBox.style.display = 'none';
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Als .txt herunterladen';
    });

    closeBtn.addEventListener('click', function() {
      modal.classList.remove('show');
    });

    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.classList.remove('show');
    });

    // 4. Textdatei herunterladen
    downloadBtn.addEventListener('click', function() {
      var link = topicSelect.value;
      if (!link) {
        alert("Bitte w\u00e4hle zuerst ein Fach und einen Lernzettel aus!");
        return;
      }
      
      var topicName = topicSelect.options[topicSelect.selectedIndex].text;

      downloadBtn.textContent = 'Lade Lernzettel...';
      downloadBtn.disabled = true;

      fetch(link)
        .then(function(res) {
          if (!res.ok) throw new Error("Datei konnte nicht geladen werden.");
          return res.text();
        })
        .then(function(html) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, "text/html");
          var textContent = "";
          
          var pages = doc.querySelectorAll('.page');
          if (pages.length > 0) {
            pages.forEach(function(page, i) {
              textContent += "--- Seite " + (i + 1) + " ---\n\n";
              textContent += (page.innerText || page.textContent) + "\n\n";
            });
          } else {
            var mainContent = doc.querySelector('.content-wrapper') || doc.body;
            textContent = mainContent.innerText || mainContent.textContent;
          }
          
          textContent = textContent.replace(/[\r\n]{3,}/g, '\n\n').trim();

          // Datei erstellen und herunterladen
          var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
          var blob = new Blob([bom, textContent], { type: 'text/plain;charset=utf-8;' });
          var url = URL.createObjectURL(blob);
          
          var a = document.createElement('a');
          a.href = url;
          var safeName = topicName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
          a.download = safeName + '.txt';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          successBox.style.display = 'block';
          downloadBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Als .txt herunterladen';
          downloadBtn.disabled = false;
        })
        .catch(function(err) {
          alert("Fehler beim Laden des Lernzettels: " + err.message);
          downloadBtn.textContent = 'Fehler aufgetreten';
        });
    });
  }

  /* ──────────────────────────────────────────────────────────
     DEEP-LINKS AUS DEM LERNPLANER
     z. B. index.html?tool=quiz&fach=mathe&topic=mathe/x.html&afb=III
     ────────────────────────────────────────────────────────── */
  function handleToolDeepLink() {
    var q = {};
    window.location.search.replace(/^\?/, '').split('&').forEach(function(part) {
      if (!part) return;
      var kv = part.split('=');
      q[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' '));
    });
    var map = {
      quiz:     ['open-quiz-modal', 'quiz-subject', 'quiz-topic'],
      anki:     ['open-anki-modal', 'anki-subject', 'anki-topic'],
      notebook: ['open-notebook-modal', 'notebook-subject', 'notebook-topic']
    };
    var m = map[q.tool];
    if (!m) return;
    var openBtn = document.getElementById(m[0]);
    if (!openBtn) return;
    openBtn.click();
    var subj = document.getElementById(m[1]);
    if (q.fach && subjectData[q.fach] && subj) {
      subj.value = q.fach;
      subj.dispatchEvent(new Event('change'));
      if (q.topic) {
        var ts = document.getElementById(m[2]);
        if (ts) ts.value = q.topic;
      }
    }
    if (q.tool === 'quiz' && q.afb) {
      var r = document.querySelector('input[name="quiz-afb"][value="' + q.afb + '"]');
      if (r) { r.checked = true; r.dispatchEvent(new Event('change')); }
    }
  }

  /* ──────────────────────────────────────────────────────────
     INITIALISIERUNG
     ────────────────────────────────────────────────────────── */
  function init() {
    renderDashboard();
    initParallax();
    initFullscreen();
    initQuizGenerator();
    initAnkiGenerator();
    initNotebookExport();
    handleToolDeepLink();

    /* Direkt-Link via Hash (z. B. index.html#chemie) */
    var hash = window.location.hash.slice(1);
    if (hash && subjectData[hash]) {
      dashboardView.style.display = 'none';
      renderSubjectView(hash);
      subjectView.style.display   = 'block';
      subjectView.style.opacity   = '1';
      subjectView.style.transform = 'translateY(0)';
      currentSubject = hash;
      document.title = subjectData[hash].name + ' · Oberstufen-Aufschriebe';
    }

    /* Browser vor-/zurück */
    window.addEventListener('popstate', handleRoute);
  }

  document.addEventListener('DOMContentLoaded', init);

})();
