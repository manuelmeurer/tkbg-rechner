var TKBGCalculator = (function () {
  "use strict";

  var data = null;

  var FREE_GRADE_LEVELS = ["1", "2", "3", "eingangsstufe", "unterstufe"];

  // § 3 Abs. 3 TKBG: share of the contribution per child, by number of children in the family
  var SIBLING_SHARES = { 1: 1, 2: 0.8, 3: 0.6, 4: 0.5 };

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

  function incomeBrackets() {
    return data.anlage2.einkommensstufen;
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
      var label = TKBGI18n.translate("gradeLevel", { grade: grade });
      if (grade <= freeUpTo)
        label += TKBGI18n.translate("freeSuffix");
      levels.push({ value: String(grade), label: label });
    }
    return levels;
  }

  // Grade levels of schools and classes with Förderschwerpunkt Geistige Entwicklung, labelled by their i18n key
  function namedGradeLevel(value) {
    var label = TKBGI18n.translate(value);
    if (isFreeOfCharge(value))
      label += TKBGI18n.translate("freeSuffix");
    return { value: value, label: label };
  }

  function availableGradeLevels(schoolType) {
    switch (schoolType) {
      case "offen":
      case "gebunden":
        return gradeLevelRange(1, 6, 3);
      case "foerderschwerpunkt":
        return ["eingangsstufe", "unterstufe", "mittelstufe", "oberstufe", "abschlussstufe", "sekundarstufe"].map(namedGradeLevel);
      case "autismus":
        return gradeLevelRange(1, 10, 3);
      default:
        return [];
    }
  }

  // options.children: number of children in the family (4 = four or more)
  // options.fosterCare: § 3 Abs. 2 TKBG, minimum contribution regardless of income, no sibling discount
  function calculateCost(income, modules, options) {
    var bracket = options.fosterCare ? data.anlage2.einkommensstufen[0] : findIncomeBracket(income);
    var bracketLabel = options.fosterCare
      ? TKBGI18n.translate("minimumBracket")
      : (bracket.bis !== undefined
        ? TKBGI18n.translate("bracketUpTo", { amount: formatEuro(bracket.bis) })
        : TKBGI18n.translate("bracketFrom", { amount: formatEuro(bracket.ab) })) +
        " (" + TKBGI18n.translate("bracketNumber", { number: bracket.nr }) + ")";

    var items = modules.map(function (module) {
      return { module: module, cost: data[module.anlage].einkommensstufen[bracket.nr - 1].kosten[module.spalte - 1] };
    });

    var baseTotal = items.reduce(function (sum, item) { return sum + item.cost; }, 0);
    var siblingShare = options.fosterCare ? 1 : SIBLING_SHARES[Math.min(options.children, 4)];
    // § 3 Abs. 1 TKBG: rounded to full euros
    var total = Math.round(baseTotal * siblingShare);

    return {
      total: total,
      siblingShare: siblingShare,
      incomeBracket: bracketLabel,
      items: items,
    };
  }

  // Contribution of each module booked on its own (same rules and rounding as calculateCost), to list all modules with prices
  function calculateModuleCosts(income, modules, options) {
    var results = modules.map(function (module) {
      return calculateCost(income, [module], options);
    });
    return {
      incomeBracket: results[0].incomeBracket,
      siblingShare: results[0].siblingShare,
      modules: results.map(function (result) {
        return { module: result.items[0].module, total: result.total };
      }),
    };
  }

  function formatEuro(amount) {
    return TKBGI18n.formatNumber(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " EUR";
  }

  return {
    init: init,
    isFreeOfCharge: isFreeOfCharge,
    moduleGroup: moduleGroup,
    incomeBrackets: incomeBrackets,
    findIncomeBracket: findIncomeBracket,
    availableGradeLevels: availableGradeLevels,
    calculateCost: calculateCost,
    calculateModuleCosts: calculateModuleCosts,
    formatEuro: formatEuro,
  };
})();
