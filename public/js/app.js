(function () {
  "use strict";

  // Query string parameters, shared by the German and English page so links work across languages
  var PARAMS = {
    income: "einkommen",
    children: "kinder",
    fosterCare: "pflege",
    schoolType: "schulform",
    gradeLevel: "stufe",
  };

  // Parameters of earlier versions (module selection, experimental list variant), dropped from incoming links
  var OBSOLETE_PARAMS = ["modul", "tabelle"];

  var COPY_FEEDBACK_DURATION = 2000;

  var el = {};
  var currentGroup = null;
  var incomeSet = false;

  async function fetchJson(path) {
    var response = await fetch(path);
    if (!response.ok)
      throw new Error("HTTP " + response.status);
    return response.json();
  }

  async function loadData() {
    try {
      var data = await fetchJson("/data/kostentabellen.json");
      TKBGCalculator.init(data);
      renderCheckedDate(data.meta.geprueftAm);
      initApp();
    } catch (error) {
      console.error("Fehler beim Laden der Kostentabellen:", error);
      document.getElementById("result-empty").innerHTML =
        '<p class="error-text">' + TKBGI18n.translate("loadError") + "</p>";
    }
  }

  function renderCheckedDate(date) {
    document.getElementById("checked-date").textContent = TKBGI18n.formatDate(date);
    document.getElementById("checked").classList.remove("hidden");
  }

  async function loadUpdates() {
    try {
      renderUpdates(await fetchJson("/data/updates.json"));
    } catch (error) {
      console.error("Fehler beim Laden der Updates:", error);
    }
  }

  // Changelog entries hold trusted HTML (e.g. links), see data/updates.json
  function renderUpdates(updates) {
    document.getElementById("updates-list").innerHTML = updates.map(function (entry) {
      var points = TKBGI18n.localized(entry, "punkte") || [];
      return "<dt>" + TKBGI18n.formatDate(entry.datum) + "</dt><dd>" +
        "<p>" + TKBGI18n.localized(entry, "text") + "</p>" +
        (points.length > 0 ? "<ul>" + points.map(function (point) { return "<li>" + point + "</li>"; }).join("") + "</ul>" : "") +
        "</dd>";
    }).join("");
  }

  function initApp() {
    el.income = document.getElementById("income");
    el.incomeDisplay = document.getElementById("income-display");
    el.children = document.getElementById("children");
    el.fosterCare = document.getElementById("foster-care");
    el.schoolType = document.getElementById("school-type");
    el.gradeLevel = document.getElementById("grade-level");
    el.resultEmpty = document.getElementById("result-empty");
    el.freeNotice = document.getElementById("free-notice");
    el.resultActions = document.getElementById("result-actions");
    el.copyLink = document.getElementById("copy-link");
    el.copyLinkFeedback = document.getElementById("copy-link-feedback");
    el.print = document.getElementById("print");
    el.languageLinks = document.querySelectorAll(".language-switcher a");
    el.moduleList = document.getElementById("module-list");
    el.moduleListBracket = document.getElementById("module-list-bracket");
    el.moduleListDiscount = document.getElementById("module-list-discount");
    el.moduleListContent = document.getElementById("module-list-content");

    el.income.max = TKBGCalculator.incomeBrackets().length;

    el.languageLinks.forEach(function (link) {
      link.dataset.path = link.getAttribute("href");
    });

    el.schoolType.addEventListener("change", onSchoolTypeChange);
    el.gradeLevel.addEventListener("change", onGradeLevelChange);
    el.income.addEventListener("input", onIncomeChange);
    // Clicking the thumb at its initial position fires no input event, but still chooses that bracket
    el.income.addEventListener("pointerup", function () {
      if (!incomeSet)
        onIncomeChange();
    });
    el.children.addEventListener("change", update);
    el.fosterCare.addEventListener("change", onFosterCareChange);
    el.copyLink.addEventListener("click", copyLink);
    el.print.addEventListener("click", function () { window.print(); });
    window.addEventListener("beforeprint", renderPrintSummary);

    restoreState();
  }

  // Updates everything that depends on the form state: result, URL and print summary
  function update() {
    updateResult();
    writeState();
    renderPrintSummary();
  }

  function onIncomeChange() {
    incomeSet = true;
    renderIncomeDisplay();
    update();
  }

  // The slider snaps to the income brackets of the Anlagen; its value is the bracket number
  function selectedBracket() {
    return incomeSet ? TKBGCalculator.incomeBrackets()[parseInt(el.income.value, 10) - 1] : null;
  }

  // Lowest income of the selected bracket, NaN while no income is chosen
  function currentIncome() {
    var bracket = selectedBracket();
    if (!bracket)
      return NaN;
    return bracket.ab === undefined ? 0 : bracket.ab;
  }

  function renderIncomeDisplay() {
    var bracket = selectedBracket();
    el.income.classList.toggle("is-unset", !bracket);
    if (!bracket) {
      el.incomeDisplay.textContent = TKBGI18n.translate("incomePrompt");
      el.income.removeAttribute("aria-valuetext");
      return;
    }

    var brackets = TKBGCalculator.incomeBrackets();
    var next = brackets[bracket.nr];
    var amount = function (number) { return TKBGI18n.formatNumber(number, { maximumFractionDigits: 2 }); };
    var text;
    if (bracket.ab === undefined)
      text = TKBGI18n.translate("incomeUpTo", { to: amount(bracket.bis), monthlyTo: amount(bracket.monatlich) });
    else if (!next)
      text = TKBGI18n.translate("incomeFrom", { from: amount(bracket.ab), monthlyFrom: amount(bracket.monatlich) });
    else
      text = TKBGI18n.translate("incomeRange", {
        from: amount(bracket.ab),
        to: amount(next.ab - 0.01),
        monthlyFrom: amount(bracket.monatlich),
        monthlyTo: amount(next.monatlich),
      });
    el.incomeDisplay.textContent = text;
    el.income.setAttribute("aria-valuetext", text);
  }

  function onFosterCareChange() {
    applyFosterCare();
    update();
  }

  function applyFosterCare() {
    el.income.disabled = el.fosterCare.checked;
    el.children.disabled = el.fosterCare.checked;
  }

  function onSchoolTypeChange() {
    var schoolType = el.schoolType.value;

    el.gradeLevel.innerHTML = "";
    el.gradeLevel.disabled = !schoolType;

    if (!schoolType) {
      el.gradeLevel.innerHTML = '<option value="">' + TKBGI18n.translate("selectSchoolTypeFirst") + "</option>";
      currentGroup = null;
      update();
      return;
    }

    var grades = TKBGCalculator.availableGradeLevels(schoolType);
    var options = '<option value="">' + TKBGI18n.translate("selectPrompt") + "</option>";
    grades.forEach(function (grade) {
      options += '<option value="' + grade.value + '">' + grade.label + "</option>";
    });
    el.gradeLevel.innerHTML = options;

    currentGroup = null;
    update();
  }

  function onGradeLevelChange() {
    var schoolType = el.schoolType.value;
    var grade = el.gradeLevel.value;

    if (!schoolType || !grade || TKBGCalculator.isFreeOfCharge(grade)) {
      currentGroup = null;
      update();
      return;
    }

    currentGroup = TKBGCalculator.moduleGroup(schoolType, grade);
    update();
  }

  function updateResult() {
    var income = currentIncome();
    var fosterCare = el.fosterCare.checked;
    var schoolType = el.schoolType.value;
    var grade = el.gradeLevel.value;

    if (!schoolType || !grade) {
      showEmptyResult();
      return;
    }

    if (TKBGCalculator.isFreeOfCharge(grade)) {
      showFreeOfCharge();
      return;
    }

    if (!fosterCare && !(income >= 0)) {
      showEmptyResult();
      return;
    }

    showModuleList(income, fosterCare);
  }

  function showEmptyResult() {
    el.resultEmpty.classList.remove("hidden");
    el.freeNotice.classList.add("hidden");
    el.moduleList.classList.add("hidden");
    el.resultActions.classList.add("hidden");
  }

  function showFreeOfCharge() {
    el.resultEmpty.classList.add("hidden");
    el.freeNotice.classList.remove("hidden");
    el.moduleList.classList.add("hidden");
    el.resultActions.classList.remove("hidden");
  }

  // All modules of the current group with their prices

  function showModuleList(income, fosterCare) {
    var costs = TKBGCalculator.calculateModuleCosts(income, currentGroup.module, {
      children: parseInt(el.children.value, 10),
      fosterCare: fosterCare,
    });
    var regular = costs.modules.filter(function (entry) { return !entry.module.istFerienmodul; });
    var holiday = costs.modules.filter(function (entry) { return entry.module.istFerienmodul; });
    var combinable = currentGroup.ferienKombinierbar;
    var html = "<h3>" + TKBGI18n.translate("moduleListHeading") + "</h3>" +
      '<p class="price-note">' + TKBGI18n.translate(combinable ? "moduleListCombinable" : "moduleListHolidayIncluded") + "</p>";

    if (combinable)
      html += priceGroupHeading("schoolTimeModules");
    html += priceList(regular);
    if (holiday.length > 0)
      html += priceGroupHeading(combinable ? "holidayModules" : "holidayOnlyModules") + priceList(holiday);

    el.moduleListBracket.textContent = costs.incomeBracket;
    el.moduleListDiscount.textContent = fosterCare
      ? TKBGI18n.translate("fosterCareDiscount")
      : (costs.siblingShare === 1
        ? TKBGI18n.translate("none")
        : TKBGI18n.translate("siblingDiscountShare", { percent: Math.round(costs.siblingShare * 100) }));
    el.moduleListContent.innerHTML = html;

    el.resultEmpty.classList.add("hidden");
    el.freeNotice.classList.add("hidden");
    el.moduleList.classList.remove("hidden");
    el.resultActions.classList.remove("hidden");
  }

  function priceGroupHeading(key) {
    return '<h4 class="price-group">' + TKBGI18n.translate(key) + "</h4>";
  }

  function priceList(entries) {
    return '<ul class="price-list">' + entries.map(function (entry) {
      return '<li class="price-row">' +
        '<div class="price-module">' +
        '<span class="price-description">' + TKBGI18n.localized(entry.module, "beschreibung") + "</span>" +
        '<span class="price-time">' + entry.module.zeitraum.split(" + ").map(function (range) {
          return '<span class="nowrap">' + range + "</span>";
        }).join(" + ") + "</span>" +
        "</div>" +
        '<span class="price-amount">' + TKBGI18n.translate("perMonth", { amount: "<strong>" + entry.total + " EUR</strong>" }) + "</span>" +
        "</li>";
    }).join("") + "</ul>";
  }

  // Shareable links: the form state lives in the query string

  function hasOption(select, value) {
    return Array.prototype.some.call(select.options, function (option) { return option.value === value && value !== ""; });
  }

  function restoreState() {
    var params = new URLSearchParams(window.location.search);
    var income = params.get(PARAMS.income);
    var children = params.get(PARAMS.children);
    var schoolType = params.get(PARAMS.schoolType);
    var gradeLevel = params.get(PARAMS.gradeLevel);

    if (income !== null && /^\d+([.,]\d+)?$/.test(income)) {
      incomeSet = true;
      el.income.value = TKBGCalculator.findIncomeBracket(parseFloat(income.replace(",", "."))).nr;
    }
    renderIncomeDisplay();
    if (hasOption(el.children, children))
      el.children.value = children;
    el.fosterCare.checked = params.get(PARAMS.fosterCare) === "1";
    applyFosterCare();

    if (!hasOption(el.schoolType, schoolType)) {
      update();
      return;
    }
    el.schoolType.value = schoolType;
    onSchoolTypeChange();

    if (!hasOption(el.gradeLevel, gradeLevel))
      return;
    el.gradeLevel.value = gradeLevel;
    onGradeLevelChange();
  }

  function writeState() {
    var params = new URLSearchParams(window.location.search);
    Object.keys(PARAMS).map(function (key) { return PARAMS[key]; }).concat(OBSOLETE_PARAMS).forEach(function (name) {
      params.delete(name);
    });

    if (incomeSet)
      params.set(PARAMS.income, String(currentIncome()));
    if (el.children.value !== "1")
      params.set(PARAMS.children, el.children.value);
    if (el.fosterCare.checked)
      params.set(PARAMS.fosterCare, "1");
    if (el.schoolType.value)
      params.set(PARAMS.schoolType, el.schoolType.value);
    if (el.gradeLevel.value)
      params.set(PARAMS.gradeLevel, el.gradeLevel.value);

    var query = params.toString();
    var search = query ? "?" + query : "";
    history.replaceState(null, "", window.location.pathname + search + window.location.hash);

    el.languageLinks.forEach(function (link) {
      link.href = link.dataset.path + search;
    });
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(function () {
      showCopyFeedback("copied");
    }, function () {
      showCopyFeedback("copyFailed");
    });
  }

  function showCopyFeedback(key) {
    el.copyLinkFeedback.textContent = TKBGI18n.translate(key);
    clearTimeout(showCopyFeedback.timeout);
    showCopyFeedback.timeout = setTimeout(function () {
      el.copyLinkFeedback.textContent = "";
    }, COPY_FEEDBACK_DURATION);
  }

  // Print view: inputs as text, date of calculation and link to reopen it

  function selectedOptionText(select) {
    return select.value ? select.options[select.selectedIndex].text : "–";
  }

  function renderPrintSummary() {
    var fosterCare = el.fosterCare.checked;

    document.getElementById("print-income").textContent = fosterCare
      ? TKBGI18n.translate("notApplicable")
      : (incomeSet ? el.incomeDisplay.textContent : "–");
    document.getElementById("print-children").textContent = fosterCare ? TKBGI18n.translate("notApplicable") : selectedOptionText(el.children);
    document.getElementById("print-foster-care").textContent = TKBGI18n.translate(fosterCare ? "yes" : "no");
    document.getElementById("print-school-type").textContent = selectedOptionText(el.schoolType);
    document.getElementById("print-grade-level").textContent = selectedOptionText(el.gradeLevel);
    document.getElementById("print-date").textContent = TKBGI18n.formatDate(new Date());
    document.getElementById("print-url").textContent = window.location.href;
  }

  document.addEventListener("DOMContentLoaded", loadData);
  document.addEventListener("DOMContentLoaded", loadUpdates);
})();
