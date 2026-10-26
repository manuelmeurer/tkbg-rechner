"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { load, findModule } = require("./helper");

const de = load("de");
const en = load("en");
const { calculator, data } = de;

const mods = (...ids) => ids.map((id) => findModule(data, id));
const cost = (income, ids, options = {}) =>
  calculator.calculateCost(income, mods(...ids), { children: 1, ...options });

describe("isFreeOfCharge", () => {
  for (const level of ["1", "2", "3", "eingangsstufe", "unterstufe"]) {
    it(`${level} is free`, () => assert.equal(calculator.isFreeOfCharge(level), true));
  }
  for (const level of ["4", "6", "7", "10", "mittelstufe", "oberstufe", "abschlussstufe", "sekundarstufe"]) {
    it(`${level} is not free`, () => assert.equal(calculator.isFreeOfCharge(level), false));
  }
});

describe("findIncomeBracket", () => {
  const cases = [
    [0, 1], [22499.99, 1], [22500, 2], [26339.99, 2], [26340, 3],
    [52259.99, 20], [52260, 21], [81060, 41], [1e6, 41],
  ];
  for (const [income, nr] of cases) {
    it(`${income} -> bracket ${nr}`, () => assert.equal(calculator.findIncomeBracket(income).nr, nr));
  }
});

describe("moduleGroup", () => {
  const g = data.modulgruppen;
  const cases = [
    ["offen", "4", g.offen],
    ["gebunden", "5", g.gebunden],
    ["foerderschwerpunkt", "mittelstufe", g.mittelstufe],
    ["foerderschwerpunkt", "oberstufe", g.oberstufe],
    ["foerderschwerpunkt", "abschlussstufe", g.oberstufe],
    ["foerderschwerpunkt", "sekundarstufe", g.oberstufe],
    ["autismus", "4", g.mittelstufe],
    ["autismus", "6", g.mittelstufe],
    ["autismus", "7", g.oberstufe],
    ["autismus", "10", g.oberstufe],
  ];
  for (const [type, level, expected] of cases) {
    it(`${type} / ${level}`, () => assert.equal(calculator.moduleGroup(type, level), expected));
  }
  it("oberstufe group allows combining with holiday modules", () => {
    assert.equal(calculator.moduleGroup("foerderschwerpunkt", "oberstufe").ferienKombinierbar, true);
  });
});

