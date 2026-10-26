(function () {
  "use strict";

  var EXTERNAL_LINK_ICON = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 1.5L5.5 6.5"/><path d="M7 1.5h3.5V5"/><path d="M10 7.5v3a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-8a.5.5 0 01.5-.5h3"/></svg>';

  var el = {};
  var currentGroup = null;

  async function loadData() {
    try {
      var response = await fetch("data/kostentabellen.json");
      if (!response.ok) throw new Error("HTTP " + response.status);
      var data = await response.json();
      TKBGCalculator.init(data);
      initApp(data);
    } catch (error) {
      console.error("Fehler beim Laden der Kostentabellen:", error);
      document.getElementById("result-empty").innerHTML =
        '<p style="color:#c62828">Fehler beim Laden der Kostentabellen. Bitte Seite neu laden.</p>';
    }
  }

  function initApp(data) {
    el.income = document.getElementById("income");
    el.schoolType = document.getElementById("school-type");
    el.gradeLevel = document.getElementById("grade-level");
    el.moduleContainer = document.getElementById("module-container");
    el.resultEmpty = document.getElementById("result-empty");
    el.freeNotice = document.getElementById("free-notice");
    el.costResult = document.getElementById("cost-result");
    el.monthlyFee = document.getElementById("monthly-fee");
    el.incomeBracketDisplay = document.getElementById("income-bracket-display");
    el.tableDisplay = document.getElementById("table-display");
    el.moduleDisplay = document.getElementById("module-display");
    el.holidayInfo = document.getElementById("holiday-info");

    populateIncomeSelect(data);

    el.schoolType.addEventListener("change", onSchoolTypeChange);
    el.gradeLevel.addEventListener("change", onGradeLevelChange);
    el.income.addEventListener("change", updateResult);
  }

  function populateIncomeSelect(data) {
    var brackets = data.anlage2.einkommensstufen;
    var html = '<option value="">-- Bitte wählen --</option>';

    brackets.forEach(function (bracket) {
      var label;
      if (bracket.bis !== undefined) {
        label = "bis " + formatNumber(bracket.bis) + " \u20AC (monatl. " + formatNumber(bracket.monatlich) + " \u20AC)";
      } else {
        label = "ab " + formatNumber(bracket.ab) + " \u20AC (monatl. " + formatNumber(bracket.monatlich) + " \u20AC)";
      }
      var value = bracket.bis !== undefined ? bracket.bis : bracket.ab;
      html += '<option value="' + value + '">' + label + "</option>";
    });

    el.income.innerHTML = html;
  }

  function formatNumber(num) {
    return num.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function onSchoolTypeChange() {
    var schoolType = el.schoolType.value;

    el.gradeLevel.innerHTML = "";
    el.gradeLevel.disabled = !schoolType;

    if (!schoolType) {
      el.gradeLevel.innerHTML = '<option value="">-- Bitte zuerst Schulform wählen --</option>';
      clearModules();
      showEmptyResult();
      return;
    }

    var grades = TKBGCalculator.availableGradeLevels(schoolType);
    var options = '<option value="">-- Bitte wählen --</option>';
    grades.forEach(function (g) {
      options += '<option value="' + g.value + '">' + g.label + "</option>";
    });
    el.gradeLevel.innerHTML = options;

    clearModules();
    showEmptyResult();
  }

  function onGradeLevelChange() {
    var schoolType = el.schoolType.value;
    var grade = el.gradeLevel.value;

    if (!schoolType || !grade) {
      clearModules();
      showEmptyResult();
      return;
    }

    if (TKBGCalculator.isFreeOfCharge(grade)) {
      clearModules();
      showFreeOfCharge();
      return;
    }

    currentGroup = TKBGCalculator.moduleGroup(schoolType, grade);
    renderModules(currentGroup);
    updateResult();
  }

  function clearModules() {
    currentGroup = null;
    el.moduleContainer.innerHTML = '<p class="help-text">Bitte zuerst Schulform und Jahrgangsstufe wählen.</p>';
  }

  function moduleOption(name, module) {
    var id = "module-" + module.id;
    return '<div class="module-option">' +
      '<input type="radio" name="' + name + '" id="' + id + '" value="' + module.id + '">' +
      '<label for="' + id + '">' +
      '<span class="module-time">' + module.zeitraum + "</span>" +
      '<span class="module-description">' + module.beschreibung + "</span>" +
      "</label>" +
      "</div>";
  }

  function noneOption(name) {
    var id = name + "-none";
    return '<div class="module-option">' +
      '<input type="radio" name="' + name + '" id="' + id + '" value="" checked>' +
      '<label for="' + id + '"><span class="module-time">Keine</span></label>' +
      "</div>";
  }

  function renderModules(group) {
    var regular = group.module.filter(function (module) { return !module.istFerienmodul; });
    var holiday = group.module.filter(function (module) { return module.istFerienmodul; });
    var html = "";

    if (group.ferienKombinierbar) {
      // § 4a Abs. 4 TKBG: holiday modules can be booked exclusively or in addition to school-time modules
      html += '<div class="module-separator">Schulzeit (ohne Ferien)</div>' + noneOption("module-school");
      regular.forEach(function (module) { html += moduleOption("module-school", module); });
      html += '<div class="module-separator">Ferien (zusätzlich oder ausschließlich)</div>' + noneOption("module-holiday");
      holiday.forEach(function (module) { html += moduleOption("module-holiday", module); });
    } else {
      regular.forEach(function (module) { html += moduleOption("module", module); });
      if (holiday.length > 0) {
        html += '<div class="module-separator">Oder: nur Ferienbetreuung</div>';
        holiday.forEach(function (module) { html += moduleOption("module", module); });
      }
    }

    el.moduleContainer.innerHTML = html;

    el.moduleContainer.querySelectorAll('input[type="radio"]').forEach(function (input) {
      input.addEventListener("change", updateResult);
    });
  }

  function getSelectedModules() {
    var ids = Array.prototype.map.call(
      el.moduleContainer.querySelectorAll('input[type="radio"]:checked'),
      function (input) { return input.value; }
    );
    return currentGroup.module.filter(function (module) { return ids.indexOf(module.id) !== -1; });
  }

  function updateResult() {
    var income = parseFloat(el.income.value);
    var schoolType = el.schoolType.value;
    var grade = el.gradeLevel.value;

    if (!income && income !== 0 || !schoolType || !grade) {
      showEmptyResult();
      return;
    }

    if (TKBGCalculator.isFreeOfCharge(grade)) {
      showFreeOfCharge();
      return;
    }

    var modules = getSelectedModules();
    if (modules.length === 0) {
      showEmptyResult();
      return;
    }

    var result = TKBGCalculator.calculateCost(income, modules);
    var showItemCosts = result.items.length > 1;

    el.resultEmpty.classList.add("hidden");
    el.freeNotice.classList.add("hidden");
    el.costResult.classList.remove("hidden");

    el.monthlyFee.textContent = result.total + " EUR";
    el.incomeBracketDisplay.textContent = result.incomeBracket;
    el.moduleDisplay.innerHTML = result.items.map(function (item) {
      return item.module.zeitraum + " (" + item.module.beschreibung + ")" + (showItemCosts ? ": " + item.cost + " EUR" : "");
    }).join("<br>");
    el.tableDisplay.innerHTML = result.items.map(function (item) {
      return '<a href="' + item.annexUrl + '" target="_blank" rel="nofollow noopener">' + item.annexLabel + ", Spalte " + item.column.id + " " + EXTERNAL_LINK_ICON + "</a>";
    }).join("<br>");

    // School-time modules include holiday care, except for Ober-/Abschlussstufe and Jahrgangsstufen 7 bis 10
    var includesHolidays = !currentGroup.ferienKombinierbar && !modules[0].istFerienmodul;
    el.holidayInfo.classList.toggle("hidden", !includesHolidays);
  }

  function showEmptyResult() {
    el.resultEmpty.classList.remove("hidden");
    el.freeNotice.classList.add("hidden");
    el.costResult.classList.add("hidden");
  }

  function showFreeOfCharge() {
    el.resultEmpty.classList.add("hidden");
    el.freeNotice.classList.remove("hidden");
    el.costResult.classList.add("hidden");
  }

  document.addEventListener("DOMContentLoaded", loadData);
})();
