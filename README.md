# TKBG Rechner

Rechner für den monatlichen Kostenbeitrag der ergänzenden Förderung und Betreuung (eFöB) an Berliner Grundschulen, basierend auf dem [Tagesbetreuungskostenbeteiligungsgesetz (TKBG), § 4a](https://gesetze.berlin.de/perma?d=jlr-TagEinrKostBetGBE2010V1P1).

## Funktionen

- Berechnung des monatlichen Kostenbeitrags anhand von Einkommen, Schulform, Jahrgangsstufe und Betreuungsmodul
- Unterstützung für offene und gebundene Ganztagsschulen sowie Schulen mit sonderpädagogischem Förderschwerpunkt (Geistige Entwicklung)
- Kostentabellen nach [Anlage 2](https://gesetze.berlin.de/perma?d=jlr-TagEinrKostBetGBE2010V10Anlage2) und [Anlage 2a](https://gesetze.berlin.de/perma?d=jlr-TagEinrKostBetGBE2010V9Anlage2a) TKBG
- Übersicht der relevanten Gesetzesparagraphen

## Technik

Statische Webseite ohne Build-Schritt — HTML, CSS und Vanilla JavaScript. Die Kostentabellen liegen als JSON in `data/kostentabellen.json`. Deployment via [Cloudflare Workers](https://workers.cloudflare.com/).

## Lokal starten

Die Seite kann mit jedem beliebigen Webserver geöffnet werden, z.B.:

```sh
npx serve .
```

## Hinweis

Die Kostentabellen gelten ab 01.08.2022. Alle Angaben ohne Gewähr.

## Lizenz

[MIT](LICENSE)
