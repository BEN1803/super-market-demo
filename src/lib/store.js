"use client";

import { useSyncExternalStore } from "react";
import { round2 } from "./format";

const STORAGE_KEY = "harvest-market.v3";
const LEGACY_STORAGE_KEY = "harvest-market.v2";
const LEGACY_USD_TO_TSH = 2600;
export const LOW_STOCK_THRESHOLD = 20;

export const CATEGORIES = [
  "Produce",
  "Bakery",
  "Dairy",
  "Meat & Seafood",
  "Pantry",
  "Snacks",
  "Beverages",
  "Frozen",
];

export const AISLES = [1, 2, 3, 4, 5, 6, 7, 8];

export const SUPPLIERS = [
  "Valley Farms",
  "Sunrise Bakery",
  "Coastal Dairy",
  "Highland Meats",
  "Green Fields",
  "Pantry Co.",
  "Frostline Foods",
];

export const CATEGORY_SUPPLIER = {
  Produce: "Valley Farms",
  Bakery: "Sunrise Bakery",
  Dairy: "Coastal Dairy",
  "Meat & Seafood": "Highland Meats",
  Pantry: "Green Fields",
  Snacks: "Pantry Co.",
  Beverages: "Green Fields",
  Frozen: "Frostline Foods",
};

export const CATEGORY_EMOJI = {
  Produce: "🥑",
  Bakery: "🥐",
  Dairy: "🥛",
  "Meat & Seafood": "🍗",
  Pantry: "🫙",
  Snacks: "🍪",
  Beverages: "🧃",
  Frozen: "🧊",
};

const SEED_PRODUCTS = [
  { id: "p-01", name: "Hass Avocados", category: "Produce", aisle: 1, price: 2500, stock: 48, sold: 342, emoji: "🥑" },
  { id: "p-02", name: "Sourdough Loaf", category: "Bakery", aisle: 2, price: 9500, stock: 24, sold: 289, emoji: "🍞" },
  { id: "p-03", name: "Whole Milk · 1L", category: "Dairy", aisle: 3, price: 3200, stock: 64, sold: 512, emoji: "🥛" },
  { id: "p-04", name: "Free-Range Eggs", category: "Dairy", aisle: 3, price: 6500, stock: 38, sold: 401, emoji: "🥚" },
  { id: "p-05", name: "Cold Brew Coffee", category: "Beverages", aisle: 7, price: 12000, stock: 22, sold: 198, emoji: "☕" },
  { id: "p-06", name: "Sea Salt Pretzels", category: "Snacks", aisle: 6, price: 5000, stock: 55, sold: 167, emoji: "🥨" },
  { id: "p-07", name: "Extra Virgin Olive Oil", category: "Pantry", aisle: 5, price: 35000, stock: 14, sold: 96, emoji: "🫒" },
  { id: "p-08", name: "Strawberries · 500g", category: "Produce", aisle: 1, price: 12000, stock: 9, sold: 214, emoji: "🍓" },
  { id: "p-09", name: "Chicken Breast", category: "Meat & Seafood", aisle: 4, price: 18000, stock: 17, sold: 143, emoji: "🍗" },
  { id: "p-10", name: "Vanilla Ice Cream", category: "Frozen", aisle: 8, price: 15000, stock: 31, sold: 88, emoji: "🍨" },
  { id: "p-11", name: "Dark Chocolate 70%", category: "Snacks", aisle: 6, price: 6000, stock: 47, sold: 61, emoji: "🍫" },
  { id: "p-12", name: "Sparkling Water", category: "Beverages", aisle: 7, price: 2000, stock: 72, sold: 356, emoji: "🫧" },
];

