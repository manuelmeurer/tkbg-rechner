(function () {
  "use strict";

  var el = {};

  async function ladeDaten() {
    try {
      var response = await fetch("data/kostentabellen.json");
      if (!response.ok) throw new Error("HTTP " + response.status);
      var daten = await response.json();
      TKBGCalculator.init(daten);
      initialisiereApp(daten);
    } catch (fehler) {
      console.error("Fehler beim Laden der Kostentabellen:", fehler);
      document.getElementById("ergebnis-leer").innerHTML =
        '<p style="color:#c62828">Fehler beim Laden der Kostentabellen. Bitte Seite neu laden.</p>';
    }
  }

  function initialisiereApp(daten) {
    el.einkommen = document.getElementById("einkommen");
    el.schulform = document.getElementById("schulform");
    el.jahrgangsstufe = document.getElementById("jahrgangsstufe");
    el.modulContainer = document.getElementById("modul-container");
    el.ferienContainer = document.getElementById("ferien-container");
    el.ergebnisLeer = document.getElementById("ergebnis-leer");
    el.kostenfreiHinweis = document.getElementById("kostenfrei-hinweis");
    el.kostenErgebnis = document.getElementById("kosten-ergebnis");
    el.monatlichBeitrag = document.getElementById("monatlicher-beitrag");
    el.einkommensstufeAnzeige = document.getElementById("einkommensstufe-anzeige");
    el.tabelleAnzeige = document.getElementById("tabelle-anzeige");
    el.spalteAnzeige = document.getElementById("spalte-anzeige");
    el.modulAnzeige = document.getElementById("modul-anzeige");
    el.umfangAnzeige = document.getElementById("umfang-anzeige");
    el.ferienErgebnis = document.getElementById("ferien-ergebnis");
    el.ferienModulAnzeige = document.getElementById("ferien-modul-anzeige");
    el.ferienKostenAnzeige = document.getElementById("ferien-kosten-anzeige");

    befuelleEinkommenSelect(daten);

    el.schulform.addEventListener("change", onSchulformChange);
    el.jahrgangsstufe.addEventListener("change", onJahrgangsstufeChange);
    el.einkommen.addEventListener("change", aktualisiereErgebnis);
  }

  function befuelleEinkommenSelect(daten) {
    var stufen = daten.anlage2.einkommensstufen;
    var html = '<option value="">-- Bitte wählen --</option>';

    stufen.forEach(function (stufe) {
      var label;
      if (stufe.bis !== undefined) {
        label = "bis " + formatZahl(stufe.bis) + " € (monatl. " + formatZahl(stufe.monatlich) + " €)";
      } else {
        label = "ab " + formatZahl(stufe.ab) + " € (monatl. " + formatZahl(stufe.monatlich) + " €)";
      }
      var wert = stufe.bis !== undefined ? stufe.bis : stufe.ab;
      html += '<option value="' + wert + '">' + label + "</option>";
    });

    el.einkommen.innerHTML = html;
  }

  function formatZahl(zahl) {
    return zahl.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function onSchulformChange() {
    var schulform = el.schulform.value;

    el.jahrgangsstufe.innerHTML = "";
    el.jahrgangsstufe.disabled = !schulform;

    if (!schulform) {
      el.jahrgangsstufe.innerHTML = '<option value="">-- Bitte zuerst Schulform wählen --</option>';
      leereModule();
      zeigeLeerergebnis();
      return;
    }

    var stufen = TKBGCalculator.verfuegbareJahrgangsstufen(schulform);
    var optionen = '<option value="">-- Bitte wählen --</option>';
    stufen.forEach(function (s) {
      optionen += '<option value="' + s.value + '">' + s.label + "</option>";
    });
    el.jahrgangsstufe.innerHTML = optionen;

    leereModule();
    zeigeLeerergebnis();
  }

  function onJahrgangsstufeChange() {
    var schulform = el.schulform.value;
    var jgs = el.jahrgangsstufe.value;

    if (!schulform || !jgs) {
      leereModule();
      zeigeLeerergebnis();
      return;
    }

    if (TKBGCalculator.istKostenfrei(jgs)) {
      leereModule();
      zeigeKostenfrei();
      return;
    }

    var module = TKBGCalculator.verfuegbareModule(schulform, jgs);
    rendereModule(module);
    aktualisiereErgebnis();
  }

  function leereModule() {
    el.modulContainer.innerHTML = '<p class="hilfetext">Bitte zuerst Schulform und Jahrgangsstufe wählen.</p>';
    el.ferienContainer.innerHTML = '<p class="hilfetext">Bitte zuerst Schulform und Jahrgangsstufe wählen.</p>';
  }

  function rendereModule(module) {
    var regulaer = module.filter(function (m) { return !m.istFerienmodul; });
    var ferien = module.filter(function (m) { return m.istFerienmodul; });

    // Reguläre Module als Radio-Buttons
    var html = "";
    regulaer.forEach(function (m) {
      html +=
        '<div class="modul-option">' +
        '<input type="radio" name="modul" id="modul-' + m.id + '" value="' + m.id + '">' +
        '<label for="modul-' + m.id + '">' +
        '<span class="modul-zeit">' + m.zeitraum + " (" + m.stunden + " Std./Tag)</span>" +
        '<span class="modul-beschreibung">' + m.beschreibung + "</span>" +
        "</label>" +
        "</div>";
    });
    el.modulContainer.innerHTML = html || '<p class="hilfetext">Keine Module verfügbar.</p>';

    // Ferienmodule als Checkboxen
    var ferienHtml = "";
    if (ferien.length > 0) {
      ferien.forEach(function (m) {
        ferienHtml +=
          '<div class="modul-option">' +
          '<input type="checkbox" name="ferien" id="ferien-' + m.id + '" value="' + m.id + '">' +
          '<label for="ferien-' + m.id + '">' +
          '<span class="modul-zeit">' + m.zeitraum + " (" + m.stunden + " Std./Tag)</span>" +
          '<span class="modul-beschreibung">' + m.beschreibung + "</span>" +
          "</label>" +
          "</div>";
      });
      el.ferienContainer.innerHTML = ferienHtml;
    } else {
      el.ferienContainer.innerHTML = '<p class="hilfetext">Keine Ferienmodule verfügbar.</p>';
    }

    // Event-Listener für Module
    el.modulContainer.querySelectorAll('input[type="radio"]').forEach(function (input) {
      input.addEventListener("change", aktualisiereErgebnis);
    });
    el.ferienContainer.querySelectorAll('input[type="checkbox"]').forEach(function (input) {
      input.addEventListener("change", aktualisiereErgebnis);
    });
  }

  function holeGewaehlteModule() {
    var gewaehlt = { regulaer: null, ferien: null };

    var regulaerInput = el.modulContainer.querySelector('input[name="modul"]:checked');
    if (regulaerInput) {
      gewaehlt.regulaer = parseInt(regulaerInput.value, 10);
    }

    var ferienInput = el.ferienContainer.querySelector('input[name="ferien"]:checked');
    if (ferienInput) {
      gewaehlt.ferien = parseInt(ferienInput.value, 10);
    }

    return gewaehlt;
  }

  function aktualisiereErgebnis() {
    var einkommen = parseFloat(el.einkommen.value);
    var schulform = el.schulform.value;
    var jgs = el.jahrgangsstufe.value;

    if (!einkommen && einkommen !== 0 || !schulform || !jgs) {
      zeigeLeerergebnis();
      return;
    }

    if (TKBGCalculator.istKostenfrei(jgs)) {
      zeigeKostenfrei();
      return;
    }

    var module = holeGewaehlteModule();
    if (!module.regulaer && !module.ferien) {
      zeigeLeerergebnis();
      return;
    }

    var anlageKey = TKBGCalculator.bestimmeAnlage(schulform, jgs);
    var gesamtKosten = 0;
    var regulaerErgebnis = null;
    var ferienErgebnis = null;

    if (module.regulaer) {
      regulaerErgebnis = TKBGCalculator.berechneKosten(einkommen, anlageKey, module.regulaer);
      gesamtKosten += regulaerErgebnis.kostenbeitrag;
    }

    if (module.ferien) {
      ferienErgebnis = TKBGCalculator.berechneKosten(einkommen, anlageKey, module.ferien);
      gesamtKosten += ferienErgebnis.kostenbeitrag;
    }

    // Hauptergebnis anzeigen
    el.ergebnisLeer.classList.add("hidden");
    el.kostenfreiHinweis.classList.add("hidden");
    el.kostenErgebnis.classList.remove("hidden");

    el.monatlichBeitrag.textContent = gesamtKosten + " EUR";

    // Details des regulären Moduls
    var details = regulaerErgebnis || ferienErgebnis;
    el.einkommensstufeAnzeige.textContent = details.einkommensstufe;
    el.tabelleAnzeige.textContent = details.anlage;

    if (regulaerErgebnis) {
      el.spalteAnzeige.textContent = "Spalte " + regulaerErgebnis.spalteId;
      el.modulAnzeige.textContent = regulaerErgebnis.zeitraum;
      el.umfangAnzeige.textContent = regulaerErgebnis.stunden + " Std./Tag (" + regulaerErgebnis.spalteBeschreibung + ")";
    } else {
      el.spalteAnzeige.textContent = "--";
      el.modulAnzeige.textContent = "Nur Ferienbetreuung";
      el.umfangAnzeige.textContent = "--";
    }

    // Ferien-Details
    if (ferienErgebnis) {
      el.ferienErgebnis.classList.remove("hidden");
      el.ferienModulAnzeige.textContent = ferienErgebnis.zeitraum + " (" + ferienErgebnis.stunden + " Std./Tag)";
      el.ferienKostenAnzeige.textContent = ferienErgebnis.kostenbeitrag + " EUR (Spalte " + ferienErgebnis.spalteId + ")";
    } else {
      el.ferienErgebnis.classList.add("hidden");
    }
  }

  function zeigeLeerergebnis() {
    el.ergebnisLeer.classList.remove("hidden");
    el.kostenfreiHinweis.classList.add("hidden");
    el.kostenErgebnis.classList.add("hidden");
    el.ferienErgebnis.classList.add("hidden");
  }

  function zeigeKostenfrei() {
    el.ergebnisLeer.classList.add("hidden");
    el.kostenfreiHinweis.classList.remove("hidden");
    el.kostenErgebnis.classList.add("hidden");
    el.ferienErgebnis.classList.add("hidden");
  }

  document.addEventListener("DOMContentLoaded", ladeDaten);
})();
