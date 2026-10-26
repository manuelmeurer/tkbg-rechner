var TKBGI18n = (function () {
  "use strict";

  var STRINGS = {
    de: {
      numberLocale: "de-DE",
      loadError: "Fehler beim Laden der Kostentabellen. Bitte Seite neu laden.",
      selectPrompt: "-- Bitte wählen --",
      selectSchoolTypeFirst: "-- Bitte zuerst Schulform wählen --",
      gradeLevel: "Jahrgangsstufe {grade}",
      freeSuffix: " (kostenfrei)",
      eingangsstufe: "Eingangsstufe",
      unterstufe: "Unterstufe",
      mittelstufe: "Mittelstufe",
      oberstufe: "Oberstufe",
      abschlussstufe: "Abschlussstufe",
      sekundarstufe: "Jahrgangsstufen 7 bis 10 (Sekundarstufe I)",
      none: "Keine",
      schoolTimeModules: "Schulzeit (ohne Ferien)",
      holidayModules: "Ferien (zusätzlich oder ausschließlich)",
      holidayOnlyModules: "Oder: nur Ferienbetreuung",
      bracketUpTo: "bis {amount}",
      bracketFrom: "ab {amount}",
      bracketNumber: "Stufe {number}",
      minimumBracket: "Mindestbetrag (Stufe 1)",
      fosterCareDiscount: "Pflegekind bzw. stationäre Hilfe: Mindestbetrag unabhängig vom Einkommen (§ 3 Abs. 2 TKBG)",
      copied: "Kopiert!",
      copyFailed: "Kopieren nicht möglich",
      yes: "Ja",
      no: "Nein",
      notApplicable: "entfällt (Mindestbetrag)",
      incomePrompt: "Bitte Einkommen mit dem Regler wählen",
      incomeUpTo: "bis {to} € im Jahr (bis ca. {monthlyTo} € im Monat)",
      incomeRange: "{from} – {to} € im Jahr (ca. {monthlyFrom} – {monthlyTo} € im Monat)",
      incomeFrom: "ab {from} € im Jahr (ab ca. {monthlyFrom} € im Monat)",
      siblingDiscountShare: "Geschwisterermäßigung auf {percent} % (§ 3 Abs. 3 TKBG), in den Beträgen bereits enthalten",
      moduleListHeading: "Kostenbeiträge je Modul",
      moduleListHolidayIncluded: "Schulzeitmodule enthalten die Ferienbetreuung. Maßgeblich ist das bewilligte Modul laut Bedarfsbescheid bzw. Betreuungsvertrag.",
      moduleListCombinable: "Ein Ferienmodul kann zu einem Schulzeitmodul hinzukommen, die Beträge werden addiert (mit Geschwisterermäßigung wird erst die Summe gerundet, daher evtl. 1 EUR Abweichung). Maßgeblich sind die bewilligten Module laut Bedarfsbescheid bzw. Betreuungsvertrag.",
      perMonth: "{amount} / Monat",
    },
    en: {
      numberLocale: "en-GB",
      loadError: "Failed to load the cost tables. Please reload the page.",
      selectPrompt: "-- Please select --",
      selectSchoolTypeFirst: "-- Please select a school type first --",
      gradeLevel: "Grade {grade}",
      freeSuffix: " (free of charge)",
      eingangsstufe: "Eingangsstufe – entry level",
      unterstufe: "Unterstufe – lower level",
      mittelstufe: "Mittelstufe – middle level",
      oberstufe: "Oberstufe – upper level",
      abschlussstufe: "Abschlussstufe – final level",
      sekundarstufe: "Grades 7 to 10 (Sekundarstufe I, lower secondary)",
      none: "None",
      schoolTimeModules: "School term (excluding holidays)",
      holidayModules: "School holidays (additionally or exclusively)",
      holidayOnlyModules: "Or: holiday care only",
      bracketUpTo: "up to {amount}",
      bracketFrom: "from {amount}",
      bracketNumber: "bracket {number}",
      minimumBracket: "Minimum contribution (bracket 1)",
      fosterCareDiscount: "Foster child or residential care: minimum contribution regardless of income (§ 3 Abs. 2 TKBG)",
      copied: "Copied!",
      copyFailed: "Copying not possible",
      yes: "Yes",
      no: "No",
      notApplicable: "not applicable (minimum contribution)",
      incomePrompt: "Please choose your income with the slider",
      incomeUpTo: "up to €{to} a year (up to approx. €{monthlyTo} a month)",
      incomeRange: "€{from} – €{to} a year (approx. €{monthlyFrom} – €{monthlyTo} a month)",
      incomeFrom: "from €{from} a year (from approx. €{monthlyFrom} a month)",
      siblingDiscountShare: "Sibling discount, {percent}% of the full amount (§ 3 Abs. 3 TKBG), already included in the amounts",
      moduleListHeading: "Contribution per module",
      moduleListHolidayIncluded: "School-term modules include holiday care. What counts is the module approved in your Bedarfsbescheid (notice of eligibility) or care contract.",
      moduleListCombinable: "A holiday module can be added to a school-term module; the amounts add up (with a sibling discount, only the sum is rounded, so it may differ by 1 EUR). What counts are the modules approved in your Bedarfsbescheid (notice of eligibility) or care contract.",
      perMonth: "{amount} / month",
    },
  };

  var DATE_FORMATS = {
    de: { day: "2-digit", month: "2-digit", year: "numeric" },
    en: { day: "numeric", month: "short", year: "numeric" },
  };

  var locale = document.documentElement.lang === "en" ? "en" : "de";
  var strings = STRINGS[locale];

  // Replaces {name} placeholders with the matching entries of params.
  function translate(key, params) {
    return strings[key].replace(/\{(\w+)\}/g, function (match, name) {
      return params[name];
    });
  }

  // Returns the English variant of a data field (e.g. "beschreibungEn") on the English page, if present.
  function localized(object, field) {
    return (locale === "en" && object[field + "En"]) || object[field];
  }

  function formatNumber(number, options) {
    return number.toLocaleString(strings.numberLocale, options);
  }

  // Accepts a Date or an ISO date string such as "2026-10-26" (read as local date, not UTC)
  function formatDate(date) {
    if (typeof date === "string")
      date = new Date(date + "T00:00:00");
    return date.toLocaleDateString(strings.numberLocale, DATE_FORMATS[locale]);
  }

  return {
    translate: translate,
    localized: localized,
    formatNumber: formatNumber,
    formatDate: formatDate,
  };
})();