describe("availableGradeLevels", () => {
  const values = (levels) => Array.from(levels, (l) => l.value);

  for (const type of ["offen", "gebunden"]) {
    it(`${type}: grades 1-6, 1-3 free (de)`, () => {
      const levels = calculator.availableGradeLevels(type);
      assert.deepEqual(values(levels), ["1", "2", "3", "4", "5", "6"]);
      assert.equal(levels[0].label, "Jahrgangsstufe 1 (kostenfrei)");
      assert.equal(levels[2].label, "Jahrgangsstufe 3 (kostenfrei)");
      assert.equal(levels[3].label, "Jahrgangsstufe 4");
    });
  }

  it("English labels differ from German", () => {
    const levels = en.calculator.availableGradeLevels("offen");
    assert.equal(levels[0].label, "Grade 1 (free of charge)");
    assert.equal(levels[3].label, "Grade 4");
  });

  it("autismus: grades 1-10", () => {
    const levels = calculator.availableGradeLevels("autismus");
    assert.deepEqual(values(levels), ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    assert.equal(levels[9].label, "Jahrgangsstufe 10");
  });

  it("foerderschwerpunkt: six named levels", () => {
    const levels = calculator.availableGradeLevels("foerderschwerpunkt");
    assert.deepEqual(values(levels), ["eingangsstufe", "unterstufe", "mittelstufe", "oberstufe", "abschlussstufe", "sekundarstufe"]);
    assert.equal(levels[0].label, "Eingangsstufe (kostenfrei)");
    assert.equal(levels[2].label, "Mittelstufe");
    const enLevels = en.calculator.availableGradeLevels("foerderschwerpunkt");
    assert.match(enLevels[0].label, /entry level.*\(free of charge\)$/);
    assert.notEqual(enLevels[3].label, levels[3].label);
  });

  it("unknown school type: empty", () => {
    assert.deepEqual(values(calculator.availableGradeLevels("xyz")), []);
  });
});

describe("calculateCost", () => {
  it("offen o7 at 52260", () => {
    const r = cost(52260, ["o7"]);
    assert.equal(r.total, 123);
    assert.equal(r.siblingShare, 1);
    assert.equal(r.items.length, 1);
  });

  it("sibling shares", () => {
    assert.equal(cost(52260, ["o7"], { children: 2 }).total, 98);
    assert.equal(cost(52260, ["o7"], { children: 3 }).total, 74);
    assert.equal(cost(52260, ["o7"], { children: 4 }).total, 62);
    assert.equal(cost(52260, ["o7"], { children: 7 }).total, 62);
    assert.equal(cost(52260, ["o7"], { children: 7 }).siblingShare, 0.5);
  });

  it("high income o7", () => assert.equal(cost(90000, ["o7"]).total, 243));
  it("low income o9", () => assert.equal(cost(10000, ["o9"]).total, 3));
  it("gebunden g10 at 26340", () => assert.equal(cost(26340, ["g10"]).total, 6));
  it("GE mittelstufe m2 at 81060", () => assert.equal(cost(81060, ["m2"]).total, 122));
  it("autismus grade 5 m8 at 0", () => {
    assert.equal(calculator.moduleGroup("autismus", "5"), data.modulgruppen.mittelstufe);
    assert.equal(cost(0, ["m8"]).total, 5);
  });

  it("Oberstufe a3 + f16 combine annexes at 81060", () => {
    const r = cost(81060, ["a3", "f16"]);
    assert.equal(r.items.length, 2);
    assert.deepEqual(r.items.map((i) => i.cost), [127, 182]);
    assert.equal(r.total, 309);
  });

  it("foster care: minimum bracket, no sibling discount", () => {
    const r = cost(90000, ["o7"], { fosterCare: true, children: 3 });
    assert.equal(r.total, 20);
    assert.equal(r.siblingShare, 1);
    assert.equal(r.incomeBracket, de.i18n.translate("minimumBracket"));
  });

  it("bracket label (de/en)", () => {
    assert.match(cost(0, ["o7"]).incomeBracket, /^bis .*22\.499,99 EUR \(Stufe 1\)$/);
    assert.match(cost(52260, ["o7"]).incomeBracket, /^ab .*52\.260,00 EUR \(Stufe 21\)$/);
    const r = en.calculator.calculateCost(52260, [findModule(en.data, "o7")], { children: 1 });
    assert.match(r.incomeBracket, /^from 52,260\.00 EUR \(bracket 21\)$/);
  });

});

describe("calculateModuleCosts", () => {
  it("prices every module on its own, with the shared bracket and discount", () => {
    const group = calculator.moduleGroup("offen", "4");
    const costs = calculator.calculateModuleCosts(52260, group.module, { children: 2 });
    assert.equal(costs.siblingShare, 0.8);
    assert.match(costs.incomeBracket, /\(Stufe 21\)$/);
    assert.deepEqual(costs.modules.map((entry) => entry.module.id), group.module.map((module) => module.id));
    assert.deepEqual(
      costs.modules.map((entry) => entry.total),
      group.module.map((module) => cost(52260, [module.id], { children: 2 }).total)
    );
    assert.equal(costs.modules.find((entry) => entry.module.id === "o7").total, 98);
  });
});

describe("formatEuro", () => {
  it("de", () => assert.equal(calculator.formatEuro(1234.5), "1.234,50 EUR"));
  it("en", () => assert.equal(en.calculator.formatEuro(1234.5), "1,234.50 EUR"));
});
