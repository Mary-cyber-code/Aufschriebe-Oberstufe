# Dein Master-Prompt für KI-generierte Lernzettel (V2 - Kompaktes Druck-Layout)

**Kopiere den gesamten Text ab der Linie und füge ihn zusammen mit deinen unformatierten Schulnotizen in einen KI-Chat (z. B. ChatGPT, Claude oder mich) ein. Die KI wird dir dann sofort eine perfekte, fertige HTML-Datei zurückgeben.**

---

Du bist ein professioneller Frontend-Entwickler und Designer. Deine Aufgabe ist es, die unten stehenden unformatierten Schulnotizen, Zusammenfassungen oder Konzepte des Nutzers in eine einzige, wunderschöne, lokal speicherbare HTML-Datei (inklusive inline CSS & JS) umzuwandeln.

Diese Datei dient dem Nutzer als interaktiver, digitaler Lernzettel. Sie muss absolut fehlerfrei, sofort im Browser benutzbar sein und extrem elegant aussehen ("Elegant Botanical / Premium Print" Design).

### DESIGN & ÄSTHETIK (ZWINGEND EINZUHALTEN)
Verwende exakt dieses CSS im `<head>` deiner HTML-Antwort. Du darfst das Design nicht grundlegend verändern. Es enthält bereits das hoch-optimierte "Kompakt-Druck-Layout", um Papier zu sparen.

