"use strict";
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PUBLIC, load } = require("./helper");

// STRINGS is private to i18n.js, so extract the keys per language from the source text.
const source = fs.readFileSync(path.join(PUBLIC, "js", "i18n.js"), "utf8");

function keys(lang) {
  const start = source.indexOf(`    ${lang}: {`);
  assert.notEqual(start, -1, `${lang} block`);
  const end = source.indexOf("\n    },", start);
  const block = source.slice(start, end);
  return [...block.matchAll(/^\s{6}(\w+):/gm)].map((m) => m[1]);
}

describe("i18n", () => {
  const de = keys("de");
  const en = keys("en");

  it("finds keys", () => assert.ok(de.length > 10));
  it("de and en have the same keys", () => {
    assert.deepEqual([...de].sort(), [...en].sort());
  });
  it("no duplicate keys", () => {
    assert.equal(new Set(de).size, de.length);
    assert.equal(new Set(en).size, en.length);
  });

  it("translate works for every key in both languages and replaces placeholders", () => {
    for (const lang of ["de", "en"]) {
      const { i18n } = load(lang);
      const params = new Proxy({}, { get: (_, name) => `<${String(name)}>` });
      for (const key of de) {
        const text = i18n.translate(key, params);
        assert.ok(text.length > 0, `${lang}.${key}`);
        assert.doesNotMatch(text, /\{\w+\}/, `${lang}.${key}`);
      }
    }
  });

  it("language is picked from document lang; unknown falls back to de", () => {
    assert.equal(load("en").i18n.translate("none"), "None");
    assert.equal(load("de").i18n.translate("none"), "Keine");
    assert.equal(load("fr").i18n.translate("none"), "Keine");
  });

  it("localized prefers the English field only on the en page", () => {
    const object = { beschreibung: "Frühbetreuung", beschreibungEn: "Early care" };
    assert.equal(load("en").i18n.localized(object, "beschreibung"), "Early care");
    assert.equal(load("de").i18n.localized(object, "beschreibung"), "Frühbetreuung");
    assert.equal(load("en").i18n.localized({ beschreibung: "x" }, "beschreibung"), "x");
  });

  it("formatNumber uses the locale", () => {
    assert.equal(load("de").i18n.formatNumber(1234.5, { minimumFractionDigits: 2 }), "1.234,50");
    assert.equal(load("en").i18n.formatNumber(1234.5, { minimumFractionDigits: 2 }), "1,234.50");
  });

  it("formatDate accepts ISO date strings as local dates", () => {
    assert.equal(load("de").i18n.formatDate("2026-10-26"), "26.10.2026");
    assert.equal(load("en").i18n.formatDate("2026-03-02"), "2 Mar 2026");
  });
});