// [productId, quantity, daysAgo, hour, minute]
const SEED_SALES = [
  ["p-03", 3, 0, 9, 12],
  ["p-02", 1, 0, 8, 41],
  ["p-08", 2, 0, 10, 5],
  ["p-04", 2, 0, 11, 22],
  ["p-12", 4, 0, 12, 10],
  ["p-01", 3, 0, 13, 35],
  ["p-06", 2, 0, 15, 2],
  ["p-09", 1, 0, 17, 20],
  ["p-10", 1, 0, 18, 45],
  ["p-05", 1, 0, 14, 12],
  ["p-03", 2, 1, 9, 5],
  ["p-04", 1, 1, 10, 18],
  ["p-01", 2, 1, 12, 30],
  ["p-11", 2, 1, 16, 4],
  ["p-07", 1, 1, 17, 50],
  ["p-12", 6, 2, 8, 55],
  ["p-02", 2, 2, 11, 30],
  ["p-03", 4, 2, 18, 15],
  ["p-05", 2, 3, 9, 42],
  ["p-09", 2, 3, 13, 8],
  ["p-08", 2, 3, 15, 25],
  ["p-10", 2, 3, 19, 5],
  ["p-03", 3, 4, 10, 10],
  ["p-01", 4, 4, 14, 45],
  ["p-04", 2, 5, 9, 30],
  ["p-06", 3, 5, 12, 20],
  ["p-12", 2, 5, 17, 40],
  ["p-02", 1, 6, 8, 20],
  ["p-11", 1, 6, 15, 15],
  ["p-03", 2, 6, 18, 30],
  ["p-01", 2, 8, 10, 5],
  ["p-09", 1, 8, 14, 40],
  ["p-12", 3, 9, 11, 12],
  ["p-04", 2, 10, 9, 50],
  ["p-02", 2, 12, 8, 15],
  ["p-05", 1, 13, 16, 5],
  ["p-03", 3, 16, 10, 15],
  ["p-01", 2, 17, 12, 40],
  ["p-04", 2, 18, 9, 20],
  ["p-12", 4, 20, 13, 5],
  ["p-02", 2, 22, 8, 30],
  ["p-09", 1, 24, 16, 45],
  ["p-05", 2, 26, 11, 10],
  ["p-11", 2, 28, 15, 25],
  ["p-08", 1, 29, 10, 50],
];

// [productId, quantity, unitCost, supplier, daysAgo, hour, minute]
const SEED_PURCHASES = [
  ["p-03", 48, 2000, "Coastal Dairy", 1, 8, 10],
  ["p-01", 40, 1600, "Valley Farms", 2, 7, 30],
  ["p-02", 30, 5800, "Sunrise Bakery", 2, 6, 45],
  ["p-06", 36, 3000, "Pantry Co.", 4, 9, 5],
  ["p-09", 24, 12500, "Highland Meats", 5, 7, 55],
  ["p-10", 24, 9000, "Frostline Foods", 8, 10, 20],
  ["p-12", 60, 1200, "Green Fields", 9, 8, 35],
  ["p-07", 18, 24000, "Green Fields", 12, 11, 10],
];

