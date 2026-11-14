export const money = (value) => {
  const amount = Math.round(Number(value) || 0);
  return `TSh ${amount.toLocaleString("en-US")}`;
};

export const moneyCompact = (value) => {
  const amount = Math.round(Number(value) || 0);
  if (Math.abs(amount) >= 1_000_000) {
    return `TSh ${(amount / 1_000_000).toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })}M`;
  }
  return money(amount);
};

export const units = (value) => Number(value || 0).toLocaleString("en-US");

export const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : "—";
}

export function formatDateTime(value) {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : "—";
}

export function formatTime(value) {
  const date = toDate(value);
  return date ? timeFormatter.format(date) : "—";
}

export function dayKey(value) {
  const date = toDate(value);
  return date ? date.toISOString().slice(0, 10) : "";
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
