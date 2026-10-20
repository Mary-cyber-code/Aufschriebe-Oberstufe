/* ============================================================
   PDF-Export & Druck-Optimierung für alle Lernzettel
   - Ermöglicht den direkten 1-Klick-Download jedes Lernzettels
     als mehrseitige A4-PDF-Datei (.pdf)
   - Behebt Layout-/Spezifitäts-Probleme beim Drucken aus dem
     Plakat-Modus und unterstützt ?pdf=1 Direkt-Downloads
   ============================================================ */

(function () {
  'use strict';

  var HTML2CANVAS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  var JSPDF_URL       = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

  /* ──────────────────────────────────────────────────────────
     1. Globales Print- & PDF-Export-Stylesheet injizieren
     ────────────────────────────────────────────────────────── */
  function injectPdfStyles() {
    if (document.getElementById('lz-pdf-styles')) return;
    var style = document.createElement('style');
    style.id = 'lz-pdf-styles';
    style.textContent =
      /* Im Plakat-Modus sicheres vertikales Zentrieren + vollständiges Hoch-/Runterscrollen bei langen Kärtchen */
      'body:not(.print-mode) .flashcard-front, body:not(.print-mode) .flashcard-back { align-items: flex-start !important; overflow-y: auto !important; scrollbar-width: thin !important; scrollbar-color: rgba(201, 169, 110, 0.6) transparent !important; }' +
      'body:not(.print-mode) .flashcard span, body:not(.print-mode) .flashcard p { margin: auto 0 !important; }' +

      /* Lesbarkeit auf gedruckten Karteikarten-Rückseiten */
      'body.print-mode .flashcard-back .highlight { color: var(--forest) !important; }' +
      'body.print-mode .flashcard-front, body.print-mode .flashcard-back { backface-visibility: visible !important; overflow: visible !important; }' +

      /* Exakter A4-Erfassungsmodus für den direkten PDF-Download (auch auf Handy/Tablet 210mm breit) */
      'body.pdf-exporting {' +
        'width: 210mm !important; min-width: 210mm !important; max-width: 210mm !important;' +
        'padding-top: 0 !important; margin: 0 !important; background: #ffffff !important;' +
      '}' +
      'body.pdf-exporting nav, body.pdf-exporting #lz-pdf-toast { display: none !important; }' +
      'body.pdf-exporting .content-wrapper {' +
        'display: block !important; width: 210mm !important; max-width: none !important;' +
        'padding: 0 !important; margin: 0 !important;' +
      '}' +
      'body.pdf-exporting .page {' +
        'width: 210mm !important; min-height: 297mm !important; height: auto !important;' +
        'margin: 0 !important; box-shadow: none !important; background: #ffffff !important;' +
        'display: flex !important; flex-direction: column !important; overflow: visible !important;' +
        'box-sizing: border-box !important;' +
      '}' +
      'body.pdf-exporting .card {' +
        'background: transparent !important; border: none !important; padding: 0 !important;' +
        'box-shadow: none !important; flex: none !important;' +
      '}' +
      'body.pdf-exporting .page-footer {' +
        'display: flex !important; margin-top: auto !important;' +
      '}' +
      'body.pdf-exporting .flashcards-container {' +
        'display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 5mm !important;' +
      '}' +
      'body.pdf-exporting .flashcard {' +
        'width: auto !important; height: auto !important; min-height: auto !important;' +
        'border: 1px solid #2D3A2E !important; border-radius: 4px !important;' +
      '}' +
      'body.pdf-exporting .flashcard-inner {' +
        'transform: none !important; transition: none !important; display: flex !important; flex-direction: column !important;' +
      '}' +
      'body.pdf-exporting .flashcard-front, body.pdf-exporting .flashcard-back {' +
        'position: static !important; height: auto !important; border: none !important;' +
        'box-shadow: none !important; background: transparent !important; color: #2D3A2E !important;' +
        'transform: none !important; backface-visibility: visible !important; overflow: visible !important;' +
      '}' +
      'body.pdf-exporting .flashcard-front { border-bottom: 1px dashed #999 !important; }' +
      'body.pdf-exporting .flashcard-back .highlight { color: var(--forest) !important; }' +
      'body.pdf-exporting mjx-assistive-mml { display: none !important; }' +
      'body.pdf-exporting mjx-container { overflow: visible !important; }' +

      /* @media print Korrekturen (damit auch Strg+P aus dem Plakat-Modus perfekt als A4 druckt) */
      '@media print {' +
        '@page { size: A4; margin: 0; }' +
        'html, body {' +
          'background: #ffffff !important; padding-top: 0 !important; margin: 0 !important;' +
          '-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;' +
        '}' +
        'body nav, #lz-pdf-toast { display: none !important; }' +
        'body .content-wrapper {' +
          'display: block !important; max-width: none !important; padding: 0 !important; margin: 0 !important;' +
        '}' +
        'body .page {' +
          'display: flex !important; flex-direction: column !important;' +
          'width: 210mm !important; min-height: 297mm !important; height: auto !important;' +
          'margin: 0 !important; box-shadow: none !important; background: #ffffff !important;' +
          'overflow: visible !important; break-after: page !important; page-break-after: always !important;' +
          'box-sizing: border-box !important;' +
        '}' +
        'body .page:last-child { break-after: auto !important; page-break-after: auto !important; }' +
        'body .card {' +
          'background: transparent !important; border: none !important; padding: 0 !important;' +
          'box-shadow: none !important; flex: none !important;' +
        '}' +
        'body .page-footer { display: flex !important; margin-top: auto !important; }' +
        'body .flashcards-container { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 5mm !important; }' +
        'body .flashcard { width: auto !important; height: auto !important; min-height: auto !important; border: 1px solid #000 !important; border-radius: 0 !important; break-inside: avoid !important; page-break-inside: avoid !important; }' +
        'body .flashcard-inner { transform: none !important; transition: none !important; display: flex !important; flex-direction: column !important; }' +
        'body .flashcard-front, body .flashcard-back { position: static !important; height: auto !important; border: none !important; box-shadow: none !important; background: transparent !important; color: #000 !important; transform: none !important; backface-visibility: visible !important; overflow: visible !important; }' +
        'body .flashcard-front { border-bottom: 1px dashed #000 !important; }' +
        'body .flashcard-back .highlight { color: var(--forest) !important; }' +
        'mjx-assistive-mml { display: none !important; }' +
      '}' +

      /* Schwebendes Status-Toast für den PDF-Export */
      '#lz-pdf-toast {' +
        'position: fixed; bottom: 22px; right: 22px; z-index: 99999;' +
        'background: #FDFCF8; color: #2D3A2E; border: 1.5px solid #C9A96E;' +
        'border-left: 5px solid #3A5A3F; border-radius: 8px; padding: 14px 18px;' +
        'box-shadow: 0 10px 28px rgba(45, 58, 46, 0.18); font-family: "Raleway", sans-serif;' +
        'font-size: 0.9rem; line-height: 1.45; max-width: 360px; transition: opacity 0.25s ease;' +
      '}' +
      '#lz-pdf-toast strong { color: #3A5A3F; font-family: "Playfair Display", serif; font-size: 0.98rem; display: block; margin-bottom: 3px; }' +
      '#lz-pdf-toast .lz-toast-sub { font-size: 0.8rem; color: #5A6B5C; margin-top: 6px; display: block; }' +
      '#lz-pdf-toast .lz-toast-link { color: #3A5A3F; font-weight: 600; text-decoration: underline; cursor: pointer; background: none; border: none; padding: 0; font-family: inherit; font-size: 0.8rem; }';
    document.head.appendChild(style);
  }

  /* ──────────────────────────────────────────────────────────
     2. Dynamischer Script-Loader (für html2canvas & jsPDF)
     ────────────────────────────────────────────────────────── */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing && existing.getAttribute('data-loaded') === '1') {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () {
        s.setAttribute('data-loaded', '1');
        resolve();
      };
      s.onerror = function () {
        reject(new Error('Bibliothek konnte nicht geladen werden: ' + src));
      };
      document.head.appendChild(s);
    });
  }

  function ensurePdfLibs() {
    var p1 = window.html2canvas ? Promise.resolve() : loadScript(HTML2CANVAS_URL);
    var p2 = (window.jspdf && window.jspdf.jsPDF) ? Promise.resolve() : loadScript(JSPDF_URL);
    return Promise.all([p1, p2]);
  }

  /* ──────────────────────────────────────────────────────────
     3. Toast-Benachrichtigung
     ────────────────────────────────────────────────────────── */
  var toastTimer = null;
  function showPdfToast(title, bodyHtml, autoHideMs) {
    var el = document.getElementById('lz-pdf-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'lz-pdf-toast';
      el.setAttribute('data-html2canvas-ignore', 'true');
      document.body.appendChild(el);
    }
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    el.style.opacity = '1';
    el.style.display = 'block';
    el.innerHTML = '<strong>' + title + '</strong><div>' + bodyHtml + '</div>';

    var printLink = el.querySelector('[data-lz-print-fallback]');
    if (printLink) {
      printLink.addEventListener('click', function () {
        el.style.display = 'none';
        triggerCleanPrint();
      });
    }

    if (autoHideMs) {
      toastTimer = setTimeout(function () {
        el.style.opacity = '0';
        setTimeout(function () { if (el) el.style.display = 'none'; }, 260);
      }, autoHideMs);
    }
  }

  /* ──────────────────────────────────────────────────────────
     4. Sauberen Dateinamen aus Seitentitel generieren
     ────────────────────────────────────────────────────────── */
  function getPdfFilename() {
    var raw = document.title || '';
    if (!raw) {
      var h1 = document.querySelector('h1');
      raw = h1 ? h1.textContent : 'Lernzettel';
    }
    var clean = raw
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
      .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return (clean || 'Lernzettel') + '.pdf';
  }

  /* ──────────────────────────────────────────────────────────
     5. Sauberer Druckdialog (wechselt automatisch in A4-Modus)
     ────────────────────────────────────────────────────────── */
  function triggerCleanPrint() {
    var wasPrintMode = document.body.classList.contains('print-mode');
    if (!wasPrintMode) {
      document.body.classList.add('print-mode');
    }
    var restore = function () {
      if (!wasPrintMode) {
        document.body.classList.remove('print-mode');
      }
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    setTimeout(function () {
      window.print();
    }, 80);
  }

  /* ──────────────────────────────────────────────────────────
     6. Direkter mehrseitiger A4-PDF-Download
     ────────────────────────────────────────────────────────── */
  var isExporting = false;

  function downloadLernzettelPdf() {
    if (isExporting) return;
    isExporting = true;

    var btnPdf = document.getElementById('btn-save-pdf');
    var origBtnText = btnPdf ? btnPdf.innerHTML : '';
    if (btnPdf) {
      btnPdf.disabled = true;
      btnPdf.textContent = '⏳ PDF wird erstellt…';
    }

    showPdfToast('📄 PDF wird vorbereitet…', 'Lade A4-Layout und Schriftarten…', 0);

    var wasPrintMode = document.body.classList.contains('print-mode');
    var prevScrollX = window.scrollX || window.pageXOffset || 0;
    var prevScrollY = window.scrollY || window.pageYOffset || 0;

    ensurePdfLibs()
      .then(function () {
        if (document.fonts && document.fonts.ready) {
          return document.fonts.ready;
        }
      })
      .then(function () {
        if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
          return window.MathJax.typesetPromise();
        }
      })
      .then(function () {
        document.body.classList.add('print-mode', 'pdf-exporting');
        window.scrollTo(0, 0);
        return new Promise(function (r) { setTimeout(r, 150); });
      })
      .then(function () {
        var pages = Array.prototype.slice.call(document.querySelectorAll('.page'));
        if (!pages.length) {
          var wrapper = document.querySelector('.content-wrapper') || document.body;
          pages = [wrapper];
        }

        var jsPDF = window.jspdf.jsPDF;
        var pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        });

        var total = pages.length;
        var chain = Promise.resolve();

        pages.forEach(function (pageEl, idx) {
          chain = chain.then(function () {
            showPdfToast(
              '⏳ Erstelle PDF (Seite ' + (idx + 1) + ' von ' + total + ')…',
              'Dein Lernzettel wird im A4-Format gerendert…',
              0
            );
            return window.html2canvas(pageEl, {
              scale: 2,
              useCORS: true,
              backgroundColor: '#ffffff',
              logging: false,
              scrollX: 0,
              scrollY: 0,
              windowWidth: 1200
            }).then(function (canvas) {
              if (idx > 0) {
                pdf.addPage('a4', 'portrait');
              }
              var imgData = canvas.toDataURL('image/jpeg', 0.95);
              var pageW = 210;
              var pageH = 297;
              var renderW = pageW;
              var renderH = (canvas.height * pageW) / canvas.width;
              var offsetX = 0;
              var offsetY = 0;

              /* Falls eine Seite minimal höher als 297mm ist, proportional einpassen statt abschneiden */
              if (renderH > pageH) {
                renderH = pageH;
                renderW = (canvas.width * pageH) / canvas.height;
                offsetX = (pageW - renderW) / 2;
              }

              pdf.addImage(imgData, 'JPEG', offsetX, offsetY, renderW, renderH, undefined, 'FAST');
            });
          });
        });

        return chain.then(function () {
          var filename = getPdfFilename();
          pdf.save(filename);
          return filename;
        });
      })
      .then(function (filename) {
        document.body.classList.remove('pdf-exporting');
        if (!wasPrintMode) {
          document.body.classList.remove('print-mode');
        }
        window.scrollTo(prevScrollX, prevScrollY);
        isExporting = false;
        if (btnPdf) {
          btnPdf.disabled = false;
          btnPdf.innerHTML = origBtnText;
        }
        showPdfToast(
          '✅ PDF erfolgreich gespeichert!',
          'Datei: <b>' + filename + '</b>' +
          '<span class="lz-toast-sub">Tipp: <button type="button" class="lz-toast-link" data-lz-print-fallback="1">Alternativ über Druckdialog öffnen</button></span>',
          7000
        );
      })
      .catch(function (err) {
        console.warn('Direkter PDF-Export fehlgeschlagen, wechsle zu Druckdialog:', err);
        document.body.classList.remove('pdf-exporting');
        if (!wasPrintMode) {
          document.body.classList.remove('print-mode');
        }
        window.scrollTo(prevScrollX, prevScrollY);
        isExporting = false;
        if (btnPdf) {
          btnPdf.disabled = false;
          btnPdf.innerHTML = origBtnText;
        }
        showPdfToast(
          '🖨️ Druckmenü geöffnet',
          'Wähle im Druckfenster als Ziel <b>„Als PDF speichern“</b> aus.',
          6000
        );
        triggerCleanPrint();
      });
  }

  /* ──────────────────────────────────────────────────────────
     7. Navigation & Buttons in jedem Lernzettel initialisieren
     ────────────────────────────────────────────────────────── */
  function initLernzettelPdfButtons() {
    injectPdfStyles();

    var btnPrint = document.getElementById('btn-print');
    var btnSavePdf = document.getElementById('btn-save-pdf');

    /* Falls #btn-save-pdf noch nicht im HTML steht, automatisch neben #btn-print einfügen */
    if (btnPrint && !btnSavePdf) {
      btnSavePdf = document.createElement('button');
      btnSavePdf.type = 'button';
      btnSavePdf.className = 'nav-btn gold';
      btnSavePdf.id = 'btn-save-pdf';
      btnSavePdf.innerHTML = '📄 Als PDF speichern';
      btnPrint.classList.remove('gold');
      btnPrint.textContent = '🖨️ Drucken';
      btnPrint.parentNode.insertBefore(btnSavePdf, btnPrint);
    }

    if (btnSavePdf) {
      btnSavePdf.addEventListener('click', function (e) {
        e.preventDefault();
        downloadLernzettelPdf();
      });
    }

    /* Beim Klick auf "Drucken" oder Strg+P immer zuerst A4-Modus aktivieren */
    var wasPrintModeBeforeCtrlP = false;
    window.addEventListener('beforeprint', function () {
      wasPrintModeBeforeCtrlP = document.body.classList.contains('print-mode');
      if (!wasPrintModeBeforeCtrlP) {
        document.body.classList.add('print-mode');
      }
    });
    window.addEventListener('afterprint', function () {
      if (!wasPrintModeBeforeCtrlP && !isExporting) {
        var btnDruck = document.getElementById('btn-druck');
        if (!btnDruck || !btnDruck.classList.contains('active')) {
          document.body.classList.remove('print-mode');
        }
      }
    });

    /* Auto-Trigger bei Aufruf mit ?pdf=1 (z. B. von der Hauptseite oder dem Lernplaner) */
    if (window.location.search.indexOf('pdf=1') !== -1) {
      window.addEventListener('load', function () {
        setTimeout(function () {
          downloadLernzettelPdf();
        }, 350);
      });
    }
  }

  window.LernzettelPDF = {
    download: downloadLernzettelPdf,
    print: triggerCleanPrint
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLernzettelPdfButtons);
  } else {
    initLernzettelPdfButtons();
  }
})();
