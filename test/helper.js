"use strict";
// Loads the browser scripts (plain globals, no modules) into a vm context.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const PUBLIC = path.join(__dirname, "..", "public");
const DATA_PATH = path.join(PUBLIC, "data", "kostentabellen.json");

function readData() {
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
}

function load(lang = "de") {
  const context = vm.createContext({
    document: { documentElement: { lang } },
    window: {},
    console,
  });
  for (const file of ["i18n.js", "calculator.js"]) {
    const code = fs.readFileSync(path.join(PUBLIC, "js", file), "utf8");
    vm.runInContext(code, context, { filename: file });
  }
  const data = readData();
  const calculator = vm.runInContext("TKBGCalculator", context);
  const i18n = vm.runInContext("TKBGI18n", context);
  calculator.init(data);
  return { calculator, i18n, data };
}

function findModule(data, id) {
  for (const group of Object.values(data.modulgruppen)) {
    const module = group.module.find((m) => m.id === id);
    if (module) return module;
  }
  throw new Error(`Unknown module ${id}`);
}

module.exports = { PUBLIC, readData, load, findModule };
