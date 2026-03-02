var TKBGCalculator = (function () {
  "use strict";

  var daten = null;

  function init(jsonDaten) {
    daten = jsonDaten;
  }

  function istKostenfrei(jahrgangsstufe) {
    return jahrgangsstufe === "1" || jahrgangsstufe === "2" || jahrgangsstufe === "eingangsstufe";
  }

  function bestimmeAnlage(schulform, jahrgangsstufe) {
    if (schulform === "foerderschwerpunkt") {
      var obereStudien = ["oberstufe", "abschlussstufe", "7", "8", "9", "10"];
      if (obereStudien.indexOf(jahrgangsstufe) !== -1) {
        return "anlage2a";
      }
    }
    return "anlage2";
  }

  function findeEinkommensstufe(anlageKey, einkommen) {
    var stufen = daten[anlageKey].einkommensstufen;
    if (einkommen <= stufen[0].bis) {
      return { index: 0, stufe: stufen[0] };
    }
    for (var i = stufen.length - 1; i >= 1; i--) {
      if (einkommen >= stufen[i].ab) {
        return { index: i, stufe: stufen[i] };
      }
    }
    return { index: 0, stufe: stufen[0] };
  }

  function verfuegbareModule(schulform, jahrgangsstufe) {
    var anlageKey = bestimmeAnlage(schulform, jahrgangsstufe);
    var spalten = daten[anlageKey].spalten;

    if (anlageKey === "anlage2a") {
      return spalten.slice();
    }

    return spalten.filter(function (spalte) {
      if (spalte.schulformen && spalte.schulformen.indexOf(schulform) === -1) {
        // Förderschwerpunkt Mittelstufe uses Anlage 2 columns for gebunden
        if (schulform === "foerderschwerpunkt") {
          // Mittelstufe-only column (Spalte 8) is available
          if (spalte.nurMittelstufe && jahrgangsstufe === "mittelstufe") {
            return true;
          }
          // Förderschwerpunkt lower grades use gebundene Ganztagsschule columns
          if (spalte.schulformen.indexOf("gebunden") !== -1) {
            return true;
          }
          return false;
        }
        return false;
      }
      if (spalte.nurMittelstufe && jahrgangsstufe !== "mittelstufe") {
        return false;
      }
      return true;
    });
  }

  function verfuegbareJahrgangsstufen(schulform) {
    switch (schulform) {
      case "offen":
      case "gebunden":
        return [
          { value: "1", label: "Jahrgangsstufe 1 (kostenfrei)" },
          { value: "2", label: "Jahrgangsstufe 2 (kostenfrei)" },
          { value: "3", label: "Jahrgangsstufe 3" },
          { value: "4", label: "Jahrgangsstufe 4" },
          { value: "5", label: "Jahrgangsstufe 5" },
          { value: "6", label: "Jahrgangsstufe 6" },
        ];
      case "foerderschwerpunkt":
        return [
          { value: "eingangsstufe", label: "Eingangsstufe (kostenfrei)" },
          { value: "1", label: "Jahrgangsstufe 1 (kostenfrei)" },
          { value: "2", label: "Jahrgangsstufe 2 (kostenfrei)" },
          { value: "3", label: "Jahrgangsstufe 3" },
          { value: "4", label: "Jahrgangsstufe 4" },
          { value: "5", label: "Jahrgangsstufe 5" },
          { value: "6", label: "Jahrgangsstufe 6" },
          { value: "mittelstufe", label: "Mittelstufe" },
          { value: "oberstufe", label: "Oberstufe" },
          { value: "abschlussstufe", label: "Abschlussstufe" },
        ];
      default:
        return [];
    }
  }

  function berechneKosten(einkommen, anlageKey, spalteId) {
    var ergebnis = findeEinkommensstufe(anlageKey, einkommen);
    var spaltenIndex = spalteId - 1;
    var spalte = daten[anlageKey].spalten[spaltenIndex];
    var kostenbeitrag = ergebnis.stufe.kosten[spaltenIndex];

    var label;
    if (ergebnis.stufe.bis !== undefined) {
      label = "bis " + formatEuro(ergebnis.stufe.bis) + " (Stufe " + ergebnis.stufe.nr + ")";
    } else {
      label = "ab " + formatEuro(ergebnis.stufe.ab) + " (Stufe " + ergebnis.stufe.nr + ")";
    }

    return {
      kostenbeitrag: kostenbeitrag,
      einkommensstufe: label,
      anlage: anlageKey === "anlage2" ? "Anlage 2" : "Anlage 2a",
      spalteId: spalteId,
      spalteBeschreibung: spalte.beschreibung,
      zeitraum: spalte.zeitraum,
      stunden: spalte.stunden,
    };
  }

  function formatEuro(betrag) {
    return betrag.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " EUR";
  }

  return {
    init: init,
    istKostenfrei: istKostenfrei,
    bestimmeAnlage: bestimmeAnlage,
    findeEinkommensstufe: findeEinkommensstufe,
    verfuegbareModule: verfuegbareModule,
    verfuegbareJahrgangsstufen: verfuegbareJahrgangsstufen,
    berechneKosten: berechneKosten,
    formatEuro: formatEuro,
  };
})();
