"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { readData } = require("./helper");

const data = readData();

describe("annex tables", () => {
  for (const [name, columns] of [["anlage2", 10], ["anlage2a", 5]]) {
    describe(name, () => {
      const annex = data[name];
      const rows = annex.einkommensstufen;

      it("has the expected number of columns", () => assert.equal(annex.spalten.length, columns));
      it("has 41 consecutive brackets", () => {
        assert.equal(rows.length, 41);
        rows.forEach((row, i) => assert.equal(row.nr, i + 1));
      });
      it("first bracket has bis 22499.99, the rest ascending ab", () => {
        assert.equal(rows[0].bis, 22499.99);
        let previous = 0;
        for (const row of rows.slice(1)) {
          assert.equal(typeof row.ab, "number", `bracket ${row.nr}`);
          assert.ok(row.ab > previous, `bracket ${row.nr} ab ascending`);
          previous = row.ab;
        }
      });
      it("kosten length equals spalten length", () => {
        for (const row of rows) assert.equal(row.kosten.length, columns, `bracket ${row.nr}`);
      });
      it("costs are positive integers", () => {
        for (const row of rows)
          for (const c of row.kosten) assert.ok(Number.isInteger(c) && c > 0, `bracket ${row.nr}: ${c}`);
      });
      it("costs are non-decreasing down each column", () => {
        for (let col = 0; col < columns; col++)
          for (let i = 1; i < rows.length; i++)
            assert.ok(rows[i].kosten[col] >= rows[i - 1].kosten[col], `column ${col + 1}, bracket ${rows[i].nr}`);
      });
    });
  }

  it("spot checks against the official tables", () => {
    assert.deepEqual(data.anlage2.einkommensstufen[40].kosten, [109, 122, 134, 170, 182, 194, 243, 61, 32, 46]);
    assert.deepEqual(data.anlage2.einkommensstufen[0].kosten, [9, 10, 11, 14, 15, 16, 20, 5, 3, 4]);
    assert.deepEqual(data.anlage2a.einkommensstufen[0].kosten, [7, 7, 10, 2, 3]);
    assert.deepEqual(data.anlage2a.einkommensstufen[40].kosten, [81, 91, 127, 28, 31]);
  });
});

describe("modulgruppen", () => {
  it("has the four groups", () => {
    assert.deepEqual(Object.keys(data.modulgruppen).sort(), ["gebunden", "mittelstufe", "oberstufe", "offen"]);
  });

  for (const [key, group] of Object.entries(data.modulgruppen)) {
    describe(key, () => {
      it("has a description and boolean ferienKombinierbar", () => {
        assert.ok(group.beschreibung);
        assert.equal(typeof group.ferienKombinierbar, "boolean");
      });
      it("has unique module ids", () => {
        const ids = group.module.map((m) => m.id);
        assert.equal(new Set(ids).size, ids.length);
      });
      for (const m of group.module) {
        it(`module ${m.id} is valid`, () => {
          assert.ok(["anlage2", "anlage2a"].includes(m.anlage), "anlage");
          assert.ok(Number.isInteger(m.spalte) && m.spalte >= 1 && m.spalte <= data[m.anlage].spalten.length, "spalte in range");
          assert.ok(m.beschreibung && m.beschreibung.trim(), "beschreibung");
          assert.ok(m.beschreibungEn && m.beschreibungEn.trim(), "beschreibungEn");
          assert.equal(typeof m.istFerienmodul, "boolean");
        });
      }
    });
  }
});
