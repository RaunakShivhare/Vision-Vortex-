const MAX_INT = 2147483647;
const MAX_WEIGHT = 9999.99;

function validateNumber(value, label, { required = false, integer = false, max = MAX_INT, decimalPlaces = Infinity } = {}) {
  if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
    return required ? `${label} is required` : null;
  }

  if (typeof value !== "number" && typeof value !== "string") {
    return `${label} must be a valid number`;
  }

  const text = String(value).trim();
  if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(text)) {
    return `${label} must be a valid non-negative number`;
  }

  const number = Number(text);
  if (!Number.isFinite(number) || number < 0) {
    return `${label} cannot be negative`;
  }
  if (integer && !Number.isInteger(number)) {
    return `${label} must be a whole number`;
  }
  if (number > max) {
    return `${label} cannot be greater than ${max}`;
  }
  if (text.includes(".") && text.split(".")[1].length > decimalPlaces) {
    return `${label} cannot have more than ${decimalPlaces} decimal places`;
  }
  return null;
}

function validateDate(value, label, { required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    return required ? `${label} is required` : null;
  }
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${label} must be a valid date`;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? `${label} must be a valid date`
    : null;
}

module.exports = { MAX_INT, MAX_WEIGHT, validateNumber, validateDate };
