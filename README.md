# TKBG Rechner

Rechner für den monatlichen Kostenbeitrag der ergänzenden Förderung und Betreuung (eFöB) an Berliner Grundschulen, basierend auf dem [Tagesbetreuungskostenbeteiligungsgesetz (TKBG), § 4a](https://gesetze.berlin.de/perma?d=jlr-TagEinrKostBetGBE2010V1P1).

## Funktionen

- Monatliche und jährliche Kostenbeiträge aller Betreuungsmodule auf einen Blick, anhand von Einkommen (Schieberegler über die 41 Einkommensstufen), Schulform und Jahrgangsstufe, inkl. Geschwisterermäßigung und Mindestbetrag für Pflegekinder
- Unterstützung für offene und gebundene Ganztagsschulen sowie Schulen und Klassen mit sonderpädagogischem Förderschwerpunkt Geistige Entwicklung oder Autismus
- Kostentabellen nach [Anlage 2](https://gesetze.berlin.de/bsbe/document/jlr-NNLBE00004DB9NN00000000039) und [Anlage 2a](https://gesetze.berlin.de/bsbe/document/jlr-NNLBE00004DB9NN00000000040) TKBG
- Übersicht der relevanten Gesetzesparagraphen
- Links zu den offiziellen Anträgen und Formularen (eFöB-Antrag, Einkommenserklärung)
- Englische Version unter [tkbg.de/en](https://tkbg.de/en/)
- Berechnung als Link teilen: alle Eingaben stehen im Query-String (`einkommen`, `kinder`, `pflege`, `schulform`, `stufe`), gleich für deutsche und englische Seite
- Druckansicht bzw. PDF mit Eingaben, Ergebnis, Datum und Link zur Berechnung
- Kurze Erklärungen zu Schulform und Jahrgangsstufe

## Technik

Statische Webseite ohne Build-Schritt — HTML, CSS und Vanilla JavaScript. Die Kostentabellen liegen als JSON in `public/data/kostentabellen.json`, die Einträge im Abschnitt „Updates“ (deutsch und englisch) in `public/data/updates.json`. Deutsche (`public/index.html`) und englische Seite (`public/en/index.html`) teilen sich dasselbe JavaScript; die Sprache wird über `<html lang>` gewählt, die UI-Texte stehen in `public/js/i18n.js`. Deployment via [Cloudflare Workers](https://workers.cloudflare.com/).

## Lokal starten

```sh
npm install
bin/dev
```

`bin/dev` startet `wrangler dev` auf http://localhost:8788, wie im Deployment. Alternativ geht jeder statische Webserver für `public/`, z.B. `npx serve public`.

## Tests und Datenprüfung

```sh
npm test
```

prüft Berechnung, Daten, Übersetzungen und Updates (läuft per GitHub Action „CI“ bei jedem Push und wöchentlich).

```sh
bin/check-tables ANLAGE_2.pdf ANLAGE_2A.pdf
```

vergleicht `public/data/kostentabellen.json` Zelle für Zelle mit den offiziellen PDFs von Anlage 2 und 2a (Export von gesetze.berlin.de, Reihenfolge egal; benötigt `pdftotext` aus poppler).

## Daten aktuell halten

Änderungen am TKBG kamen bisher immer per Gesetz des Abgeordnetenhauses, meist im Juni/Juli beschlossen und zum **1. August** (Schuljahresbeginn) in Kraft. Gesetzentwürfe stehen Monate vorher in [PARDOK](https://pardok.parlament-berlin.de/portala/start.tt.html).

**Automatisch (wöchentlich, GitHub Action „CI“):**

- `npm test`, inkl. Prüfung, dass die Daten nicht älter als 365 Tage geprüft sind (`meta.geprueftAm` in `public/data/kostentabellen.json`).
- `bin/check-sources`: alle externen Links funktionieren noch, und die Formulare/Erläuterungen der Senatsverwaltung auf berlin.de sind unverändert (Fingerabdrücke in `data/sources.json`). Eine Änderung dort ist ein Signal, dass sich auch das Gesetz geändert haben könnte.

Schlägt der Lauf fehl, schickt GitHub eine E-Mail.

**Jährliche Prüfung (Anfang Juni) – und immer, wenn die Action anschlägt:**

1. In PARDOK nach „Tagesbetreuungskostenbeteiligungsgesetz“ suchen (Wahlperiode: aktuelle) und neue Gesetze/Entwürfe prüfen. Auch Änderungen am Schulgesetz § 19 Abs. 6 beachten (wer kostenpflichtig ist).
2. Auf [gesetze.berlin.de](https://gesetze.berlin.de/perma?d=jlr-TagEinrKostBetGBE2010rahmen) prüfen, welche Fassung gilt („letzte berücksichtigte Änderung“). Anlage 2 und 2a jeweils als PDF exportieren (bei alten Fassungen dem Link zur aktuellen Fassung folgen).
3. `bin/check-tables ANLAGE_2.pdf ANLAGE_2A.pdf` ausführen und Abweichungen in `public/data/kostentabellen.json` übernehmen.
4. Bei neuer Fassung: Links auf Anlage 2/2a aktualisieren (beide HTML-Seiten und README; die Dokument-ID steht im PDF-Dateinamen, z. B. `jlr-NNLBE00004DB9NN00000000039`), Gesetzesübersicht und Freistellungen (z. B. kostenfreie Jahrgangsstufen) prüfen.
5. Nach Prüfung der geänderten Dokumente `bin/check-sources --update` ausführen.
6. `meta.geprueftAm` auf das heutige Datum setzen, ggf. Eintrag in `public/data/updates.json` (deutsch und englisch) ergänzen, `npm test`, deployen.

**Vorgemerkt:** Laut Änderungsantrag Drs. 19/3105-2 gilt die Kostenbeteiligung nach TKBG ab 01.08.2028 voraussichtlich auch für Schülerinnen und Schüler der Jahrgangsstufen 7 bis 10 an Schulen mit den Förderschwerpunkten „Hören und Kommunikation“, „Sehen“ und „Körperliche und motorische Entwicklung“ (Schulgesetz § 19 Abs. 6). Inkrafttreten im GVBl. prüfen und dann im Rechner ergänzen.

## Hinweis

Stand: TKBG in der ab 01.08.2026 geltenden Fassung (zuletzt geändert durch Gesetz vom 09.07.2026). Die Beträge der Kostentabellen gelten unverändert seit 01.08.2022. Alle Angaben ohne Gewähr.

## Lizenz

[MIT](LICENSE)
