"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Minus,
  Package,
  Plus,
  ReceiptText,
  Search,
  ShoppingCart,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatDateTime, money, moneyCompact, todayKey, units } from "../../lib/format";
import { recordSale, simulateSales, useStore, voidSale } from "../../lib/store";
import {
  EmptyState,
  Field,
  PageHeader,
  Panel,
  PanelHeader,
  SelectField,
  StatCard,
  Toast,
  useToast,
} from "../../components/ui";

export default function SalesPage() {
  const state = useStore();
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const { toast, showToast } = useToast();

  const sales = useMemo(() => state?.sales ?? [], [state]);
  const products = useMemo(
    () => [...(state?.products ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [state],
  );

  const selected =
    products.find((product) => product.id === selectedId) ??
    products.find((product) => product.stock > 0) ??
    products[0] ??
    null;
  const today = todayKey();

  const todaySummary = useMemo(() => {
    const todays = sales.filter((sale) => sale.timestamp.slice(0, 10) === today);
    const revenue = todays.reduce((sum, sale) => sum + sale.total, 0);
    return {
      orders: todays.length,
      revenue,
      units: todays.reduce((sum, sale) => sum + sale.quantity, 0),
      average: todays.length ? revenue / todays.length : 0,
    };
  }, [sales, today]);

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...sales]
      .filter(
        (sale) =>
          !query ||
          sale.productName.toLowerCase().includes(query) ||
          sale.category.toLowerCase().includes(query),
      )
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [sales, search]);

  if (!state) return null;

  const lineTotal = selected ? selected.price * Math.max(0, Number(quantity) || 0) : 0;

  function handleProductChange(event) {
    setSelectedId(event.target.value);
    setQuantity("1");
    setError("");
  }

  function changeQuantity(delta) {
    const max = Math.max(1, selected?.stock ?? 1);
    const current = Math.max(1, Math.floor(Number(quantity) || 1));
    setQuantity(String(Math.min(Math.max(1, current + delta), max)));
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!selected) {
      setError("Choose a product to sell.");
      return;
    }
    const result = recordSale({ productId: selected.id, quantity });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setQuantity("1");
    showToast(`Sold ${result.sale.quantity} × ${result.sale.productName}`);
  }

  function handleSimulate() {
    const result = simulateSales(8);
    if (result.ok) {
      setError("");
      showToast(`${result.count} sales recorded`);
    } else {
      setError(result.error);
    }
  }

  function handleVoid(sale) {
    const result = voidSale(sale.id);
    if (result.ok) {
      showToast(`Voided ${sale.productName} sale`);
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Sales"
        title="Checkout & sales"
        description="Record sales as they happen. Stock and lifetime unit totals update automatically."
      >
        <button
          type="button"
          onClick={handleSimulate}
          className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-2.5 text-xs font-medium text-ink-700 transition hover:bg-white hover:text-ink-900"
        >
          <Sparkles className="h-3.5 w-3.5 text-clay-600" />
          Simulate day of sales
        </button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Revenue today"
          value={moneyCompact(todaySummary.revenue)}
          hint="Completed sales today"
          tone="bg-clay-600/10 text-clay-600"
        />
        <StatCard
          icon={ReceiptText}
          label="Sales today"
          value={units(todaySummary.orders)}
          hint="Checkout transactions"
          tone="bg-sage-600/10 text-sage-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Units today"
          value={units(todaySummary.units)}
          hint="Products sold today"
          tone="bg-amber-500/10 text-amber-700"
        />
        <StatCard
          icon={ShoppingCart}
          label="Avg. order"
          value={money(todaySummary.average)}
          hint="Average sale today"
          tone="bg-indigo-500/10 text-indigo-700"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel>
          <PanelHeader
            title="Record a sale"
            subtitle="Choose a product and quantity to check out."
          />

          {products.length > 0 ? (
            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <SelectField
                id="sale-product"
                label="Product"
                value={selected?.id ?? ""}
                onChange={handleProductChange}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id} disabled={product.stock === 0}>
                    {product.name} — {product.stock} left
                  </option>
                ))}
              </SelectField>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Quantity" htmlFor="sale-quantity">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => changeQuantity(-1)}
                      aria-label="Decrease quantity"
                      className="grid h-9 w-8 shrink-0 place-items-center rounded-lg border border-white/70 bg-white/50 text-ink-700/60 transition hover:bg-white hover:text-ink-900"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      id="sale-quantity"
                      type="number"
                      min="1"
                      max={Math.max(1, selected?.stock ?? 1)}
                      step="1"
                      value={quantity}
                      onChange={(event) => {
                        setQuantity(event.target.value);
                        setError("");
                      }}
                      className="field text-center"
                    />
                    <button
                      type="button"
                      onClick={() => changeQuantity(1)}
                      aria-label="Increase quantity"
                      className="grid h-9 w-8 shrink-0 place-items-center rounded-lg border border-white/70 bg-white/50 text-ink-700/60 transition hover:bg-white hover:text-ink-900"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Field>

                <div>
                  <p className="mb-1.5 text-[10px] font-medium text-ink-700/60">Unit price</p>
                  <div className="rounded-[0.85rem] border border-white/70 bg-white/40 px-3 py-2.5 text-sm font-medium text-ink-900">
                    {selected ? money(selected.price) : "—"}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/60 bg-white/40 px-3.5 py-3">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-700/40">
                    Line total
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink-700/45">
                    {selected
                      ? `${Math.max(0, Math.floor(Number(quantity) || 0))} units · ${selected.stock} in stock`
                      : "No product selected"}
                  </p>
                </div>
                <p className="text-xl font-semibold tracking-tight text-ink-900">
                  {money(lineTotal)}
                </p>
              </div>

              {selected && selected.stock === 0 ? (
                <p className="rounded-lg bg-amber-50/80 px-3 py-2 text-[11px] text-amber-800">
                  This product is sold out. Pick another product or record a purchase.
                </p>
              ) : null}

              {error ? (
                <p role="alert" className="text-[11px] font-medium text-rose-600">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!selected || selected.stock === 0}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-4 py-3 text-xs font-medium text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:bg-ink-900/30"
              >
                <ShoppingCart className="h-4 w-4" />
                Complete sale
              </button>
              <p className="text-center text-[10px] text-ink-700/40">
                Prices are taken from the product record.
              </p>
            </form>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="No products to sell"
                message="Add inventory before recording your first sale."
                icon={Package}
              >
                <Link
                  href="/inventory"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[11px] font-medium text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add product
                </Link>
              </EmptyState>
            </div>
          )}
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Sales history"
            subtitle={`${filteredSales.length} of ${sales.length} transactions`}
            action={
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-700/40" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search sales"
                  aria-label="Search sales"
                  className="field py-2 pl-9 pr-3 text-xs sm:w-44"
                />
              </div>
            }
          />

          {filteredSales.length > 0 ? (
            <div className="mt-4 max-h-[440px] overflow-auto rounded-2xl border border-white/60">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-[#f7f1e7]/95 text-[9px] uppercase tracking-[0.14em] text-ink-700/45 backdrop-blur">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 text-right font-semibold">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold">Unit</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                    <th className="px-4 py-3 text-right font-semibold">Void</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-700/5">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="bg-white/30 transition hover:bg-white/60">
                      <td className="whitespace-nowrap px-4 py-3 text-[11px] text-ink-700/55">
                        {formatDateTime(sale.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/70 text-sm">
                            {products.find((product) => product.id === sale.productId)?.emoji ??
                              "🛒"}
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[180px] truncate text-xs font-medium text-ink-900">
                              {sale.productName}
                            </p>
                            <p className="text-[9px] text-ink-700/40">
                              {sale.category} · Aisle {sale.aisle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-ink-700/70">
                        {sale.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-ink-700/70">
                        {money(sale.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold tabular-nums text-ink-900">
                        {money(sale.total)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleVoid(sale)}
                            aria-label={`Void sale of ${sale.productName}`}
                            title="Void sale and restore stock"
                            className="grid h-7 w-7 place-items-center rounded-lg text-ink-700/35 transition hover:bg-rose-50 hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title={sales.length === 0 ? "No sales yet" : "No sales match"}
                message={
                  sales.length === 0
                    ? "Complete a sale and it will show up here instantly."
                    : "Try searching for another product or category."
                }
              />
            </div>
          )}
        </Panel>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