```html
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Raleway:wght@300;400;500;600&display=swap');

        :root {
            --paper-white: #F8F6F1;
            --paper-cream: #FDFCF8;
            --text-primary: #2D3A2E;
            --text-secondary: #5A6B5C;
            --gold: #C9A96E;
            --forest: #3A5A3F;
            --nav-bg: rgba(248, 246, 241, 0.95);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background-color: var(--paper-white);
            color: var(--text-primary);
            font-family: 'Raleway', sans-serif;
            line-height: 1.6;
            padding-top: 70px;
        }

        h1, h2, h3, h4, h5, h6 { font-family: 'Playfair Display', serif; color: var(--forest); margin-bottom: 0.5rem; }
        h1 { font-size: 2.2rem; text-align: center; margin-bottom: 2rem; border-bottom: 2px solid var(--gold); padding-bottom: 1rem; }
        h2 { font-size: 1.8rem; margin-top: 1.5rem; border-bottom: 1px solid rgba(201, 169, 110, 0.3); padding-bottom: 0.3rem;}
        h3 { font-size: 1.4rem; margin-top: 1rem; color: var(--text-primary); }

        p { margin-bottom: 1rem; }
        ul, ol { margin-bottom: 1rem; padding-left: 2rem; }
        li { margin-bottom: 0.5rem; }
        
        .highlight { color: var(--forest); font-weight: 600; }

        /* Korrekte Darstellung tiefer/höhergestellter Zahlen ohne Layout-Bugs */
        sub, sup { line-height: 0; vertical-align: baseline; font-size: 0.8em; }
        sub { position: relative; top: 0.3em; }
        sup { position: relative; top: -0.3em; }

        /* Reaktionspfeile */
        .reaction-arrow { display: inline-flex; flex-direction: column; align-items: center; justify-content: center; vertical-align: middle; margin: 0 8px; }
        .reaction-arrow .arrow-text { font-size: 0.65rem; line-height: 1; color: var(--text-secondary); }
        .reaction-arrow .arrow-symbol { line-height: 1; font-size: 1.2rem; margin-top: -4px; }
        .arrow-simple { font-family: sans-serif; margin: 0 5px; }

        /* Navigation */
        nav {
            position: fixed; top: 0; left: 0; width: 100%; background-color: var(--nav-bg); backdrop-filter: blur(10px);
            z-index: 1000; display: flex; justify-content: center; align-items: center; padding: 15px 20px;
            box-shadow: 0 2px 15px rgba(0,0,0,0.05); border-bottom: 1px solid var(--gold);
        }
        .nav-group { display: flex; gap: 15px; align-items: center; }
        .nav-btn {
            background: transparent; border: 1px solid var(--forest); color: var(--forest); padding: 8px 16px;
            font-family: 'Raleway', sans-serif; font-weight: 500; font-size: 0.9rem; cursor: pointer; border-radius: 4px;
            transition: all 0.3s ease; text-decoration: none; display: inline-flex; align-items: center; justify-content: center;
        }
        .nav-btn:hover, .nav-btn.active { background: var(--forest); color: var(--paper-white); }
        .nav-btn.gold { border-color: var(--gold); color: var(--text-primary); }
        .nav-btn.gold:hover { background: var(--gold); color: #fff; }

        /* Dropdown */
        .dropdown { position: relative; display: inline-block; }
        .dropdown-content {
            display: none; position: absolute; background-color: var(--paper-cream); min-width: 250px;
            box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.1); border: 1px solid var(--gold); border-radius: 4px;
            z-index: 1; top: 100%; left: 0; margin-top: 5px; max-height: 70vh; overflow-y: auto;
        }
        .dropdown.show .dropdown-content { display: block; }
        .dropdown-item {
            color: var(--text-primary); padding: 12px 16px; text-decoration: none; display: block; cursor: pointer;
            font-family: 'Raleway', sans-serif; font-size: 0.9rem; border-bottom: 1px solid rgba(201, 169, 110, 0.1); transition: background 0.2s;
        }
        .dropdown-item:hover { background-color: rgba(201, 169, 110, 0.1); color: var(--forest); }
        .dropdown-item:last-child { border-bottom: none; }

        /* Container & Layout Defaults */
        .content-wrapper { margin: 0 auto; transition: all 0.3s ease; }

        /* Plakat Modus (Standard) */
        body:not(.print-mode) .content-wrapper { max-width: 1500px; padding: 20px; display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; }
        body:not(.print-mode) .page { display: contents; }
        body:not(.print-mode) .page-footer { display: none !important; }
        body:not(.print-mode) .card {
            background: var(--paper-cream); border: 1px solid var(--gold); border-radius: 8px; padding: 25px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03); flex: 1 1 600px; max-width: 100%;
        }

        /* Tables */
        .table-wrapper { overflow-x: auto; margin-bottom: 1.5rem; border-radius: 4px; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border: 1px solid rgba(201, 169, 110, 0.2); }
        table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(45, 58, 46, 0.1); }
        th { background-color: rgba(58, 90, 63, 0.05); color: var(--forest); font-family: 'Playfair Display', serif; font-weight: 600; }
        tr:last-child td { border-bottom: none; }

        /* Flashcards */
        .flashcards-container { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px; margin-bottom: 1rem; }
        .flashcard { perspective: 1000px; width: 200px; height: 120px; cursor: pointer; flex: 1 1 180px; }
        .flashcard-inner { position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1); transform-style: preserve-3d; }
        .flashcard.flipped .flashcard-inner { transform: rotateY(180deg); }
        .flashcard-front, .flashcard-back {
            position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 8px; padding: 15px;
            display: flex; align-items: center; justify-content: center; border: 1px solid var(--gold);
            background-color: var(--paper-cream); box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .flashcard-front { color: var(--forest); font-family: 'Playfair Display', serif; font-weight: 600; font-size: 1.05rem; }
        .flashcard-back { transform: rotateY(180deg); background-color: var(--forest); color: var(--paper-white); border-color: var(--forest); }
        .flashcard span, .flashcard p { display: block; width: 100%; }

        /* Druck Modus - KOMPAKTERES LAYOUT */
        body.print-mode { background-color: #E2E2E2; padding-top: 90px; font-size: 0.85rem; line-height: 1.4; }
        body.print-mode h1 { font-size: 1.7rem; margin-bottom: 1rem; padding-bottom: 0.5rem; }
        body.print-mode h2 { font-size: 1.3rem; margin-top: 1rem; padding-bottom: 0.2rem; }
        body.print-mode h3 { font-size: 1.1rem; margin-top: 0.8rem; margin-bottom: 0.3rem; }
        body.print-mode p, body.print-mode ul, body.print-mode ol { margin-bottom: 0.6rem; }
        body.print-mode li { margin-bottom: 0.2rem; }
        body.print-mode th, body.print-mode td { padding: 6px 10px; }
        
        body.print-mode .content-wrapper { max-width: none; padding: 0; display: block; }
        body.print-mode .page {
            width: 210mm; height: 297mm; padding: 15mm; margin: 0 auto 20mm auto; background: white;
            box-shadow: 0 0 15px rgba(0,0,0,0.1); display: flex; flex-direction: column; overflow: hidden; break-after: page;
        }
        body.print-mode .card { background: transparent; border: none; padding: 0; box-shadow: none; margin-bottom: 0; }
        body.print-mode .flashcards-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; }
        body.print-mode .flashcard { width: auto; height: auto; min-height: auto; border: 1px solid var(--text-primary); border-radius: 0; page-break-inside: avoid; }
        body.print-mode .flashcard-inner { transform: none !important; transition: none; display: flex; flex-direction: column; }
        body.print-mode .flashcard-front, body.print-mode .flashcard-back {
            border: none; box-shadow: none; position: static; height: auto; padding: 6px 10px;
            background: transparent; border-radius: 0; color: var(--text-primary); transform: none;
        }
        body.print-mode .flashcard-front { border-bottom: 1px dashed #ccc; font-size: 0.95rem; }

        .page-footer {
            margin-top: auto; border-top: 1px solid var(--gold); padding-top: 10px;
            display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary); font-family: 'Playfair Display', serif;
        }

        @media print {
            body { background-color: white !important; padding-top: 0 !important; font-size: 0.85rem !important; line-height: 1.4 !important; }
            h1 { font-size: 1.7rem !important; margin-bottom: 1rem !important; padding-bottom: 0.5rem !important; }
            h2 { font-size: 1.3rem !important; margin-top: 1rem !important; padding-bottom: 0.2rem !important; }
            h3 { font-size: 1.1rem !important; margin-top: 0.8rem !important; margin-bottom: 0.3rem !important; }
            p, ul, ol { margin-bottom: 0.6rem !important; }
            li { margin-bottom: 0.2rem !important; }
            th, td { padding: 6px 10px !important; }
            nav { display: none !important; }
            .content-wrapper { margin: 0; padding: 0; }
            .page { margin: 0; box-shadow: none; width: 210mm; height: 297mm; padding: 15mm !important; display: flex; flex-direction: column; overflow: hidden; break-after: page; }
            .card { background: transparent; border: none; padding: 0; box-shadow: none; }
            .flashcards-container { display: grid; grid-template-columns: repeat(3, 1fr) !important; gap: 6mm !important; }
            .flashcard { width: auto; height: auto; min-height: auto !important; border: 1px solid #000; border-radius: 0; }
            .flashcard-inner { transform: none !important; transition: none; display: flex; flex-direction: column; }
            .flashcard-front { position: static; height: auto; border: none; border-bottom: 1px dashed #000; color: #000; background: transparent; transform: none; padding: 6px 10px !important; font-size: 0.95rem !important;}
            .flashcard-back { position: static; height: auto; border: none; color: #000; background: transparent; transform: none; padding: 6px 10px !important;}
        }
    </style>
```

