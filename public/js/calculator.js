var TKBGCalculator = (function () {
  "use strict";

  var data = null;

  function init(jsonData) {
    data = jsonData;
  }

  function isFreeOfCharge(gradeLevel) {
    return gradeLevel === "1" || gradeLevel === "2" || gradeLevel === "eingangsstufe";
  }

  function determineAnnex(schoolType, gradeLevel) {
    if (schoolType === "foerderschwerpunkt") {
      var upperGrades = ["oberstufe", "abschlussstufe", "7", "8", "9", "10"];
      if (upperGrades.indexOf(gradeLevel) !== -1) {
        return "anlage2a";
      }
    }
    return "anlage2";
  }

  function findIncomeBracket(annexKey, income) {
    var brackets = data[annexKey].einkommensstufen;
    if (income <= brackets[0].bis) {
      return { index: 0, bracket: brackets[0] };
    }
    for (var i = brackets.length - 1; i >= 1; i--) {
      if (income >= brackets[i].ab) {
        return { index: i, bracket: brackets[i] };
      }
    }
    return { index: 0, bracket: brackets[0] };
  }

  function availableModules(schoolType, gradeLevel) {
    var annexKey = determineAnnex(schoolType, gradeLevel);
    var columns = data[annexKey].spalten;

    if (annexKey === "anlage2a") {
      return columns.slice();
    }

    return columns.filter(function (column) {
      if (column.schulformen && column.schulformen.indexOf(schoolType) === -1) {
        if (schoolType === "foerderschwerpunkt") {
          if (column.nurMittelstufe && gradeLevel === "mittelstufe") {
            return true;
          }
          if (column.schulformen.indexOf("gebunden") !== -1) {
            return true;
          }
          return false;
        }
        return false;
      }
      if (column.nurMittelstufe && gradeLevel !== "mittelstufe") {
        return false;
      }
      return true;
    });
  }

  function availableGradeLevels(schoolType) {
    switch (schoolType) {
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

  function calculateCost(income, annexKey, columnId) {
    var result = findIncomeBracket(annexKey, income);
    var columnIndex = columnId - 1;
    var column = data[annexKey].spalten[columnIndex];
    var costContribution = result.bracket.kosten[columnIndex];

    var label;
    if (result.bracket.bis !== undefined) {
      label = "bis " + formatEuro(result.bracket.bis) + " (Stufe " + result.bracket.nr + ")";
    } else {
      label = "ab " + formatEuro(result.bracket.ab) + " (Stufe " + result.bracket.nr + ")";
    }

    return {
      costContribution: costContribution,
      incomeBracket: label,
      annexLabel: annexKey === "anlage2" ? "Anlage 2" : "Anlage 2a",
      annexUrl: annexKey === "anlage2"
        ? "https://gesetze.berlin.de/bsbe/document/jlr-TagEinrKostBetGBE2010V10Anlage2"
        : "https://gesetze.berlin.de/bsbe/document/jlr-TagEinrKostBetGBE2010V9Anlage2a",
      columnId: columnId,
      columnDescription: column.beschreibung,
      timeRange: column.zeitraum,
      hours: column.stunden,
      isHolidayOnly: !!column.istFerienmodul,
    };
  }

  function formatEuro(amount) {
    return amount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " EUR";
  }

  return {
    init: init,
    isFreeOfCharge: isFreeOfCharge,
    determineAnnex: determineAnnex,
    findIncomeBracket: findIncomeBracket,
    availableModules: availableModules,
    availableGradeLevels: availableGradeLevels,
    calculateCost: calculateCost,
    formatEuro: formatEuro,
  };
})();
