var TKBGCalculator = (function () {
  "use strict";

  var data = null;

  var FREE_GRADE_LEVELS = ["1", "2", "3", "eingangsstufe", "unterstufe"];

  var ANNEXES = {
    anlage2: {
      label: "Anlage 2",
      url: "https://gesetze.berlin.de/bsbe/document/jlr-NNLBE00004DB9NN00000000039",
    },
    anlage2a: {
      label: "Anlage 2a",
      url: "https://gesetze.berlin.de/bsbe/document/jlr-NNLBE00004DB9NN00000000040",
    },
  };

  function init(jsonData) {
    data = jsonData;
  }

  function isFreeOfCharge(gradeLevel) {
    return FREE_GRADE_LEVELS.indexOf(gradeLevel) !== -1;
  }

  // § 4a Abs. 6 TKBG: which module group (and thereby which annex columns) applies.
  function moduleGroupKey(schoolType, gradeLevel) {
    switch (schoolType) {
      case "offen":
      case "gebunden":
        return schoolType;
      case "foerderschwerpunkt":
        return gradeLevel === "mittelstufe" ? "mittelstufe" : "oberstufe";
      case "autismus":
        return parseInt(gradeLevel, 10) <= 6 ? "mittelstufe" : "oberstufe";
      default:
        return null;
    }
  }

  function moduleGroup(schoolType, gradeLevel) {
    return data.modulgruppen[moduleGroupKey(schoolType, gradeLevel)];
  }

  function findIncomeBracket(income) {
    var brackets = data.anlage2.einkommensstufen;
    for (var i = brackets.length - 1; i >= 1; i--) {
      if (income >= brackets[i].ab)
        return brackets[i];
    }
    return brackets[0];
  }

  function gradeLevelRange(from, to, freeUpTo) {
    var levels = [];
    for (var grade = from; grade <= to; grade++) {
      var label = "Jahrgangsstufe " + grade;
      if (grade <= freeUpTo)
        label += " (kostenfrei)";
      levels.push({ value: String(grade), label: label });
    }
    return levels;
  }

  function availableGradeLevels(schoolType) {
    switch (schoolType) {
      case "offen":
      case "gebunden":
        return gradeLevelRange(1, 6, 3);
      case "foerderschwerpunkt":
        return [
          { value: "eingangsstufe", label: "Eingangsstufe (kostenfrei)" },
          { value: "unterstufe", label: "Unterstufe (kostenfrei)" },
          { value: "mittelstufe", label: "Mittelstufe" },
          { value: "oberstufe", label: "Oberstufe" },
          { value: "abschlussstufe", label: "Abschlussstufe" },
          { value: "sekundarstufe", label: "Jahrgangsstufen 7 bis 10 (Sekundarstufe I)" },
        ];
      case "autismus":
        return gradeLevelRange(1, 10, 3);
      default:
        return [];
    }
  }

  function calculateCost(income, modules) {
    var bracket = findIncomeBracket(income);
    var bracketLabel = (bracket.bis !== undefined ? "bis " + formatEuro(bracket.bis) : "ab " + formatEuro(bracket.ab)) +
      " (Stufe " + bracket.nr + ")";

    var items = modules.map(function (module) {
      var annex = data[module.anlage];
      var annexRow = annex.einkommensstufen[bracket.nr - 1];
      return {
        module: module,
        cost: annexRow.kosten[module.spalte - 1],
        column: annex.spalten[module.spalte - 1],
        annexLabel: ANNEXES[module.anlage].label,
        annexUrl: ANNEXES[module.anlage].url,
      };
    });

    return {
      total: items.reduce(function (sum, item) { return sum + item.cost; }, 0),
      incomeBracket: bracketLabel,
      items: items,
    };
  }

  function formatEuro(amount) {
    return amount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " EUR";
  }

  return {
    init: init,
    isFreeOfCharge: isFreeOfCharge,
    moduleGroup: moduleGroup,
    findIncomeBracket: findIncomeBracket,
    availableGradeLevels: availableGradeLevels,
    calculateCost: calculateCost,
    formatEuro: formatEuro,
  };
})();