function seedTimestamp(daysAgo, hour, minute) {
  const now = new Date();
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    hour,
    minute,
  );
  return new Date(today - daysAgo * 86_400_000).toISOString();
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createSeedState() {
  const products = SEED_PRODUCTS.map((product) => ({ ...product }));
  const productMap = new Map(products.map((product) => [product.id, product]));

  const sales = SEED_SALES.map(([productId, quantity, daysAgo, hour, minute], index) => {
    const product = productMap.get(productId);
    return {
      id: `seed-sale-${index + 1}`,
      productId,
      productName: product.name,
      category: product.category,
      aisle: product.aisle,
      unitPrice: product.price,
      quantity,
      total: round2(product.price * quantity),
      // Today's demo sales are offset from the current moment so a fresh
      // checkout always appears at the top of the history.
      timestamp:
        daysAgo === 0
          ? new Date(Date.now() - (index + 1) * 22 * 60_000).toISOString()
          : seedTimestamp(daysAgo, hour, minute),
    };
  }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const purchases = SEED_PURCHASES.map(
    ([productId, quantity, unitCost, supplier, daysAgo, hour, minute], index) => {
      const product = productMap.get(productId);
      return {
        id: `seed-purchase-${index + 1}`,
        productId,
        productName: product.name,
        category: product.category,
        aisle: product.aisle,
        supplier,
        unitCost,
        quantity,
        total: round2(unitCost * quantity),
        timestamp: seedTimestamp(daysAgo, hour, minute),
      };
    },
  ).sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return { products, sales, purchases, generatedAt: new Date().toISOString() };
}

const SEED_STATE = createSeedState();
const listeners = new Set();
let stateCache = null;
let rawCache = null;

function migrateLegacyState(state) {
  const toTsh = (value) =>
    Math.round(((Number(value) || 0) * LEGACY_USD_TO_TSH) / 100) * 100;

  return {
    ...state,
    generatedAt: state.generatedAt || new Date().toISOString(),
    products: state.products.map((product) => ({
      ...product,
      price: toTsh(product.price),
    })),
    sales: state.sales.map((sale) => {
      const unitPrice = toTsh(sale.unitPrice);
      return { ...sale, unitPrice, total: unitPrice * sale.quantity };
    }),
    purchases: state.purchases.map((purchase) => {
      const unitCost = toTsh(purchase.unitCost);
      return { ...purchase, unitCost, total: unitCost * purchase.quantity };
    }),
  };
}

function isValidState(value) {
  return (
    value &&
    typeof value === "object" &&
    Array.isArray(value.products) &&
    Array.isArray(value.sales) &&
    Array.isArray(value.purchases)
  );
}

function readState() {
  if (typeof window === "undefined") return SEED_STATE;

  let raw = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }

  if (raw === rawCache && stateCache) return stateCache;
  rawCache = raw;

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (isValidState(parsed)) {
        stateCache = parsed;
        return stateCache;
      }
    } catch {
      // Broken storage — fall back to the demo data.
    }
  }

  if (!raw) {
    let legacyRaw = null;
    try {
      legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    } catch {
      legacyRaw = null;
    }

    if (legacyRaw) {
      try {
        const legacy = JSON.parse(legacyRaw);
        if (isValidState(legacy)) {
          stateCache = migrateLegacyState(legacy);
          return stateCache;
        }
      } catch {
        // Ignore a broken legacy payload and use the demo seed.
      }
    }
  }

  stateCache = SEED_STATE;
  return stateCache;
}

