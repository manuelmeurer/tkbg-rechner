"use strict";
// Fails once the cost tables haven't been checked against the official sources for too long.
// After checking (see README, "Jährliche Prüfung"), set meta.geprueftAm in kostentabellen.json.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readData } = require("./helper");

const MAX_AGE_DAYS = 365;

test(`cost tables were checked within the last ${MAX_AGE_DAYS} days`, () => {
  const checkedAt = readData().meta.geprueftAm;
  assert.match(checkedAt, /^\d{4}-\d{2}-\d{2}$/);
  const ageDays = (Date.now() - Date.parse(checkedAt)) / 86_400_000;
  assert.ok(ageDays >= -1, `geprueftAm ${checkedAt} lies in the future`);
  assert.ok(
    ageDays <= MAX_AGE_DAYS,
    `Cost tables last checked on ${checkedAt} (${Math.floor(ageDays)} days ago). Run the yearly check from the README and update meta.geprueftAm.`
  );
});