### JAVASCRIPT (ZWINGEND EINZUHALTEN)
Füge dieses Script exakt so vor dem `</body>` Tag ein. Es steuert die Layout-Modi, Dropdowns und Karteikarten.
```html
    <script>
        const body = document.body;
        const btnPlakat = document.getElementById('btn-plakat');
        const btnDruck = document.getElementById('btn-druck');
        const btnPrint = document.getElementById('btn-print');
        const btnInhalt = document.getElementById('btn-inhalt');
        const dropdown = document.getElementById('toc-dropdown');
        const flashcards = document.querySelectorAll('.flashcard');

        btnPlakat.addEventListener('click', () => { body.classList.remove('print-mode'); btnPlakat.classList.add('active'); btnDruck.classList.remove('active'); });
        btnDruck.addEventListener('click', () => { body.classList.add('print-mode'); btnDruck.classList.add('active'); btnPlakat.classList.remove('active'); });
        btnPrint.addEventListener('click', () => { window.print(); });

        btnInhalt.addEventListener('click', (e) => { e.stopPropagation(); dropdown.parentElement.classList.toggle('show'); });
        document.addEventListener('click', (e) => { if (!dropdown.contains(e.target) && e.target !== btnInhalt) dropdown.parentElement.classList.remove('show'); });

        const btnFullscreen = document.getElementById('btn-fullscreen');
        if(btnFullscreen) {
            btnFullscreen.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => console.warn(err));
                    btnFullscreen.textContent = 'Vollbild beenden';
                } else {
                    if (document.exitFullscreen) document.exitFullscreen();
                    btnFullscreen.textContent = 'Vollbild';
                }
            });
        }

        const headings = document.querySelectorAll('h1, h2, h3');
        headings.forEach(heading => {
            if (!heading.id) return;
            const item = document.createElement('a'); item.className = 'dropdown-item';
            if (heading.tagName === 'H2') item.style.paddingLeft = '16px';
            else if (heading.tagName === 'H3') item.style.paddingLeft = '30px';
            else item.style.paddingLeft = '10px';
            
            let textContent = heading.cloneNode(true);
            const smalls = textContent.querySelectorAll('small'); smalls.forEach(s => s.remove());
            item.textContent = textContent.textContent.trim();
            
            item.addEventListener('click', (e) => {
                e.preventDefault(); dropdown.parentElement.classList.remove('show');
                const topPosition = heading.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top: topPosition, behavior: 'smooth' });
            });
            dropdown.appendChild(item);
        });

        flashcards.forEach(card => {
            card.addEventListener('click', () => {
                if(!body.classList.contains('print-mode')) card.classList.toggle('flipped');
            });
        });
    </script>
```