function writeState(next) {
  stateCache = next;
  try {
    rawCache = JSON.stringify(next);
    window.localStorage.setItem(STORAGE_KEY, rawCache);
  } catch {
    rawCache = null;
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);

  function handleStorage(event) {
    if (event.key === STORAGE_KEY || event.key === null) {
      rawCache = null;
      listener();
    }
  }

  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

const getServerSnapshot = () => null;

export function useStore() {
  return useSyncExternalStore(subscribe, readState, getServerSnapshot);
}

export function isLowStock(product) {
  return product.stock <= LOW_STOCK_THRESHOLD;
}

export function addProduct(input) {
  const category = CATEGORIES.includes(input.category) ? input.category : CATEGORIES[0];
  const product = {
    id: makeId("p"),
    name: String(input.name || "").trim(),
    category,
    aisle: Number(input.aisle) || 1,
    price: Math.max(0, Math.round(Number(input.price) || 0)),
    stock: Math.max(0, Math.floor(Number(input.stock) || 0)),
    sold: Math.max(0, Math.floor(Number(input.sold) || 0)),
    emoji: CATEGORY_EMOJI[category] ?? "🛒",
  };

  const state = readState();
  writeState({ ...state, products: [product, ...state.products] });
  return product;
}

export function updateProduct(id, changes) {
  const state = readState();
  writeState({
    ...state,
    products: state.products.map((product) => {
      if (product.id !== id) return product;
      const next = { ...product };
      if (changes.name != null) next.name = String(changes.name).trim();
      if (changes.category && CATEGORIES.includes(changes.category)) {
        next.category = changes.category;
        next.emoji = CATEGORY_EMOJI[changes.category] ?? product.emoji;
      }
      if (changes.aisle != null) next.aisle = Number(changes.aisle) || product.aisle;
      if (changes.price != null) next.price = Math.max(0, Math.round(Number(changes.price) || 0));
      if (changes.stock != null) next.stock = Math.max(0, Math.floor(Number(changes.stock) || 0));
      if (changes.sold != null) next.sold = Math.max(0, Math.floor(Number(changes.sold) || 0));
      return next;
    }),
  });
}

export function deleteProduct(id) {
  const state = readState();
  writeState({
    ...state,
    products: state.products.filter((product) => product.id !== id),
  });
}

export function recordSale({ productId, quantity }) {
  const state = readState();
  const product = state.products.find((item) => item.id === productId);
  const qty = Math.floor(Number(quantity));

  if (!product) return { ok: false, error: "Choose a product to sell." };
  if (!Number.isFinite(qty) || qty < 1) {
    return { ok: false, error: "Quantity must be at least 1." };
  }
  if (qty > product.stock) {
    return { ok: false, error: `Only ${product.stock} left in stock.` };
  }

  const sale = {
    id: makeId("sale"),
    productId: product.id,
    productName: product.name,
    category: product.category,
    aisle: product.aisle,
    unitPrice: product.price,
    quantity: qty,
    total: round2(product.price * qty),
    timestamp: new Date().toISOString(),
  };

  writeState({
    ...state,
    products: state.products.map((item) =>
      item.id === product.id
        ? { ...item, stock: item.stock - qty, sold: item.sold + qty }
        : item,
    ),
    sales: [sale, ...state.sales],
  });

  return { ok: true, sale };
}

export function voidSale(saleId) {
  const state = readState();
  const sale = state.sales.find((item) => item.id === saleId);
  if (!sale) return { ok: false, error: "That sale no longer exists." };

  writeState({
    ...state,
    products: state.products.map((product) =>
      product.id === sale.productId
        ? {
            ...product,
            stock: product.stock + sale.quantity,
            sold: Math.max(0, product.sold - sale.quantity),
          }
        : product,
    ),
    sales: state.sales.filter((item) => item.id !== saleId),
  });

  return { ok: true };
}

export function simulateSales(count = 8) {
  const state = readState();
  const products = state.products.map((product) => ({ ...product }));
  const sales = [...state.sales];
  let created = 0;

  for (let index = 0; index < count; index += 1) {
    const available = products.filter((product) => product.stock > 0);
    if (!available.length) break;

    const product = available[Math.floor(Math.random() * available.length)];
    const quantity = Math.min(product.stock, 1 + Math.floor(Math.random() * 3));
    const productIndex = products.findIndex((item) => item.id === product.id);
    const updated = {
      ...products[productIndex],
      stock: product.stock - quantity,
      sold: product.sold + quantity,
    };
    products[productIndex] = updated;

    sales.push({
      id: makeId("sale"),
      productId: updated.id,
      productName: updated.name,
      category: updated.category,
      aisle: updated.aisle,
      unitPrice: updated.price,
      quantity,
      total: round2(updated.price * quantity),
      timestamp: new Date(Date.now() - created * 30_000).toISOString(),
    });
    created += 1;
  }

  if (!created) return { ok: false, error: "Everything is sold out." };

  sales.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  writeState({ ...state, products, sales });
  return { ok: true, count: created };
}

export function recordPurchase({ productId, quantity, unitCost, supplier }) {
  const state = readState();
  const product = state.products.find((item) => item.id === productId);
  const qty = Math.floor(Number(quantity));
  const cost = Math.round(Number(unitCost) || 0);
  const vendor = String(supplier || "").trim();

  if (!product) return { ok: false, error: "Choose a product to restock." };
  if (!Number.isFinite(qty) || qty < 1) {
    return { ok: false, error: "Quantity must be at least 1." };
  }
  if (!Number.isFinite(cost) || cost < 0) {
    return { ok: false, error: "Enter a valid unit cost." };
  }
  if (!vendor) return { ok: false, error: "Add a supplier name." };

  const purchase = {
    id: makeId("purchase"),
    productId: product.id,
    productName: product.name,
    category: product.category,
    aisle: product.aisle,
    supplier: vendor,
    unitCost: cost,
    quantity: qty,
    total: round2(cost * qty),
    timestamp: new Date().toISOString(),
  };

  writeState({
    ...state,
    products: state.products.map((item) =>
      item.id === product.id ? { ...item, stock: item.stock + qty } : item,
    ),
    purchases: [purchase, ...state.purchases],
  });

  return { ok: true, purchase };
}

export function resetStore() {
  writeState(createSeedState());
}
