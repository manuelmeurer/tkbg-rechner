"use strict";
// Integrity of the changelog shown in the "Updates" section of both pages.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PUBLIC } = require("./helper");

const updates = JSON.parse(fs.readFileSync(path.join(PUBLIC, "data", "updates.json"), "utf8"));

test("has entries", () => {
  assert.ok(updates.length > 0);
});

test("every entry has a valid date and text in both languages", () => {
  for (const entry of updates) {
    assert.match(entry.datum, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(!Number.isNaN(Date.parse(entry.datum)), entry.datum);
    assert.ok(entry.text && entry.text.trim(), `text missing for ${entry.datum}`);
    assert.ok(entry.textEn && entry.textEn.trim(), `textEn missing for ${entry.datum}`);
  }
});

test("bullet points exist in both languages with the same count", () => {
  for (const entry of updates) {
    const de = entry.punkte || [];
    const en = entry.punkteEn || [];
    assert.equal(de.length, en.length, `bullet count differs for ${entry.datum}`);
    for (const point of [...de, ...en])
      assert.ok(point.trim(), `empty bullet in ${entry.datum}`);
  }
});

test("entries are sorted newest first, without duplicate dates", () => {
  const dates = updates.map((entry) => entry.datum);
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.equal(new Set(dates).size, dates.length);
});
