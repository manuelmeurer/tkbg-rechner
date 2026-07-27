(function () {
  "use strict";

  var el = {};

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
    el.columnDisplay = document.getElementById("column-display");
    el.moduleDisplay = document.getElementById("module-display");
    el.scopeDisplay = document.getElementById("scope-display");
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

    var modules = TKBGCalculator.availableModules(schoolType, grade);
    renderModules(modules);
    updateResult();
  }

  function clearModules() {
    el.moduleContainer.innerHTML = '<p class="help-text">Bitte zuerst Schulform und Jahrgangsstufe wählen.</p>';
  }

  function renderModules(modules) {
    var regular = modules.filter(function (m) { return !m.istFerienmodul; });
    var holiday = modules.filter(function (m) { return m.istFerienmodul; });

    // All modules as radio buttons in a single group
    var html = "";
    regular.forEach(function (m) {
      html +=
        '<div class="module-option">' +
        '<input type="radio" name="module" id="module-' + m.id + '" value="' + m.id + '">' +
        '<label for="module-' + m.id + '">' +
        '<span class="module-time">' + m.zeitraum + " (" + m.stunden + "h/Tag)</span>" +
        '<span class="module-description">' + m.beschreibung + "</span>" +
        "</label>" +
        "</div>";
    });

    if (holiday.length > 0) {
      html += '<div class="module-separator">Oder: nur Ferienbetreuung</div>';
      holiday.forEach(function (m) {
        html +=
          '<div class="module-option">' +
          '<input type="radio" name="module" id="module-' + m.id + '" value="' + m.id + '">' +
          '<label for="module-' + m.id + '">' +
          '<span class="module-time">' + m.zeitraum + " (" + m.stunden + "h/Tag)</span>" +
          '<span class="module-description">' + m.beschreibung + "</span>" +
          "</label>" +
          "</div>";
      });
    }

    el.moduleContainer.innerHTML = html || '<p class="help-text">Keine Module verfügbar.</p>';

    // Event listeners
    el.moduleContainer.querySelectorAll('input[type="radio"]').forEach(function (input) {
      input.addEventListener("change", updateResult);
    });
  }

  function getSelectedModule() {
    var input = el.moduleContainer.querySelector('input[name="module"]:checked');
    return input ? parseInt(input.value, 10) : null;
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

    var moduleId = getSelectedModule();
    if (!moduleId) {
      showEmptyResult();
      return;
    }

    var annexKey = TKBGCalculator.determineAnnex(schoolType, grade);
    var result = TKBGCalculator.calculateCost(income, annexKey, moduleId);

    // Show main result
    el.resultEmpty.classList.add("hidden");
    el.freeNotice.classList.add("hidden");
    el.costResult.classList.remove("hidden");

    el.monthlyFee.textContent = result.costContribution + " EUR";

    el.incomeBracketDisplay.textContent = result.incomeBracket;
    el.tableDisplay.innerHTML = '<a href="' + result.annexUrl + '" target="_blank" rel="nofollow noopener">' + result.annexLabel + ' <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 1.5L5.5 6.5"/><path d="M7 1.5h3.5V5"/><path d="M10 7.5v3a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-8a.5.5 0 01.5-.5h3"/></svg></a>';
    el.columnDisplay.textContent = "Spalte " + result.columnId;
    el.moduleDisplay.textContent = result.timeRange;
    el.scopeDisplay.textContent = result.hours + "h/Tag (" + result.columnDescription + ")";

    // Show holiday info if this is a regular module (includes Ferienbetreuung)
    if (result.isHolidayOnly) {
      el.holidayInfo.classList.add("hidden");
    } else {
      el.holidayInfo.classList.remove("hidden");
    }
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
