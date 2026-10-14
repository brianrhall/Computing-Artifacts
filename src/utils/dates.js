// Date inputs give "YYYY-MM-DD". new Date() parses that as UTC midnight,
// which renders as the previous day in any timezone west of UTC.
// Splitting the parts builds the date in local time instead.
export const formatDate = (value, opts) => {
  if (!value) return '';
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', opts);
};

// Long form: "March 15, 2026"
export const formatDateLong = (value) =>
  formatDate(value, { month: 'long', day: 'numeric', year: 'numeric' });

// A start–end pair, with the dash only when there's an end date
export const formatDateRange = (start, end, long = false) => {
  const f = long ? formatDateLong : formatDate;
  if (!start && !end) return '';
  if (!end) return f(start);
  if (!start) return f(end);
  return `${f(start)} - ${f(end)}`;
};