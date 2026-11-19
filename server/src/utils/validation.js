
const SLOTS = {
  morning: "Morning (fasting)",
  after_breakfast: "After breakfast",
  after_lunch: "After lunch",
  after_dinner: "After dinner",
};

// Format a Date using the server's local calendar date
const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Strict YYYY-MM-DD validation
const isValidDate = (dateString) => {
  if (
    typeof dateString !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
  ) {
    return false;
  }

  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
};

const validateReading = (body) => {
  const { reading_date, slot, value } = body || {};

  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return { error: "Please enter a glucose value." };
  }

  // Accept integer JSON numbers or integer form strings
  const validInteger =
    (typeof value === "number" && Number.isSafeInteger(value)) ||
    (typeof value === "string" &&
      /^\d+$/.test(value.trim()) &&
      Number.isSafeInteger(Number(value.trim())));

  const parsedValue = Number(value);

  if (
    !validInteger ||
    parsedValue < 40 ||
    parsedValue > 600
  ) {
    return {
      error: "Value must be between 40 and 600 mg/dl.",
    };
  }

  if (!isValidDate(reading_date)) {
    return {
      error: "Please enter a valid date (YYYY-MM-DD).",
    };
  }

  const today = formatLocalDate(new Date());

  if (reading_date > today) {
    return {
      error: "Date cannot be in the future.",
    };
  }

  if (!Object.prototype.hasOwnProperty.call(SLOTS, slot)) {
    return {
      error: "Please select a valid time slot.",
    };
  }

  return {
    data: {
      reading_date,
      slot,
      value: parsedValue,
    },
  };
};

module.exports = {
  SLOTS,
  isValidDate,
  formatLocalDate,
  validateReading,
};
