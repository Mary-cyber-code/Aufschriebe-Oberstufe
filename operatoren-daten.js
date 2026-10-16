/* ============================================================
 * operatoren-daten.js – Fachspezifische Operatoren & Anforderungsbereiche
 *                        für das Abitur in Baden-Württemberg
 * ============================================================
 *
 *  Grundlage: Bildungsplan 2016 Gymnasium BW (Anhang „Operatoren“ der
 *  Fachpläne auf bildungsplaene-bw.de) bzw. die KMK-/IQB-Listen, die BW
 *  übernimmt. Recherchiert im Oktober 2026 per Websuche – die Original-PDFs
 *  konnten nicht direkt abgerufen werden. Bei Grenzfällen ist die
 *  AFB-Zuordnung laut den offiziellen Listen kontextabhängig; Angaben wie
 *  „(I-II)“ kennzeichnen Operatoren, die mehreren AFB zugeordnet sind.
 *
 *  ANLEITUNG: Wenn eure Lehrkraft eine eigene Liste ausgibt, einfach
 *  hier die Einträge anpassen – Quiz-Generator & Lernplaner übernehmen
 *  die Änderungen automatisch.
 *
 *  Schlüssel = Fach-Schlüssel aus faecher-daten.js
 * ============================================================ */

const OPERATOREN = {

  /* ═══════ MATHEMATIK ═══════ */
  mathe: {
    quelle: "Bildungsplan 2016 Gymnasium BW Mathematik – Operatoren (entspricht IQB/KMK-Operatorenliste Mathematik, Bildungsstandards AHR) – bildungsplaene-bw.de",
    afb: {
      I:   "Reproduzieren: Bekannte Sachverhalte, Begriffe und Routineverfahren in einem geübten Zusammenhang wiedergeben und direkt anwenden.",
      II:  "Zusammenhänge herstellen: Bekannte Kenntnisse und Verfahren verknüpfen und auf vergleichbare, neue Situationen übertragen.",
      III: "Verallgemeinern und Reflektieren: Komplexe, unbekannte Problemstellungen selbstständig bearbeiten, Lösungswege entwickeln, verallgemeinern, begründen und beurteilen."
    },
    operatoren: {
      I: [
        { op: "angeben, nennen", def: "Objekt, Sachverhalt oder Ergebnis ohne Begründung und ohne Darstellung des Lösungswegs formulieren." },
        { op: "berechnen (I-II)", def: "Ergebnis von einem Ansatz ausgehend durch Rechenoperationen gewinnen; Rechenweg dokumentieren." },
        { op: "erstellen", def: "Sachverhalt in übersichtlicher, fachlich üblicher Form darstellen, z. B. Tabelle, Baumdiagramm." },
        { op: "skizzieren (I-II)", def: "Wesentliche Eigenschaften eines Objekts (z. B. Graph) grafisch darstellen, auch freihand." },
        { op: "zeichnen, grafisch darstellen (I-II)", def: "Hinreichend exakte grafische Darstellung eines Objekts anfertigen." },
        { op: "entscheiden (I-II)", def: "Bei Alternativen sich begründet oder unbegründet eindeutig festlegen." },
        { op: "beschreiben (I-II)", def: "Sachverhalt oder Verfahren in Textform unter Verwendung der Fachsprache wiedergeben." }
      ],
      II: [
        { op: "bestimmen, ermitteln (II-III)", def: "Lösungsweg darstellen und Ergebnis formulieren; die Wahl der Mittel ist freigestellt." },
        { op: "untersuchen (II-III)", def: "Sachverhalt nach bestimmten, fachlich üblichen oder vorgegebenen Kriterien bearbeiten." },
        { op: "vergleichen (II-III)", def: "Nach vorgegebenen oder selbst gewählten Gesichtspunkten Gemeinsamkeiten und Unterschiede ermitteln und darstellen." },
        { op: "interpretieren, deuten (II-III)", def: "Ergebnisse auf eine Ausgangsfragestellung bzw. den Sachkontext zurückbeziehen." },
        { op: "erläutern (II-III)", def: "Sachverhalt mit zusätzlichen Informationen, Beispielen oder Begründungen verständlich darlegen." },
        { op: "zeigen, nachweisen (II-III)", def: "Aussage unter Nutzung gültiger Schlussregeln, Berechnungen oder Herleitungen bestätigen." },
        { op: "herleiten (II-III)", def: "Entstehung oder Ableitung eines Sachverhalts aus anderen Sachverhalten darstellen." }
      ],
      III: [
        { op: "begründen (II-III)", def: "Sachverhalt auf Gesetzmäßigkeiten bzw. kausale Zusammenhänge zurückführen; Regeln und Berechnungen sind nutzbar." },
        { op: "beurteilen", def: "Zu einem Sachverhalt ein selbstständiges, fachlich begründetes Urteil formulieren." },
        { op: "beweisen, widerlegen", def: "Aussage mit mathematischen Mitteln lückenlos bestätigen bzw. (z. B. per Gegenbeispiel) als falsch nachweisen." }
      ]
    }
  },

  /* ═══════ CHEMIE ═══════ */
  chemie: {
    quelle: "Bildungsplan 2016 Gymnasium BW Chemie – Operatoren (gemeinsame Operatorenliste der Naturwissenschaften BW); ergänzend KMK-Bildungsstandards Chemie AHR (2020)",
    afb: {
      I:   "Reproduktion: Fachwissen, Fachbegriffe, Formeln und geübte Arbeitstechniken (z. B. Experimente) im bekannten Zusammenhang wiedergeben und anwenden.",
      II:  "Reorganisation und Transfer: Bekannte chemische Sachverhalte selbstständig erklären, ordnen und auf vergleichbare neue Situationen übertragen.",
      III: "Reflexion und Problemlösung: Komplexe, neue Sachverhalte selbstständig bearbeiten, Hypothesen und Lösungen entwickeln sowie begründet beurteilen und bewerten."
    },
    operatoren: {
      I: [
        { op: "angeben, nennen", def: "Elemente, Sachverhalte, Begriffe, Daten ohne Erläuterung aufzählen." },
        { op: "benennen", def: "Elemente, Sachverhalte, Begriffe oder Daten (er)kennen und angeben." },
        { op: "aufbauen (Experiment)", def: "Objekte und Geräte zielgerichtet anordnen und kombinieren." },
        { op: "durchführen (Experiment)", def: "An einer Experimentieranordnung zielgerichtete Messungen und Änderungen vornehmen." },
        { op: "protokollieren, dokumentieren", def: "Ablauf, Beobachtungen und Ergebnisse eines Experiments fachtypisch wiedergeben." },
        { op: "skizzieren", def: "Sachverhalte, Strukturen oder Ergebnisse auf das Wesentliche reduziert grafisch darstellen." },
        { op: "zeichnen", def: "Exakte grafische Darstellung beobachtbarer oder gegebener Strukturen anfertigen." },
        { op: "beschreiben (I-II)", def: "Strukturen, Sachverhalte oder Zusammenhänge strukturiert und fachsprachlich richtig wiedergeben." },
        { op: "darstellen (I-II)", def: "Sachverhalte, Zusammenhänge, Methoden strukturiert und fachsprachlich wiedergeben." },
        { op: "berechnen (I-II)", def: "Numerische Ergebnisse von einem Ansatz ausgehend gewinnen; Rechenweg darstellen." }
      ],
      II: [
        { op: "ableiten, herleiten", def: "Auf Grundlage von Erkenntnissen oder Daten sachgerechte Schlüsse ziehen." },
        { op: "abschätzen", def: "Durch begründete Überlegungen Größenwerte angeben." },
        { op: "analysieren, untersuchen", def: "Wichtige Bestandteile, Eigenschaften oder Zusammenhänge auf eine Fragestellung hin herausarbeiten." },
        { op: "anwenden", def: "Bekannten Sachverhalt oder bekannte Methode auf etwas Neues beziehen." },
        { op: "aufstellen, formulieren (Reaktionsgleichung, Mechanismus)", def: "Chemische Formeln, Gleichungen oder Reaktionsmechanismen fachgerecht entwickeln." },
        { op: "auswerten", def: "Daten, Einzelergebnisse oder Beobachtungen in Zusammenhang stellen und eine Schlussfolgerung ziehen." },
        { op: "begründen", def: "Sachverhalte auf Regeln, Gesetzmäßigkeiten bzw. kausale Beziehungen zurückführen." },
        { op: "bestimmen, ermitteln", def: "Einen Lösungsweg darstellen und das Ergebnis formulieren." },
        { op: "deuten", def: "Sachverhalte in einen Erklärungszusammenhang bringen." },
        { op: "erklären", def: "Sachverhalt auf Regeln, Gesetzmäßigkeiten, Modelle zurückführen und verständlich machen." },
        { op: "erläutern", def: "Sachverhalt veranschaulichen und durch zusätzliche Informationen und Beispiele verständlich machen." },
        { op: "nachweisen", def: "Vorhandensein eines Stoffes oder Gültigkeit einer Aussage experimentell oder argumentativ bestätigen." },
        { op: "ordnen, zuordnen", def: "Vorliegende Objekte oder Sachverhalte kategorisieren und hierarchisieren." },
        { op: "vergleichen", def: "Gemeinsamkeiten, Ähnlichkeiten und Unterschiede ermitteln." },
        { op: "interpretieren (II-III)", def: "Kausale Beziehungen im Hinblick auf Erklärungsmöglichkeiten untersuchen und abwägend herausstellen." }
      ],
      III: [
        { op: "beurteilen", def: "Zu einem Sachverhalt ein selbstständiges Sachurteil mit Fachwissen und Fachmethoden formulieren und begründen." },
        { op: "bewerten", def: "Sachverhalt an Werten/Normen messen; begründetes Werturteil abgeben." },
        { op: "diskutieren, erörtern", def: "Argumente zu einer Aussage oder These einander gegenüberstellen und abwägen." },
        { op: "entwickeln", def: "Hypothese, Experiment, Modell oder Lösungsweg schrittweise weiterführen bzw. entwerfen." },
        { op: "Hypothese aufstellen", def: "Begründete Vermutung auf Grundlage von Beobachtungen, Untersuchungen oder Aussagen formulieren." },
        { op: "planen (Experiment)", def: "Zu einer vorgegebenen Fragestellung eine Experimentieranordnung finden und die Durchführung beschreiben." },
        { op: "prüfen, überprüfen", def: "Sachverhalte oder Aussagen an Fakten oder innerer Logik messen und Widersprüche aufdecken." },
        { op: "Stellung nehmen", def: "Zu einem Sachverhalt nach kritischer Prüfung und Abwägung ein begründetes Urteil abgeben." }
      ]
    }
  },

  /* ═══════ GEMEINSCHAFTSKUNDE ═══════ */
  gk: {
    quelle: "Bildungsplan 2016 Gymnasium BW Gemeinschaftskunde – Anhang „Operatoren“ (gemeinsamer Operatorenkatalog von Geographie, Geschichte, Gemeinschaftskunde, Wirtschaft)",
    afb: {
      I:   "Reproduktion: Wiedergeben und Beschreiben von Sachverhalten und Materialien in einem bekannten bzw. vorgegebenen Zusammenhang.",
      II:  "Reorganisation und Transfer: Selbstständiges Erklären, Bearbeiten und Ordnen bekannter Sachverhalte sowie Anwenden gelernter Inhalte und Methoden auf andere Sachverhalte.",
      III: "Reflexion und Problemlösung: Reflexiver Umgang mit neuen Problemstellungen, um zu begründeten Sach- und Werturteilen, Lösungen und Handlungsoptionen zu gelangen."
    },
    operatoren: {
      I: [
        { op: "nennen / benennen", def: "Informationen, Sachverhalte oder Begriffe ohne Erläuterung präzise aufführen." },
        { op: "beschreiben", def: "Sachverhalte bzw. Materialien strukturiert, zusammenhängend und fachsprachlich angemessen wiedergeben." },
        { op: "darstellen (I-II)", def: "Sachverhalte, Zusammenhänge oder Positionen strukturiert und zusammenhängend verdeutlichen." },
        { op: "wiedergeben", def: "Inhalte oder Aussagen mit eigenen Worten unkommentiert und sprachlich distanziert darlegen." },
        { op: "zusammenfassen", def: "Wesentliche Aussagen komprimiert und strukturiert in eigenen Worten wiedergeben." },
        { op: "skizzieren (I-II)", def: "Sachverhalte in Grundzügen auf das Wesentliche reduziert darstellen." }
      ],
      II: [
        { op: "analysieren", def: "Materialien oder Sachverhalte kriterienorientiert bzw. aspektgeleitet erschließen und strukturiert darstellen." },
        { op: "anwenden", def: "Bekannte Modelle, Theorien oder Methoden auf neue Sachverhalte beziehen." },
        { op: "begründen", def: "Aussagen durch Argumente stützen, die durch Beispiele oder Belege untermauert werden." },
        { op: "charakterisieren", def: "Sachverhalte in ihren Eigenarten beschreiben und typische Merkmale zusammenführen." },
        { op: "einordnen", def: "Sachverhalt oder Position begründet in einen größeren Zusammenhang stellen." },
        { op: "erklären", def: "Sachverhalte so darstellen, dass Ursachen, Bedingungen und Zusammenhänge verständlich werden." },
        { op: "erläutern", def: "Sachverhalte mit zusätzlichen Informationen und Beispielen nachvollziehbar veranschaulichen." },
        { op: "ermitteln", def: "Aus Materialien gezielt Informationen oder Ergebnisse gewinnen und darstellen." },
        { op: "herausarbeiten", def: "Aus Materialien bestimmte, nicht explizit genannte Sachverhalte oder Positionen erkennen und darstellen." },
        { op: "in Beziehung setzen", def: "Zusammenhänge unter vorgegebenen oder selbst gewählten Gesichtspunkten begründet herstellen." },
        { op: "vergleichen", def: "Gemeinsamkeiten, Ähnlichkeiten und Unterschiede kriterienorientiert herausarbeiten und darstellen." }
      ],
      III: [
        { op: "beurteilen", def: "Aussagen oder Maßnahmen an Kriterien prüfen und ein begründetes Sachurteil formulieren." },
        { op: "bewerten", def: "Wie beurteilen, zusätzlich ein begründetes Werturteil mit offengelegten Wertmaßstäben formulieren." },
        { op: "entwickeln", def: "Zu einem Problem eigenständig Lösungen, Konzepte oder Handlungsoptionen begründet entwerfen." },
        { op: "erörtern", def: "Problemstellung durch Pro- und Contra-Argumentation abwägen und ein begründetes Urteil fällen." },
        { op: "gestalten", def: "Problembezogen ein eigenes Produkt (z. B. Rede, Leserbrief, Szenario) kreativ entwerfen." },
        { op: "Stellung nehmen", def: "Unter Verwendung von Fachwissen einen begründeten eigenen Standpunkt (Sach-/Werturteil) formulieren." },
        { op: "überprüfen", def: "Aussagen, Hypothesen oder Argumentationen auf Stichhaltigkeit und Angemessenheit untersuchen." }
      ]
    }
  },

  /* ═══════ DEUTSCH ═══════ */
  deutsch: {
    quelle: "Bildungsplan 2016 Gymnasium BW Deutsch – „Operatoren“ (angelehnt an die IQB-/KMK-Operatorenliste Deutsch, Bildungsstandards AHR)",
    afb: {
      I:   "Wiedergabe von Sachverhalten und Kenntnissen im gelernten Zusammenhang sowie Anwenden und Beschreiben geübter Arbeitstechniken und Verfahren.",
      II:  "Selbstständiges Auswählen, Anordnen, Verarbeiten, Erklären und Darstellen bekannter Sachverhalte sowie Übertragen des Gelernten auf vergleichbare neue Zusammenhänge.",
      III: "Verarbeiten komplexer Sachverhalte mit dem Ziel, zu selbstständigen Lösungen, Gestaltungen, Deutungen, Folgerungen, Begründungen und Wertungen zu gelangen."
    },
    operatoren: {
      I: [
        { op: "nennen", def: "Informationen/Sachverhalte ohne Erläuterung zielgerichtet anführen." },
        { op: "wiedergeben", def: "Inhalte oder Aussagen mit eigenen Worten sachlich darlegen." },
        { op: "zusammenfassen", def: "Wesentliche Aussagen komprimiert und strukturiert wiedergeben." },
        { op: "beschreiben (I-II)", def: "Sachverhalte, Situationen, Vorgänge, Merkmale von Figuren sachlich darlegen." },
        { op: "darstellen (I-II)", def: "Einen erkannten Zusammenhang oder Sachverhalt strukturiert wiedergeben." },
        { op: "skizzieren (I-II)", def: "Einen Sachverhalt auf das Wesentliche reduziert übersichtlich darstellen." }
      ],
      II: [
        { op: "analysieren", def: "Text als Ganzes oder aspektorientiert unter Wahrung des Zusammenhangs von Inhalt, Form und Sprache erschließen und darlegen." },
        { op: "untersuchen", def: "Unter bestimmten Fragestellungen Sachverhalte/Texte kriterienorientiert erschließen." },
        { op: "charakterisieren", def: "Die jeweilige Eigenart von Figuren oder Sachverhalten herausarbeiten." },
        { op: "einordnen", def: "Aussage/Text mithilfe von Kontextwissen begründet in einen Zusammenhang stellen." },
        { op: "erklären", def: "Sachverhalte so darlegen, dass Ursachen, Bedingungen und Funktionszusammenhänge verständlich werden." },
        { op: "erläutern", def: "Sachverhalte durch zusätzliche Informationen/Beispiele nachvollziehbar veranschaulichen." },
        { op: "erschließen", def: "Nicht explizit Formuliertes durch Schlussfolgerungen herleiten." },
        { op: "herausarbeiten", def: "Aus Aussagen eines Textes einen Sachverhalt/eine Position erkennen und darstellen." },
        { op: "in Beziehung setzen (II-III)", def: "Zusammenhänge unter vorgegebenen oder selbst gewählten Gesichtspunkten begründet herstellen." },
        { op: "vergleichen", def: "Nach Gesichtspunkten Gemeinsamkeiten, Ähnlichkeiten und Unterschiede ermitteln und darstellen." },
        { op: "begründen (II-III)", def: "Aussagen/Urteile durch nachvollziehbare Argumente stützen." }
      ],
      III: [
        { op: "interpretieren", def: "Auf Grundlage einer Analyse ein komplexes Textverständnis erarbeiten und darlegen." },
        { op: "beurteilen", def: "Selbstständiges Urteil unter Verwendung von Fachwissen und Fachmethoden formulieren und begründen." },
        { op: "bewerten", def: "Wie beurteilen, zusätzlich eigene Wertmaßstäbe offenlegen und begründen." },
        { op: "Stellung nehmen", def: "Zu einem Sachverhalt begründet eine eigene Position beziehen." },
        { op: "erörtern", def: "These/Problem durch Pro- und Contra-Argumente abwägen und begründet urteilen." },
        { op: "sich auseinandersetzen", def: "Aussage oder Problemstellung argumentativ und urteilend abwägen." },
        { op: "(über)prüfen", def: "Aussage/These an Text oder Wissen messen und das Ergebnis begründet beurteilen." },
        { op: "gestalten", def: "Eigenen Text unter Beachtung der Vorgaben (Textsorte, Adressat, Situation) verfassen." },
        { op: "entwerfen", def: "Ein Konzept/einen Text in wesentlichen Zügen planend erstellen." },
        { op: "verfassen", def: "Einen adressaten- und situationsgerechten Text einer bestimmten Textsorte schreiben." }
      ]
    },
    aufgabenarten: [
      "Interpretation eines literarischen Textes (Epik, Drama oder Lyrik; ggf. Gedichtvergleich)",
      "Werkvergleich: Interpretation eines Textes im Vergleich mit den Pflichtlektüren",
      "Erörterung literarischer Texte (bezogen auf die Pflichtlektüren)",
      "Analyse eines pragmatischen Textes (Sachtextanalyse, ggf. mit weiterführendem Erörterungsauftrag)",
      "Textgebundene Erörterung eines pragmatischen Textes",
      "Materialgestütztes Verfassen eines argumentierenden bzw. informierenden Textes (z. B. Kommentar, Essay)"
    ]
  },

  /* ═══════ ENGLISCH ═══════ */
  englisch: {
    quelle: "Bildungsplan 2016 Gymnasium BW Englisch – „Operatoren“ (BW übernimmt die Operatoren der IQB-/KMK-Bildungsstandards fortgeführte Fremdsprache)",
    afb: {
      I:   "Reproduction: Informationen und Sachverhalte aus dem Text/Material verstehen und strukturiert wiedergeben (comprehension).",
      II:  "Reorganisation & Transfer: Text und Sachverhalte selbstständig untersuchen, ordnen, erklären und auf neue Zusammenhänge anwenden (analysis).",
      III: "Reflexion & Problemlösung: Sich wertend und begründet mit Texten/Themen auseinandersetzen oder eigene Texte gestalten (evaluation, creative/argumentative writing)."
    },
    operatoren: {
      I: [
        { op: "describe", def: "Give a detailed account of something (e.g. picture, situation, character)." },
        { op: "outline", def: "Give the main features, structure or general principles, omitting minor details." },
        { op: "point out (I-II)", def: "Identify and briefly explain specific aspects of the text." },
        { op: "state", def: "Specify clearly and briefly." },
        { op: "summarize / sum up", def: "Give a concise account of the main points (no details, no own comment)." }
      ],
      II: [
        { op: "analyse", def: "Describe and explain in detail certain aspects and/or features of the text (incl. their effect)." },
        { op: "examine", def: "Describe and explain in detail certain aspects/features, investigating relationships." },
        { op: "characterize", def: "Describe and analyse the character of a person/figure (traits, behaviour, development)." },
        { op: "compare", def: "Point out similarities and differences according to given criteria." },
        { op: "contrast", def: "Emphasize the differences between two or more things." },
        { op: "explain", def: "Describe and define in detail; make reasons and relationships clear." },
        { op: "illustrate", def: "Use examples to explain or make clear." },
        { op: "interpret (II-III)", def: "Make clear the meaning of something and support it with textual evidence." }
      ],
      III: [
        { op: "assess", def: "Consider in a balanced way the points for and against and come to a judgement." },
        { op: "comment (on)", def: "State clearly your opinion on the topic and support it with evidence/arguments." },
        { op: "discuss", def: "Investigate by argument, giving reasons for and against, and come to a conclusion." },
        { op: "evaluate", def: "Form an opinion after carefully considering advantages and disadvantages/criteria." },
        { op: "justify", def: "Show adequate grounds for decisions or conclusions." },
        { op: "write / create / re-create (e.g. diary entry, speech, letter)", def: "Produce a text with specific features (text type, addressee, perspective) – creative writing." },
        { op: "mediate (Sprachmittlung)", def: "Convey relevant content of a German source in English, appropriate to addressee and situation – no literal translation." }
      ]
    },
    aufgabenarten: [
      "Hörverstehen / Listening comprehension",
      "Textaufgabe zu einem literarischen oder nicht-literarischen Text: Comprehension (AFB I) – Analysis (AFB II) – Composition/Evaluation (AFB III: comment, discuss, assess oder creative writing)",
      "Sprachmittlung / Mediation Deutsch → Englisch (in Kursstufen-Klausuren; Stellenwert im schriftlichen Abitur mit der Lehrkraft klären)",
      "Kommunikationsprüfung (mündlich: monologischer und dialogischer Teil)"
    ]
  },

  /* ═══════ BIOLOGIE ═══════ */
  biologie: {
    quelle: "Bildungsplan 2016 Gymnasium BW Biologie – Operatoren (gemeinsame Operatorenliste der Naturwissenschaften BW); ergänzend KMK-Bildungsstandards Biologie AHR (2020)",
    afb: {
      I:   "Reproduktion (Wiedergeben und Beschreiben): Biologisches Fachwissen und geübte Methoden im bekannten Kontext wiedergeben und beschreiben.",
      II:  "Reorganisation und Transfer (Anwenden und Strukturieren): Fachwissen und Methoden auf neue, vergleichbare Materialien anwenden, erklären und strukturieren.",
      III: "Reflexion und Problemlösung (Transferieren und Verknüpfen): Unbekannte, komplexe Sachverhalte selbstständig erschließen, Hypothesen entwickeln, beurteilen und bewerten."
    },
    operatoren: {
      I: [
        { op: "angeben, nennen", def: "Elemente, Sachverhalte, Begriffe, Daten ohne Erläuterung aufzählen." },
        { op: "benennen", def: "Elemente, Strukturen, Sachverhalte (er)kennen und mit Fachbegriff bezeichnen." },
        { op: "beschreiben (I-II)", def: "Strukturen, Sachverhalte, Abläufe strukturiert und fachsprachlich richtig wiedergeben." },
        { op: "darstellen (I-II)", def: "Sachverhalte, Zusammenhänge, Methoden strukturiert wiedergeben, auch grafisch." },
        { op: "protokollieren, dokumentieren", def: "Ablauf, Beobachtungen und Ergebnisse einer Untersuchung fachtypisch festhalten." },
        { op: "durchführen (Experiment)", def: "Untersuchung oder Experiment nach Anleitung zielgerichtet ausführen." },
        { op: "skizzieren", def: "Sachverhalte, Strukturen auf das Wesentliche reduziert grafisch darstellen." },
        { op: "zeichnen", def: "Exakte grafische Darstellung beobachtbarer oder gegebener Strukturen anfertigen." }
      ],
      II: [
        { op: "ableiten, herleiten", def: "Auf Grundlage von Erkenntnissen oder Daten sachgerechte Schlüsse ziehen." },
        { op: "analysieren, untersuchen", def: "Wichtige Bestandteile, Eigenschaften, Zusammenhänge auf eine Fragestellung hin herausarbeiten." },
        { op: "anwenden", def: "Bekannten Sachverhalt oder Methode (z. B. Modell) auf neuen Sachverhalt beziehen." },
        { op: "auswerten", def: "Daten, Einzelergebnisse, Beobachtungen in Zusammenhang stellen und Schlussfolgerung ziehen." },
        { op: "begründen", def: "Sachverhalte auf Regeln, Gesetzmäßigkeiten bzw. kausale Beziehungen zurückführen." },
        { op: "berechnen, bestimmen, ermitteln", def: "Ergebnis über einen nachvollziehbar dargestellten Lösungsweg gewinnen." },
        { op: "deuten", def: "Sachverhalte (z. B. Versuchsergebnisse) in einen Erklärungszusammenhang bringen." },
        { op: "erklären", def: "Sachverhalt auf Regeln, Gesetzmäßigkeiten, kausale Zusammenhänge zurückführen und verständlich machen." },
        { op: "erläutern", def: "Sachverhalt veranschaulichen und durch zusätzliche Informationen und Beispiele verständlich machen." },
        { op: "ordnen, zuordnen", def: "Objekte oder Sachverhalte nach Kriterien kategorisieren und hierarchisieren." },
        { op: "vergleichen", def: "Gemeinsamkeiten, Ähnlichkeiten und Unterschiede kriterienbezogen ermitteln." },
        { op: "interpretieren (II-III)", def: "Kausale Beziehungen im Hinblick auf Erklärungsmöglichkeiten untersuchen und abwägend herausstellen." }
      ],
      III: [
        { op: "beurteilen", def: "Selbstständiges Sachurteil mit Fachwissen und Fachmethoden formulieren und begründen." },
        { op: "bewerten", def: "Sachverhalt an Werten/Normen (z. B. ethisch, ökologisch) messen; begründetes Werturteil abgeben." },
        { op: "diskutieren, erörtern", def: "Pro- und Contra-Argumente zu einer These gegenüberstellen, abwägen und ein Fazit ziehen." },
        { op: "entwickeln", def: "Hypothese, Modell, Experiment oder Lösungsweg schrittweise entwerfen bzw. weiterführen." },
        { op: "Hypothese aufstellen", def: "Begründete, überprüfbare Vermutung zu einem Sachverhalt formulieren." },
        { op: "planen (Experiment)", def: "Zu einer Fragestellung ein Experiment mit Variablen und Kontrollansatz entwerfen." },
        { op: "prüfen, überprüfen", def: "Aussagen an Fakten oder innerer Logik messen und Widersprüche aufdecken." },
        { op: "Stellung nehmen", def: "Nach kritischer Prüfung und Abwägung ein begründetes eigenes Urteil abgeben." }
      ]
    }
  },

  /* ═══════ BILDENDE KUNST ═══════ */
  kunst: {
    quelle: "Bildungsplan 2016 Gymnasium BW Bildende Kunst – „Operatoren“; ergänzend KMK-EPA Bildende Kunst (2005)",
    afb: {
      I:   "Wiedergabe von Sachverhalten und Kenntnissen sowie Beschreiben und Anwenden geübter bildnerischer Verfahren, Techniken und Fachbegriffe im gelernten Zusammenhang.",
      II:  "Selbstständiges Untersuchen, Ordnen und Erklären bildnerischer Sachverhalte und Übertragen gelernter Analyse- und Gestaltungsverfahren auf neue Werke/Aufgaben.",
      III: "Verarbeiten komplexer Sachverhalte mit dem Ziel eigenständiger Deutungen, Wertungen und bildnerischer Gestaltungen bzw. Problemlösungen."
    },
    operatoren: {
      I: [
        { op: "nennen / benennen", def: "Elemente, Sachverhalte, Begriffe ohne Erläuterung anführen." },
        { op: "beschreiben", def: "Sichtbaren Bestand eines Werks/Verfahrens strukturiert, sachlich, ohne Wertung in eigenen Worten wiedergeben." },
        { op: "skizzieren", def: "Sachverhalt sprachlich oder zeichnerisch auf das Wesentliche reduziert darstellen (z. B. Kompositionsskizze)." },
        { op: "darstellen (I-II)", def: "Sachverhalte, Zusammenhänge oder Gestaltungsabläufe strukturiert aufzeigen." },
        { op: "zusammenfassen", def: "Wesentliche Aussagen oder Ergebnisse komprimiert wiedergeben." }
      ],
      II: [
        { op: "analysieren", def: "Werk/Material unter gegebener Fragestellung systematisch untersuchen (Komposition, Farbe, Form, Raum) und auswerten." },
        { op: "untersuchen", def: "Bestimmte Merkmale oder Zusammenhänge im Werk gezielt erschließen." },
        { op: "erläutern / erklären", def: "Sachverhalte (z. B. ikonografisch, stilgeschichtlich) durch Zusatzinformationen verständlich machen." },
        { op: "vergleichen", def: "Gemeinsamkeiten und Unterschiede von Werken nach Kriterien herausarbeiten." },
        { op: "einordnen / zuordnen", def: "Werk begründet in kunstgeschichtlichen, stilistischen oder biografischen Kontext stellen." },
        { op: "charakterisieren", def: "Typische Merkmale eines Werks, Stils oder einer künstlerischen Position kennzeichnen." },
        { op: "anwenden / umsetzen", def: "Bekannte bildnerische Verfahren auf neue Aufgaben übertragen." }
      ],
      III: [
        { op: "deuten / interpretieren", def: "Analyseergebnisse auswerten und zu begründeter Gesamtdeutung (Form-Inhalt-Bezug, Kontext) gelangen." },
        { op: "beurteilen", def: "Zu Werk/Position nach fachlichen Kriterien ein begründetes eigenes Urteil formulieren." },
        { op: "bewerten", def: "Wie beurteilen, zusätzlich eigene Wertmaßstäbe offenlegen." },
        { op: "Stellung nehmen / sich auseinandersetzen", def: "Sich kritisch-argumentativ mit These, Kunstkonzept oder Position befassen." },
        { op: "erörtern", def: "Fragestellung durch Abwägen von Argumenten untersuchen und begründet urteilen." },
        { op: "entwerfen / planen", def: "Bilder, Bildkonzepte oder Prozesse zu einer Aufgabe zielgerichtet konzipieren." },
        { op: "gestalten / entwickeln", def: "Eigenständige bildnerische Lösung mit gezielt gewählten Gestaltungsmitteln umsetzen." },
        { op: "reflektieren", def: "Eigenen Gestaltungsprozess/Ergebnis kriterienorientiert erläutern und beurteilen." }
      ]
    }
  },

  /* ═══════ SPORT ═══════ */
  sport: {
    quelle: "Keine eigene BW-Operatorenliste Sport verifizierbar → KMK-EPA Sport; BW-Bezug: Bildungsplan 2016 Sport Gymnasium & Abiturhinweise des Kultusministeriums BW",
    afb: {
      I:   "Reproduktion: Sportbezogene Sachverhalte, Fachbegriffe und Bewegungsabläufe aus dem Unterricht wiedergeben und beschreiben.",
      II:  "Reorganisation und Transfer: Bekannte Inhalte selbstständig erklären, ordnen, analysieren und auf vergleichbare neue Situationen übertragen.",
      III: "Problemlösendes Denken / Reflexion: Komplexe sportliche Problemstellungen selbstständig bearbeiten und zu Lösungen, Wertungen und Folgerungen gelangen."
    },
    operatoren: {
      I: [
        { op: "nennen, angeben", def: "Sachverhalte, Begriffe, Daten ohne Erläuterung aufzählen." },
        { op: "benennen", def: "Sachverhalte, Merkmale oder Bewegungsphasen erkennen und fachsprachlich bezeichnen." },
        { op: "beschreiben (I-II)", def: "Bewegungen, Strukturen, Sachverhalte zusammenhängend und fachsprachlich richtig wiedergeben." },
        { op: "darstellen (I-II)", def: "Sachverhalt, Modell oder Zusammenhang strukturiert, ggf. grafisch, wiedergeben." },
        { op: "skizzieren, zeichnen", def: "Sachverhalte (z. B. Spielsituation, Kurve) auf das Wesentliche reduziert grafisch darstellen." },
        { op: "zusammenfassen", def: "Wesentliche Aussagen eines Textes oder Materials komprimiert und strukturiert wiedergeben." }
      ],
      II: [
        { op: "analysieren, untersuchen (II-III)", def: "Material oder Bewegung kriterienorientiert in Bestandteile zerlegen, Ergebnisse strukturiert darstellen." },
        { op: "anwenden, übertragen", def: "Bekannte Theorie, Methode oder Prinzip auf eine neue Situation beziehen." },
        { op: "auswerten (II-III)", def: "Daten, Testwerte, Grafiken in Zusammenhang bringen und zu einer Gesamtaussage führen." },
        { op: "begründen (II-III)", def: "Aussage oder Maßnahme durch Argumente (Theorien, Gesetzmäßigkeiten) stützen." },
        { op: "berechnen", def: "Ergebnis (z. B. Trainingsherzfrequenz, Geschwindigkeit) über einen dargestellten Rechenweg ermitteln." },
        { op: "einordnen, zuordnen", def: "Sachverhalt mit erläuternden Hinweisen in einen Zusammenhang bzw. ein Modell stellen." },
        { op: "erklären", def: "Sachverhalt auf Ursachen, Theorien, Gesetzmäßigkeiten (z. B. biomechanisch) zurückführen." },
        { op: "erläutern", def: "Sachverhalt durch zusätzliche Informationen und Beispiele verständlich machen." },
        { op: "vergleichen", def: "Gemeinsamkeiten und Unterschiede nach Kriterien herausarbeiten und darstellen." }
      ],
      III: [
        { op: "beurteilen", def: "Sachverhalt mit fachlichen Kriterien prüfen und ein begründetes Sachurteil formulieren." },
        { op: "bewerten", def: "Sachverhalt an Normen/Werten messen, begründetes Werturteil abgeben." },
        { op: "diskutieren, erörtern", def: "Pro- und Contra-Argumente gegenüberstellen, abwägen und ein begründetes Fazit ziehen." },
        { op: "entwickeln, entwerfen", def: "Trainingsplan, Übungsreihe oder Lösung theoriegeleitet und zielgerichtet konzipieren." },
        { op: "Stellung nehmen", def: "Nach kritischer Prüfung und Abwägung ein begründetes eigenes Urteil abgeben." },
        { op: "überprüfen", def: "Aussagen oder Maßnahmen an Fakten/Theorie messen und Widersprüche aufdecken." }
      ]
    }
  },

  /* ═══════ RELIGION ═══════ */
  religion: {
    quelle: "Bildungsplan 2016 Gymnasium BW Ev. Religionslehre – Anhang „Operatoren“ (kath. Religionslehre im Kern deckungsgleich; beide auf Basis der KMK-EPA)",
    afb: {
      I:   "Wiedergabe von Kenntnissen: Wiedergeben und Beschreiben von Sachverhalten, Texten und Materialien aus einem abgegrenzten Gebiet im gelernten Zusammenhang.",
      II:  "Anwenden von Kenntnissen: Selbstständiges Erklären, Bearbeiten und Ordnen bekannter Inhalte sowie Übertragen auf neue Texte, Sachverhalte und Problemstellungen.",
      III: "Problemlösen und Werten: Reflektierter Umgang mit komplexen religiösen bzw. ethischen Fragestellungen, um zu eigenständigen Begründungen, Urteilen und Deutungen zu gelangen."
    },
    operatoren: {
      I: [
        { op: "nennen / benennen", def: "Ausgewählte Elemente, Aspekte, Begriffe oder Personen unkommentiert angeben." },
        { op: "beschreiben", def: "Merkmale eines Textes, Bildes oder Sachverhalts in Einzelheiten schlüssig darlegen." },
        { op: "darstellen", def: "Sachverhalt, Position oder Gedankengang strukturiert mit eigenen Worten aufzeigen." },
        { op: "skizzieren", def: "Bekannten Sachverhalt oder Gedankengang in seinen Grundzügen ausdrücken." },
        { op: "wiedergeben / zusammenfassen", def: "Wesentliche Inhalte eines Textes oder einer Position komprimiert mit eigenen Worten wiedergeben." }
      ],
      II: [
        { op: "analysieren / untersuchen", def: "Unter gezielter Fragestellung Elemente, Strukturmerkmale und Zusammenhänge systematisch erschließen und darstellen." },
        { op: "anwenden", def: "Bekannten Sachverhalt oder bekannte Methode auf etwas Neues beziehen." },
        { op: "begründen", def: "Aussagen oder Thesen durch Argumente stützen." },
        { op: "belegen / nachweisen", def: "Aussagen durch Textstellen oder bekannte Sachverhalte bestätigen." },
        { op: "einordnen / zuordnen", def: "Sachverhalt oder Position begründet in einen theologischen bzw. historischen Zusammenhang stellen." },
        { op: "entfalten", def: "Einen Gedanken bzw. eine theologische Position umfassend und differenziert darlegen." },
        { op: "erklären", def: "Sachverhalt durch Wissen und Einsichten in einen Zusammenhang stellen und verständlich machen." },
        { op: "erläutern", def: "Sachverhalt durch zusätzliche Informationen und Beispiele veranschaulichen und verständlich machen." },
        { op: "herausarbeiten", def: "Aus Aussagen eines Textes einen Sachverhalt oder eine Position erkennen und darstellen." },
        { op: "in Beziehung setzen", def: "Zusammenhänge zwischen Sachverhalten oder Positionen unter bestimmten Gesichtspunkten begründet herstellen." },
        { op: "vergleichen", def: "Nach Gesichtspunkten Gemeinsamkeiten, Ähnlichkeiten und Unterschiede ermitteln und darstellen." }
      ],
      III: [
        { op: "beurteilen", def: "Zu einem Sachverhalt unter Verwendung von Fachwissen ein begründetes Sachurteil formulieren." },
        { op: "bewerten", def: "Wie beurteilen, zusätzlich mit Offenlegen der eigenen Wertmaßstäbe (Werturteil)." },
        { op: "erörtern", def: "Problem erkennen, Pro- und Contra-Argumente abwägen, zu einer begründeten Schlussfolgerung gelangen." },
        { op: "gestalten / entwerfen", def: "Sich text- und problembezogen kreativ mit einer Fragestellung auseinandersetzen." },
        { op: "interpretieren", def: "Sinnzusammenhänge von Texten, Bildern oder Materialien methodisch erschließen und deuten." },
        { op: "Konsequenzen aufzeigen / Perspektiven entwickeln", def: "Schlussfolgerungen ziehen und Perspektiven bzw. Handlungsmöglichkeiten entfalten." },
        { op: "prüfen / überprüfen", def: "Aussagen oder Argumentationen auf Schlüssigkeit und Angemessenheit untersuchen." },
        { op: "sich auseinandersetzen mit", def: "Zu einer Position oder einem Sachverhalt ein begründetes eigenes Urteil entwickeln." },
        { op: "Stellung nehmen", def: "Unter Verwendung von Fachwissen einen begründeten eigenen Standpunkt formulieren." }
      ]
    }
  },

  /* ═══════ GESCHICHTE ═══════ */
  geschichte: {
    quelle: "Bildungsplan 2016 Gymnasium BW Geschichte – Anhang „Operatoren“ (gemeinsamer gesellschaftswissenschaftlicher Operatorenkatalog)",
    afb: {
      I:   "Reproduktion: Wiedergeben und Beschreiben historischer Sachverhalte und Materialien in einem bekannten Zusammenhang.",
      II:  "Reorganisation und Transfer: Selbstständiges Erklären, Bearbeiten und Ordnen bekannter historischer Sachverhalte sowie Anwenden gelernter Inhalte und Methoden auf neue Materialien.",
      III: "Reflexion und Problemlösung: Reflexiver Umgang mit neuen Problemstellungen, um zu begründeten historischen Sach- und Werturteilen und Deutungen zu gelangen."
    },
    operatoren: {
      I: [
        { op: "nennen / benennen", def: "Informationen, Daten oder Begriffe ohne Erläuterung präzise aufführen." },
        { op: "beschreiben", def: "Historische Sachverhalte bzw. Materialien strukturiert und fachsprachlich angemessen wiedergeben." },
        { op: "darstellen (I-II)", def: "Historische Sachverhalte und Entwicklungen strukturiert und zusammenhängend verdeutlichen." },
        { op: "wiedergeben", def: "Inhalte von Quellen oder Darstellungen mit eigenen Worten unkommentiert darlegen." },
        { op: "zusammenfassen", def: "Wesentliche Aussagen komprimiert und strukturiert in eigenen Worten wiedergeben." },
        { op: "skizzieren (I-II)", def: "Historische Sachverhalte in ihren Grundzügen auf das Wesentliche reduziert darstellen." }
      ],
      II: [
        { op: "analysieren", def: "Quellen, Darstellungen oder Sachverhalte kriterienorientiert erschließen und strukturiert darstellen." },
        { op: "begründen", def: "Aussagen durch Argumente stützen, die durch Belege oder Beispiele untermauert werden." },
        { op: "charakterisieren", def: "Historische Sachverhalte in ihren Eigenarten beschreiben und typische Merkmale zusammenführen." },
        { op: "einordnen", def: "Sachverhalt, Quelle oder Position begründet in einen historischen Zusammenhang stellen." },
        { op: "erklären", def: "Historische Sachverhalte so darstellen, dass Ursachen und Zusammenhänge verständlich werden." },
        { op: "erläutern", def: "Historische Sachverhalte mit zusätzlichen Informationen und Beispielen nachvollziehbar veranschaulichen." },
        { op: "herausarbeiten", def: "Aus Materialien bestimmte, nicht explizit genannte Sachverhalte oder Positionen erkennen und darstellen." },
        { op: "in Beziehung setzen", def: "Zusammenhänge unter vorgegebenen oder selbst gewählten Gesichtspunkten begründet herstellen." },
        { op: "nachweisen", def: "Aussagen durch Belege aus Material oder Kontextwissen bestätigen." },
        { op: "vergleichen", def: "Gemeinsamkeiten und Unterschiede kriterienorientiert herausarbeiten und darstellen." }
      ],
      III: [
        { op: "beurteilen", def: "Historische Sachverhalte oder Entscheidungen an Kriterien prüfen und ein begründetes Sachurteil formulieren." },
        { op: "bewerten", def: "Wie beurteilen, zusätzlich ein begründetes Werturteil mit offengelegten Wertmaßstäben formulieren." },
        { op: "entwickeln", def: "Zu einem Problem eigenständig Deutungen, Hypothesen oder Alternativen begründet entwerfen." },
        { op: "erörtern", def: "Historische Problemstellung durch Pro- und Contra-Argumentation abwägen und begründet urteilen." },
        { op: "gestalten", def: "Problembezogen ein eigenes Produkt (z. B. Rede, Brief, Streitgespräch) kreativ entwerfen." },
        { op: "interpretieren", def: "Material analysieren und durch methodisch reflektiertes Deuten zu einer schlüssigen Gesamtauslegung gelangen." },
        { op: "Stellung nehmen", def: "Unter Verwendung von Fachwissen einen begründeten eigenen Standpunkt formulieren." },
        { op: "überprüfen", def: "Aussagen, Hypothesen oder Urteile an Material und Kontextwissen auf Stichhaltigkeit untersuchen." }
      ]
    }
  },

  /* ═══════ GEOGRAPHIE ═══════ */
  geographie: {
    quelle: "Bildungsplan 2016 Gymnasium BW Geographie – Anhang „Operatoren“ (gemeinsamer gesellschaftswissenschaftlicher Katalog, ergänzt um raumbezogene Operatoren)",
    afb: {
      I:   "Reproduktion: Wiedergeben und Beschreiben raumbezogener Sachverhalte und Materialien (Karten, Diagramme, Texte) sowie Anwenden geübter Arbeitstechniken.",
      II:  "Reorganisation und Transfer: Selbstständiges Erklären, Bearbeiten und Ordnen bekannter raumbezogener Sachverhalte sowie Übertragen gelernter Inhalte und Methoden auf neue Räume und Materialien.",
      III: "Reflexion und Problemlösung: Reflexiver Umgang mit neuen raumbezogenen Problemstellungen, um zu begründeten Urteilen, Lösungen und Handlungsoptionen zu gelangen."
    },
    operatoren: {
      I: [
        { op: "nennen / benennen", def: "Informationen, Sachverhalte oder Fachbegriffe ohne Erläuterung präzise aufführen." },
        { op: "bezeichnen", def: "Sachverhalte, v. a. in Karten, Diagrammen oder Skizzen, begrifflich präzise benennen." },
        { op: "beschreiben", def: "Sachverhalte bzw. Materialien strukturiert und fachsprachlich angemessen wiedergeben." },
        { op: "darstellen (I-II)", def: "Sachverhalte und Zusammenhänge strukturiert, ggf. auch grafisch, verdeutlichen." },
        { op: "lokalisieren (I-II)", def: "Geographische Objekte verorten und ihre Lage mit Fachbegriffen angeben." },
        { op: "wiedergeben", def: "Inhalte oder Aussagen mit eigenen Worten unkommentiert darlegen." },
        { op: "zusammenfassen", def: "Wesentliche Aussagen komprimiert und strukturiert in eigenen Worten wiedergeben." }
      ],
      II: [
        { op: "analysieren", def: "Materialien oder Räume kriterienorientiert bzw. aspektgeleitet erschließen und strukturiert darstellen." },
        { op: "anwenden", def: "Bekannte Modelle, Theorien oder Methoden auf neue Räume oder Sachverhalte beziehen." },
        { op: "begründen", def: "Aussagen durch Argumente stützen, die durch Beispiele oder Belege untermauert werden." },
        { op: "charakterisieren", def: "Räume oder Sachverhalte in ihren Eigenarten beschreiben und typische Merkmale zusammenführen." },
        { op: "einordnen / zuordnen", def: "Sachverhalt begründet in einen räumlichen bzw. systematischen Zusammenhang stellen." },
        { op: "erklären", def: "Sachverhalte so darstellen, dass Ursachen und Wirkungszusammenhänge verständlich werden." },
        { op: "erläutern", def: "Sachverhalte mit zusätzlichen Informationen und Beispielen nachvollziehbar veranschaulichen." },
        { op: "ermitteln", def: "Aus Materialien (Karten, Statistiken) gezielt Informationen oder Ergebnisse gewinnen." },
        { op: "gliedern", def: "Raum, Zeit oder Sachverhalt nach selbst gewählten oder vorgegebenen Kriterien systematisierend ordnen." },
        { op: "herausarbeiten", def: "Aus Materialien bestimmte, nicht explizit genannte Sachverhalte erkennen und darstellen." },
        { op: "in Beziehung setzen", def: "Zusammenhänge unter vorgegebenen oder selbst gewählten Gesichtspunkten begründet herstellen." },
        { op: "vergleichen", def: "Gemeinsamkeiten und Unterschiede von Räumen oder Sachverhalten kriterienorientiert darstellen." },
        { op: "zeichnen / skizzieren (I-II)", def: "Sachverhalte (Profil, Kartenskizze, Diagramm) fachgerecht grafisch darstellen." }
      ],
      III: [
        { op: "beurteilen", def: "Sachverhalte oder Maßnahmen an Kriterien prüfen und ein begründetes Sachurteil formulieren." },
        { op: "bewerten", def: "Wie beurteilen, zusätzlich ein begründetes Werturteil mit offengelegten Wertmaßstäben formulieren." },
        { op: "entwickeln", def: "Zu einem raumbezogenen Problem eigenständig Lösungen oder Konzepte begründet entwerfen." },
        { op: "erörtern", def: "Problemstellung durch Pro- und Contra-Argumentation abwägen und begründet urteilen." },
        { op: "gestalten", def: "Problembezogen ein eigenes Produkt (z. B. Planungsentwurf, Stellungnahme) kreativ entwerfen." },
        { op: "Stellung nehmen", def: "Unter Verwendung von Fachwissen einen begründeten eigenen Standpunkt formulieren." },
        { op: "überprüfen", def: "Hypothesen oder Aussagen an Materialien auf Stichhaltigkeit untersuchen." }
      ]
    }
  },

  /* ═══════ PSYCHOLOGIE ═══════ */
  psychologie: {
    quelle: "Keine eigene amtliche BW-Operatorenliste verifizierbar → gesellschaftswissenschaftliche Operatoren BW (BP 2016) bzw. KMK-EPA Psychologie",
    afb: {
      I:   "Reproduktion: Wiedergeben und Beschreiben psychologischer Sachverhalte, Fachbegriffe, Theorien und Methoden im gelernten Zusammenhang.",
      II:  "Reorganisation und Transfer: Selbstständiges Erklären und Ordnen bekannter Inhalte sowie Anwenden psychologischer Theorien und Methoden auf neue Fälle, Studien und Materialien.",
      III: "Reflexion und Problemlösung: Reflektierter Umgang mit komplexen psychologischen Problemstellungen, um zu begründeten Urteilen, Bewertungen und Lösungsansätzen zu gelangen."
    },
    operatoren: {
      I: [
        { op: "nennen / benennen", def: "Begriffe, Merkmale oder Sachverhalte ohne Erläuterung präzise aufführen." },
        { op: "beschreiben", def: "Verhalten, Situationen, Studien oder Modelle strukturiert und wertungsfrei mit eigenen Worten wiedergeben." },
        { op: "darstellen (I-II)", def: "Theorien, Modelle oder Zusammenhänge strukturiert und zusammenhängend verdeutlichen." },
        { op: "wiedergeben / zusammenfassen", def: "Wesentliche Inhalte von Texten oder Studien komprimiert in eigenen Worten wiedergeben." },
        { op: "skizzieren (I-II)", def: "Theorie, Modell oder Studie in Grundzügen auf das Wesentliche reduziert darstellen." }
      ],
      II: [
        { op: "analysieren / untersuchen", def: "Fallbeispiele, Studien oder Materialien kriterienorientiert erschließen und strukturiert darstellen." },
        { op: "anwenden", def: "Psychologische Theorien, Modelle oder Methoden auf einen neuen Fall beziehen." },
        { op: "begründen", def: "Aussagen durch Argumente stützen, die durch Belege (z. B. Befunde) untermauert werden." },
        { op: "einordnen / zuordnen", def: "Sachverhalt begründet einer Theorie, einem Modell oder Zusammenhang zuweisen." },
        { op: "erklären", def: "Verhalten bzw. Erleben auf Theorien oder Modelle zurückführen und verständlich machen." },
        { op: "erläutern", def: "Sachverhalte mit zusätzlichen Informationen und Beispielen nachvollziehbar veranschaulichen." },
        { op: "herausarbeiten", def: "Aus Materialien bestimmte, nicht explizit genannte Sachverhalte oder Positionen erkennen und darstellen." },
        { op: "vergleichen", def: "Gemeinsamkeiten und Unterschiede von Theorien, Modellen oder Befunden kriterienorientiert darstellen." }
      ],
      III: [
        { op: "beurteilen", def: "Theorien, Studien oder Maßnahmen an Kriterien prüfen und ein begründetes Sachurteil formulieren." },
        { op: "bewerten", def: "Wie beurteilen, zusätzlich Werturteil (z. B. ethisch) mit offengelegten Wertmaßstäben." },
        { op: "entwickeln", def: "Eigenständig Hypothesen, Untersuchungsdesigns oder Interventionsvorschläge begründet entwerfen." },
        { op: "erörtern / abwägen", def: "Problemstellung durch Pro- und Contra-Argumentation abwägen und begründet urteilen." },
        { op: "Stellung nehmen", def: "Unter Verwendung von Fachwissen einen begründeten eigenen Standpunkt formulieren." },
        { op: "überprüfen", def: "Hypothesen, Aussagen oder Befunde auf Stichhaltigkeit und Aussagekraft untersuchen." }
      ]
    }
  }
};
