# TKBG Rechner

Rechner für den monatlichen Kostenbeitrag der ergänzenden Förderung und Betreuung (eFöB) an Berliner Grundschulen, basierend auf dem [Tagesbetreuungskostenbeteiligungsgesetz (TKBG), § 4a](https://gesetze.berlin.de/perma?d=jlr-TagEinrKostBetGBE2010V1P1).

## Funktionen

- Berechnung des monatlichen Kostenbeitrags anhand von Einkommen, Schulform, Jahrgangsstufe und Betreuungsmodul
- Unterstützung für offene und gebundene Ganztagsschulen sowie Schulen und Klassen mit sonderpädagogischem Förderschwerpunkt Geistige Entwicklung oder Autismus
- Kostentabellen nach [Anlage 2](https://gesetze.berlin.de/bsbe/document/jlr-NNLBE00004DB9NN00000000039) und [Anlage 2a](https://gesetze.berlin.de/bsbe/document/jlr-NNLBE00004DB9NN00000000040) TKBG
- Übersicht der relevanten Gesetzesparagraphen

## Technik

Statische Webseite ohne Build-Schritt — HTML, CSS und Vanilla JavaScript. Die Kostentabellen liegen als JSON in `data/kostentabellen.json`. Deployment via [Cloudflare Workers](https://workers.cloudflare.com/).

## Lokal starten

Die Seite kann mit jedem beliebigen Webserver geöffnet werden, z.B.:

```sh
npx serve .
```

## Hinweis

Stand: TKBG in der ab 01.08.2026 geltenden Fassung (zuletzt geändert durch Gesetz vom 09.07.2026). Die Beträge der Kostentabellen gelten unverändert seit 01.08.2022. Alle Angaben ohne Gewähr.

## Lizenz

[MIT](LICENSE)
