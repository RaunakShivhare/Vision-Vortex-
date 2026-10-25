const test = require("node:test");
const assert = require("node:assert/strict");
const { MAX_INT, MAX_WEIGHT, validateDate, validateNumber } = require("../lib/validation");

test("accepts zero and valid optional numeric values", () => {
  assert.equal(validateNumber(0, "Age", { integer: true }), null);
  assert.equal(validateNumber("12.34", "Weight", { max: MAX_WEIGHT, decimalPlaces: 2 }), null);
  assert.equal(validateNumber(undefined, "Age", { integer: true }), null);
});

test("rejects negative, fractional integer, and out-of-range values", () => {
  assert.match(validateNumber(-1, "Age", { integer: true }), /cannot be negative/);
  assert.match(validateNumber("2.5", "Age", { integer: true }), /whole number/);
  assert.match(validateNumber(MAX_INT + 1, "Quantity", { integer: true }), /greater than/);
  assert.match(validateNumber("10000", "Weight", { max: MAX_WEIGHT }), /greater than/);
  assert.match(validateNumber("1.234", "Weight", { max: MAX_WEIGHT, decimalPlaces: 2 }), /decimal places/);
});

test("validates real calendar dates and required values", () => {
  assert.equal(validateDate("2024-02-29", "Date"), null);
  assert.match(validateDate("2025-02-29", "Date"), /valid date/);
  assert.match(validateDate(undefined, "Date", { required: true }), /required/);
});
