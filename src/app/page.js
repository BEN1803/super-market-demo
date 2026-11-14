"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Package,
  Plus,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import { formatDateTime, money, moneyCompact, units } from "../lib/format";
import { isLowStock, simulateSales, useStore } from "../lib/store";
import {
  EmptyState,
  PageHeader,
  Panel,
  PanelHeader,
  Spotlight,
  StatCard,
  Toast,
  useToast,
} from "../components/ui";

export default function OverviewPage() {
  const state = useStore();
  const { toast, showToast } = useToast();

  const summary = useMemo(() => {
    const products = state?.products ?? [];
    const maxSold = Math.max(1, ...products.map((product) => product.sold));
    const ranked = [...products].sort((a, b) => b.sold - a.sold);
    const categoryMap = new Map();

    products.forEach((product) => {
      const entry = categoryMap.get(product.category) ?? {
        category: product.category,
        units: 0,
        products: 0,
      };
      entry.units += product.sold;
      entry.products += 1;
      categoryMap.set(product.category, entry);
    });

    const categories = [...categoryMap.values()].sort((a, b) => b.units - a.units);
    const sales = [...(state?.sales ?? [])].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
    const purchases = [...(state?.purchases ?? [])].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );

    return {
      totalProducts: products.length,
      totalUnits: products.reduce((sum, product) => sum + product.sold, 0),
      revenue: products.reduce((sum, product) => sum + product.price * product.sold, 0),
      lowStock: products.filter(isLowStock).length,
      categoryCount: categoryMap.size,
      maxSold,
      top: ranked[0] ?? null,
      bottom: ranked.length > 1 ? ranked[ranked.length - 1] : null,
      categories,
      topCategoryUnits: Math.max(1, ...categories.map((category) => category.units)),
      lowStockProducts: products
        .filter(isLowStock)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 4),
      recentSales: sales.slice(0, 4),
      recentPurchases: purchases.slice(0, 4),
      productEmoji: new Map(products.map((product) => [product.id, product.emoji])),
    };
  }, [state]);

  if (!state) return null;

  function handleSimulate() {
    const result = simulateSales(8);
    if (result.ok) {
      showToast(`${result.count} sales recorded`);
    } else {
      showToast(result.error);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Overview"
        title={
          <>
            Good morning, <span className="italic text-clay-600">Alex</span>.
          </>
        }
        description="A live snapshot of your store — sales, stock health, and the latest movement from the shelves."
      >
        <Link
          href="/sales"
          className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg shadow-ink-900/10 transition hover:bg-ink-700"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Record a sale
        </Link>
        <Link
          href="/inventory"
          className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-2.5 text-xs font-medium text-ink-700 transition hover:bg-white hover:text-ink-900"
        >
          <Plus className="h-3.5 w-3.5" />
          Add product
        </Link>
      </PageHeader>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Package}
          label="Products"
          value={summary.totalProducts}
          hint={`${summary.categoryCount} categories in the store`}
          tone="bg-clay-600/10 text-clay-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Units sold"
          value={units(summary.totalUnits)}
          hint="Lifetime units across products"
          tone="bg-sage-600/10 text-sage-600"
        />
        <StatCard
          icon={Wallet}
          label="Revenue"
          value={moneyCompact(summary.revenue)}
          hint="Value of units sold to date"
          tone="bg-amber-500/10 text-amber-700"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low stock"
          value={summary.lowStock}
          hint={summary.lowStock ? "Items need a top-up" : "Every shelf is stocked"}
          tone="bg-rose-500/10 text-rose-600"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Sales performance"
            subtitle={`Ranked by units sold · ${units(summary.totalUnits)} lifetime units`}
            action={
              <button
                type="button"
                onClick={handleSimulate}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/60 px-3.5 py-2 text-[11px] font-medium text-ink-700 transition hover:bg-white hover:text-ink-900 active:scale-[0.98]"
              >
                <Sparkles className="h-3.5 w-3.5 text-clay-600" />
                Simulate sales
              </button>
            }
          />

          {summary.top ? (
            <div className={`mt-5 grid gap-3 ${summary.bottom ? "sm:grid-cols-2" : ""}`}>
              <Spotlight product={summary.top} top />
              {summary.bottom ? <Spotlight product={summary.bottom} /> : null}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="No products yet"
                message="Add your first product to start tracking best and least sellers."
              >
                <Link
                  href="/inventory"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[11px] font-medium text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add a product
                </Link>
              </EmptyState>
            </div>
          )}

          {summary.categories.length > 0 ? (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-700/45">
                  Units by category
                </p>
                <p className="text-[10px] text-ink-700/40">{summary.categoryCount} categories</p>
              </div>
              <ul className="mt-3.5 space-y-3">
                {summary.categories.slice(0, 5).map((category) => (
                  <li key={category.category} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 truncate text-xs text-ink-700/65 sm:w-32">
                      {category.category}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#ece2d3]/80">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-[#d3b795] to-[#8a6a4b]"
                        style={{
                          width: `${Math.max(
                            6,
                            (category.units / summary.topCategoryUnits) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-ink-700/45">
                      {units(category.units)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Panel>

        <Panel>
          <PanelHeader
            title="Low stock"
            subtitle="Reorder before the shelves run empty."
            action={
              <Link
                href="/purchases"
                className="inline-flex items-center gap-1 text-[10px] font-medium text-clay-600 hover:text-clay-700"
              >
                Purchase orders
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />

          {summary.lowStockProducts.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {summary.lowStockProducts.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/40 px-3 py-2.5"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/70 text-base">
                    {product.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink-900">{product.name}</p>
                    <p className="text-[10px] text-ink-700/45">
                      Aisle {product.aisle} · {product.stock} left
                    </p>
                  </div>
                  <Link
                    href="/purchases"
                    aria-label={`Restock ${product.name}`}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-clay-600 transition hover:bg-white/80 hover:text-clay-700"
                  >
                    <Truck className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-emerald-200/70 bg-emerald-50/40 px-4 py-8 text-center text-xs text-emerald-800/70">
              Every shelf is stocked right now.
            </div>
          )}

          <Link
            href="/purchases"
            className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-white/70 bg-white/45 px-3 py-2 text-[10px] font-medium text-ink-700/60 transition hover:bg-white/80 hover:text-ink-900"
          >
            <Truck className="h-3 w-3" />
            Open purchase orders
          </Link>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Recent sales"
            subtitle={`${state.sales.length} transactions on record`}
            action={
              <Link
                href="/sales"
                className="inline-flex items-center gap-1 text-[10px] font-medium text-clay-600 hover:text-clay-700"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          {summary.recentSales.length > 0 ? (
            <ul className="mt-4 divide-y divide-ink-700/5">
              {summary.recentSales.map((sale) => (
                <li key={sale.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/70 text-base">
                    {summary.productEmoji.get(sale.productId) ?? "🛒"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink-900">{sale.productName}</p>
                    <p className="text-[10px] text-ink-700/45">
                      {formatDateTime(sale.timestamp)} · {sale.quantity} units
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-ink-900">{money(sale.total)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-ink-700/15 bg-white/30 px-4 py-8 text-center text-xs text-ink-700/50">
              No sales recorded yet.
            </p>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Recent purchases"
            subtitle={`${state.purchases.length} restock orders on record`}
            action={
              <Link
                href="/purchases"
                className="inline-flex items-center gap-1 text-[10px] font-medium text-clay-600 hover:text-clay-700"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          {summary.recentPurchases.length > 0 ? (
            <ul className="mt-4 divide-y divide-ink-700/5">
              {summary.recentPurchases.map((purchase) => (
                <li key={purchase.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/70 text-base">
                    {summary.productEmoji.get(purchase.productId) ?? "🛒"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink-900">
                      {purchase.productName}
                    </p>
                    <p className="truncate text-[10px] text-ink-700/45">
                      {purchase.supplier} · {purchase.quantity} units
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-ink-900">{money(purchase.total)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-ink-700/15 bg-white/30 px-4 py-8 text-center text-xs text-ink-700/50">
              No purchases recorded yet.
            </p>
          )}
        </Panel>
      </div>

      <Toast toast={toast} />
    </div>
  );
}