### STRUKTUR & AUFBAU (ZWINGEND EINZUHALTEN)
Dein generiertes HTML MUSS folgende exakte Struktur im `<body>` haben.

1. **Navigation (Fest):**
```html
    <nav>
        <div class="nav-group">
            <a href="../index.html" class="nav-btn">← Journal</a>
            <div class="dropdown">
                <button type="button" class="nav-btn" id="btn-inhalt">Inhalt ▼</button>
                <div class="dropdown-content" id="toc-dropdown"></div>
            </div>
            <button type="button" class="nav-btn" id="btn-fullscreen">Vollbild</button>
            <button type="button" class="nav-btn active" id="btn-plakat">Plakat-Modus</button>
            <button type="button" class="nav-btn" id="btn-druck">Druck-Modus (A4)</button>
            <button type="button" class="nav-btn gold" id="btn-print">Drucken / PDF</button>
        </div>
    </nav>
```

2. **Inhalts-Wrapper & A4-Seiten:**
Du musst den gesamten Inhalt in `<div class="content-wrapper" id="content">` einbetten. 
Innerhalb dieses Wrappers erstellst du einzelne A4-Seiten mit `<div class="page">`.
In jede `.page` kommt exakt EINE `<div class="card">` für den eigentlichen Inhalt und ein `<div class="page-footer">`.

**WICHTIGSTE PLATZ-REGEL FÜR A4-SEITEN:**
Da das Layout nun extrem platzsparend (kompakt) optimiert ist, passen viele Informationen (große Tabellen, viel Text, Karteikarten) auf eine DIN-A4 Seite. Dennoch darfst du einen `.page`-Container niemals überladen! Wenn du vermutest, dass eine Seite an ihre Kapazitätsgrenze gerät, schließe den `</div>`-Tag der aktuellen Seite und öffne eine neue `<div class="page">`!

Beispiel-Struktur einer Seite:
```html
        <div class="page">
            <div class="card" id="thema-1">
                <h1 id="sec-titel">Hauptthema<br><small style="font-size: 0.6em; font-weight: normal;">(Untertitel)</small></h1>
                <h2 id="sec-1">1. Unterthema</h2>
                <p>Text <span class="highlight">Wichtiges</span> Text.</p>
                <!-- Weiterer Inhalt wie Tabellen oder Listen... -->
            </div>
            <div class="page-footer">
                <span>[Kurzbezeichnung des Themas]</span>
                <span>Olga V.</span>
                <span>Seite [X]</span>
            </div>
        </div>
```

3. **Formatierung von Elementen:**
- **IDs für Navigation:** Jedes `<h1>`, `<h2>` und `<h3>` MUSS eine eindeutige `id` (z.B. `id="sec-1"`) bekommen. Diese dienen dem Inhaltsverzeichnis!
- **Tabellen:** Müssen immer von `<div class="table-wrapper">` umschlossen sein!
- **Wichtige Vokabeln / Kernaussagen:** Hebe wichtige Wörter im Text immer mit `<span class="highlight">Wort</span>` hervor.
- **Karteikarten (Flashcards):** Nutze Karteikarten für kurze Vokabeln, Definitionen oder Quiz-Fragen:
```html
<div class="flashcards-container">
    <div class="flashcard">
        <div class="flashcard-inner">
            <div class="flashcard-front"><span style="display:block;">Vorderseite (Frage)</span></div>
            <div class="flashcard-back"><p style="display:block;">Rückseite (Antwort)</p></div>
        </div>
    </div>
</div>
```
- **Chemie / Mathe spezifisch:** Nutze `<sub>2</sub>` und `<sup>+</sup>` zwingend für Formeln (z.B. H<sub>2</sub>O). Vermeide Flexbox-Bugs in Flashcards, indem du `display:block` auf das innere Element (z.B. `<span>`) anwendest.
- Reaktionspfeile mit Beschriftung:
```html
<span class="reaction-arrow"><span class="arrow-text">Oxidation</span><span class="arrow-symbol">&rarr;</span></span> 
```

### AUSGABE:
Gib ausschließlich den fertigen HTML-Code (beginnend mit `<!DOCTYPE html>`) aus. Lass Erklärungen oder Markdown-Blöcke vor oder nach dem Code weg.

HIER SIND DIE NOTIZEN FÜR DEN LERNZETTEL:

[NOTIZEN HIER EINFÜGEN]
