"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatDate, money, moneyCompact, units } from "../../lib/format";
import { isLowStock, useStore } from "../../lib/store";
import {
  EmptyState,
  PageHeader,
  Panel,
  PanelHeader,
  Spotlight,
  StatCard,
} from "../../components/ui";

const RANGES = [7, 14, 30];

export default function AnalyticsPage() {
  const state = useStore();
  const [range, setRange] = useState(7);

  const analytics = useMemo(() => {
    const products = state?.products ?? [];
    const sales = state?.sales ?? [];
    const anchorIso = sales.reduce(
      (latest, sale) => (sale.timestamp > latest ? sale.timestamp : latest),
      sales[0]?.timestamp ?? state?.generatedAt ?? "1970-01-01T00:00:00.000Z",
    );
    const anchor = new Date(anchorIso);
    const anchorDate = Number.isNaN(anchor.getTime()) ? new Date(0) : anchor;
    const anchorDay = Date.UTC(
      anchorDate.getUTCFullYear(),
      anchorDate.getUTCMonth(),
      anchorDate.getUTCDate(),
    );
    const windowStart = anchorDay - (range - 1) * 86_400_000;

    const rangeSales = sales.filter((sale) => {
      const time = new Date(sale.timestamp).getTime();
      return time >= windowStart;
    });

    const rangeRevenue = rangeSales.reduce((sum, sale) => sum + sale.total, 0);
    const rangeOrders = rangeSales.length;
    const rangeUnits = rangeSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const avgSale = rangeOrders ? rangeRevenue / rangeOrders : 0;

    const revenueByCategory = new Map();
    products.forEach((product) => {
      const entry = revenueByCategory.get(product.category) ?? {
        category: product.category,
        revenue: 0,
        units: 0,
        products: 0,
      };
      entry.revenue += product.price * product.sold;
      entry.units += product.sold;
      entry.products += 1;
      revenueByCategory.set(product.category, entry);
    });
    const categories = [...revenueByCategory.values()].sort((a, b) => b.revenue - a.revenue);
    const maxCategoryRevenue = Math.max(1, ...categories.map((category) => category.revenue));

    const aisleMap = new Map();
    products.forEach((product) => {
      const entry = aisleMap.get(product.aisle) ?? {
        aisle: product.aisle,
        units: 0,
        stock: 0,
        revenue: 0,
        products: 0,
      };
      entry.units += product.sold;
      entry.stock += product.stock;
      entry.revenue += product.price * product.sold;
      entry.products += 1;
      aisleMap.set(product.aisle, entry);
    });
    const aisles = [...aisleMap.values()].sort((a, b) => b.units - a.units);

    const dayMap = new Map();
    for (let offset = range - 1; offset >= 0; offset -= 1) {
      const date = new Date(anchorDay - offset * 86_400_000);
      const key = date.toISOString().slice(0, 10);
      dayMap.set(key, {
        day: key,
        label: formatDate(date.toISOString()),
        revenue: 0,
        orders: 0,
      });
    }
    rangeSales.forEach((sale) => {
      const bucket = dayMap.get(sale.timestamp.slice(0, 10));
      if (bucket) {
        bucket.revenue += sale.total;
        bucket.orders += 1;
      }
    });
    const dailyPoints = [...dayMap.values()];
    const bestDay = dailyPoints.reduce(
      (best, point) => (point.revenue > best.revenue ? point : best),
      dailyPoints[0],
    );

    const ranked = [...products].sort((a, b) => b.sold - a.sold);

    return {
      totalRevenue: products.reduce((sum, product) => sum + product.price * product.sold, 0),
      totalUnits: products.reduce((sum, product) => sum + product.sold, 0),
      lowStock: products.filter(isLowStock).length,
      rangeRevenue,
      rangeOrders,
      rangeUnits,
      avgSale,
      categories,
      maxCategoryRevenue,
      aisles,
      dailyPoints,
      bestDay,
      top: ranked[0] ?? null,
      bottom: ranked.length > 1 ? ranked[ranked.length - 1] : null,
    };
  }, [state, range]);

  if (!state) return null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Analytics"
        title="Store analytics"
        description="See what sells, where it sells, and how revenue is trending across the floor."
      >
        <div className="flex items-center gap-1 rounded-full border border-white/70 bg-white/50 p-1">
          {RANGES.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRange(days)}
              aria-pressed={range === days}
              className={`rounded-full px-3.5 py-1.5 text-[11px] font-medium transition ${
                range === days
                  ? "bg-ink-900 text-white shadow-sm"
                  : "text-ink-700/55 hover:bg-white/70 hover:text-ink-900"
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </PageHeader>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Lifetime revenue"
          value={moneyCompact(analytics.totalRevenue)}
          hint="Product sales value to date"
          tone="bg-clay-600/10 text-clay-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Units sold"
          value={units(analytics.totalUnits)}
          hint="Lifetime units across products"
          tone="bg-sage-600/10 text-sage-600"
        />
        <StatCard
          icon={ShoppingCart}
          label="Avg. sale"
          value={money(analytics.avgSale)}
          hint={`Last ${range} days · ${units(analytics.rangeOrders)} sales`}
          tone="bg-amber-500/10 text-amber-700"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low stock"
          value={analytics.lowStock}
          hint="Products needing a top-up"
          tone="bg-rose-500/10 text-rose-600"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Revenue trend"
            subtitle={`Last ${range} days · ${money(analytics.rangeRevenue)} from ${units(
              analytics.rangeOrders,
            )} sales`}
          />
          <div className="mt-5">
            <RevenueChart points={analytics.dailyPoints} range={range} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink-700/5 pt-3 text-[10px] text-ink-700/45">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-clay-500" />
              Daily revenue
            </span>
            <span>
              {units(analytics.rangeUnits)} units sold in this period
            </span>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Sales leaders" subtitle="Lifetime units sold." />
          {analytics.top ? (
            <div className="mt-4 space-y-3">
              <Spotlight product={analytics.top} top />
              {analytics.bottom ? <Spotlight product={analytics.bottom} /> : null}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-ink-700/15 bg-white/30 px-4 py-8 text-center text-xs text-ink-700/50">
              Add products to see seller rankings.
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/60 bg-white/40 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-700/40">
                Best day
              </p>
              <p className="mt-1.5 text-xs font-semibold text-ink-900">
                {analytics.bestDay?.label ?? "—"}
              </p>
              <p className="text-[10px] text-ink-700/45">
                {money(analytics.bestDay?.revenue ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/40 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-700/40">
                Avg. sale
              </p>
              <p className="mt-1.5 text-xs font-semibold text-ink-900">
                {money(analytics.avgSale)}
              </p>
              <p className="text-[10px] text-ink-700/45">Last {range} days</p>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Revenue by category"
            subtitle="Lifetime sales value, ranked by category."
          />
          {analytics.categories.length > 0 ? (
            <ul className="mt-5 space-y-3.5">
              {analytics.categories.map((category) => (
                <li key={category.category} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 truncate text-xs text-ink-700/70 sm:w-32">
                    {category.category}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#ece2d3]/80">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-[#d3b795] to-[#8a6a4b]"
                      style={{
                        width: `${Math.max(
                          4,
                          (category.revenue / analytics.maxCategoryRevenue) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-[11px] tabular-nums text-ink-700/50">
                    {moneyCompact(category.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="No category data"
                message="Add products to start building revenue insights."
              />
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Aisle performance"
            subtitle="Units sold and stock by aisle."
          />
          {analytics.aisles.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {analytics.aisles.map((aisle) => (
                <li
                  key={aisle.aisle}
                  className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/40 px-3 py-2.5"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-clay-600/10 text-[10px] font-semibold text-clay-700">
                    {String(aisle.aisle).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-ink-900">Aisle {aisle.aisle}</p>
                    <p className="text-[10px] text-ink-700/45">
                      {aisle.products} products · {aisle.stock} in stock
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-ink-900">
                      {units(aisle.units)} units
                    </p>
                    <p className="text-[10px] text-ink-700/45">{moneyCompact(aisle.revenue)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5">
              <EmptyState title="No aisle data" message="Aisle insights appear once products exist." />
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function RevenueChart({ points, range }) {
  const width = 760;
  const height = 280;
  const padding = { top: 20, right: 14, bottom: 32, left: 14 };
  const max = Math.max(1, ...points.map((point) => point.revenue));
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const step = points.length > 1 ? innerWidth / (points.length - 1) : 0;

  const coordinates = points.map((point, index) => ({
    ...point,
    x: padding.left + index * step,
    y: padding.top + (1 - point.revenue / max) * innerHeight,
  }));

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${coordinates[coordinates.length - 1].x.toFixed(1)},${
    height - padding.bottom
  } L${padding.left},${height - padding.bottom} Z`;
  const labelEvery = Math.max(1, Math.ceil(points.length / 7));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Daily revenue for the last ${range} days`}
      className="h-auto w-full"
    >
      <title>{`Daily revenue for the last ${range} days`}</title>
      <defs>
        <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a6a4b" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#8a6a4b" stopOpacity="0" />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75, 1].map((fraction) => {
        const y = padding.top + (1 - fraction) * innerHeight;
        return (
          <line
            key={fraction}
            x1={padding.left}
            x2={width - padding.right}
            y1={y}
            y2={y}
            stroke="#e6d9c7"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        );
      })}

      <path d={areaPath} fill="url(#revenue-fill)" />
      <path
        d={linePath}
        fill="none"
        stroke="#8a6a4b"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {coordinates.map((point) => (
        <circle
          key={point.day}
          cx={point.x}
          cy={point.y}
          r="3"
          fill="#faf6ee"
          stroke="#8a6a4b"
          strokeWidth="1.5"
        />
      ))}

      {coordinates.map((point, index) =>
        index % labelEvery === 0 || index === coordinates.length - 1 ? (
          <text
            key={`label-${point.day}`}
            x={point.x}
            y={height - 10}
            textAnchor={
              index === 0 ? "start" : index === coordinates.length - 1 ? "end" : "middle"
            }
            fontSize="10"
            fill="#8a7a68"
          >
            {point.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}
