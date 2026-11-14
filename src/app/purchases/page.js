"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ClipboardList,
  Package,
  Search,
  Truck,
  Wallet,
} from "lucide-react";
import { formatDateTime, money, moneyCompact, units } from "../../lib/format";
import {
  CATEGORY_SUPPLIER,
  SUPPLIERS,
  isLowStock,
  recordPurchase,
  useStore,
} from "../../lib/store";
import {
  CompactSelect,
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

const suggestedUnitCost = (price) => Math.round((price * 0.62) / 100) * 100;

export default function PurchasesPage() {
  const state = useStore();
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [error, setError] = useState("");
  const { toast, showToast } = useToast();
  const formRef = useRef(null);

  const products = useMemo(
    () => [...(state?.products ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [state],
  );
  const purchases = useMemo(() => state?.purchases ?? [], [state]);

  const selected = products.find((product) => product.id === selectedId) ?? null;

  const stats = useMemo(() => {
    return {
      spend: purchases.reduce((sum, purchase) => sum + purchase.total, 0),
      units: purchases.reduce((sum, purchase) => sum + purchase.quantity, 0),
      orders: purchases.length,
      lowStock: (state?.products ?? []).filter(isLowStock).length,
    };
  }, [purchases, state]);

  const lowStockProducts = useMemo(
    () =>
      (state?.products ?? [])
        .filter(isLowStock)
        .sort((a, b) => a.stock - b.stock),
    [state],
  );

  const supplierOptions = useMemo(
    () => [...new Set([...SUPPLIERS, ...purchases.map((purchase) => purchase.supplier)])].sort(),
    [purchases],
  );

  const filteredPurchases = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...purchases]
      .filter(
        (purchase) =>
          (!query ||
            purchase.productName.toLowerCase().includes(query) ||
            purchase.supplier.toLowerCase().includes(query)) &&
          (!supplierFilter || purchase.supplier === supplierFilter),
      )
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [purchases, search, supplierFilter]);

  if (!state) return null;

  const purchaseTotal = Math.max(0, Number(quantity) || 0) * Math.max(0, Number(unitCost) || 0);
  const emojiFor = (productId) =>
    products.find((product) => product.id === productId)?.emoji ?? "🛒";

  function handleProductChange(event) {
    const id = event.target.value;
    setSelectedId(id);
    setError("");
    const product = products.find((item) => item.id === id);
    if (product) {
      setSupplier(CATEGORY_SUPPLIER[product.category] ?? "Pantry Co.");
      setUnitCost(String(suggestedUnitCost(product.price)));
    }
  }

  function prefillRestock(product) {
    setSelectedId(product.id);
    setQuantity("24");
    setUnitCost(String(suggestedUnitCost(product.price)));
    setSupplier(CATEGORY_SUPPLIER[product.category] ?? "Pantry Co.");
    setError("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!selected) {
      setError("Choose a product to restock.");
      return;
    }
    const qty = Number(quantity);
    const cost = Number(unitCost);
    if (quantity === "" || !Number.isFinite(qty) || qty < 1) {
      setError("Quantity must be at least 1.");
      return;
    }
    if (unitCost === "" || !Number.isFinite(cost) || cost < 0) {
      setError("Enter a valid unit cost.");
      return;
    }
    if (!supplier.trim()) {
      setError("Add a supplier name.");
      return;
    }

    const result = recordPurchase({
      productId: selected.id,
      quantity: qty,
      unitCost: cost,
      supplier,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setError("");
    setQuantity("");
    showToast(`Received ${result.purchase.quantity} × ${result.purchase.productName}`);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Purchases"
        title="Purchasing & restocking"
        description="Log supplier deliveries and top up stock. Purchase history feeds the supplier and cost view."
      >
        <Link
          href="/inventory"
          className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 px-4 py-2.5 text-xs font-medium text-ink-700 transition hover:bg-white hover:text-ink-900"
        >
          <Package className="h-3.5 w-3.5" />
          Manage inventory
        </Link>
      </PageHeader>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Total spend"
          value={moneyCompact(stats.spend)}
          hint="Recorded purchase orders"
          tone="bg-clay-600/10 text-clay-600"
        />
        <StatCard
          icon={Package}
          label="Units received"
          value={units(stats.units)}
          hint="Restocked across suppliers"
          tone="bg-sage-600/10 text-sage-600"
        />
        <StatCard
          icon={ClipboardList}
          label="Purchase orders"
          value={units(stats.orders)}
          hint="Deliveries on record"
          tone="bg-amber-500/10 text-amber-700"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low stock"
          value={stats.lowStock}
          hint="Products to reorder next"
          tone="bg-rose-500/10 text-rose-600"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div ref={formRef} className="scroll-mt-24">
          <Panel>
            <PanelHeader
              title="New purchase order"
              subtitle="Receiving stock adds units immediately."
            />

            {products.length > 0 ? (
              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <SelectField
                  id="purchase-product"
                  label="Product"
                  value={selectedId}
                  onChange={handleProductChange}
                >
                  <option value="">Choose a product…</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} — {product.stock} in stock
                    </option>
                  ))}
                </SelectField>

                <Field label="Supplier" htmlFor="purchase-supplier">
                  <input
                    id="purchase-supplier"
                    type="text"
                    list="supplier-options"
                    value={supplier}
                    onChange={(event) => {
                      setSupplier(event.target.value);
                      setError("");
                    }}
                    placeholder="Coastal Dairy"
                    autoComplete="off"
                    className="field"
                  />
                  <datalist id="supplier-options">
                    {supplierOptions.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Quantity" htmlFor="purchase-quantity">
                    <input
                      id="purchase-quantity"
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(event) => {
                        setQuantity(event.target.value);
                        setError("");
                      }}
                      placeholder="24"
                      className="field"
                    />
                  </Field>
                  <Field label="Unit cost (TSh)" htmlFor="purchase-cost">
                    <input
                      id="purchase-cost"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      value={unitCost}
                      onChange={(event) => {
                        setUnitCost(event.target.value);
                        setError("");
                      }}
                      placeholder="0"
                      className="field"
                    />
                  </Field>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/60 bg-white/40 px-3.5 py-3">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-700/40">
                      Order total
                    </p>
                    <p className="mt-0.5 text-[10px] text-ink-700/45">
                      {Math.max(0, Math.floor(Number(quantity) || 0))} units ·{" "}
                      {supplier || "No supplier yet"}
                    </p>
                  </div>
                  <p className="text-xl font-semibold tracking-tight text-ink-900">
                    {money(purchaseTotal)}
                  </p>
                </div>

                {error ? (
                  <p role="alert" className="text-[11px] font-medium text-rose-600">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={!selected}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 px-4 py-3 text-xs font-medium text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:bg-ink-900/30"
                >
                  <Truck className="h-4 w-4" />
                  Record purchase
                </button>
                <p className="text-center text-[10px] text-ink-700/40">
                  Stock is updated as soon as the order is recorded.
                </p>
              </form>
            ) : (
              <div className="mt-5">
                <EmptyState
                  title="No products to restock"
                  message="Create inventory items before logging a purchase."
                  icon={Package}
                >
                  <Link
                    href="/inventory"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[11px] font-medium text-white"
                  >
                    <Package className="h-3.5 w-3.5" />
                    Add product
                  </Link>
                </EmptyState>
              </div>
            )}
          </Panel>
        </div>

        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Purchase history"
            subtitle={`${filteredPurchases.length} of ${purchases.length} orders`}
          />

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-700/40" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search product or supplier"
                aria-label="Search purchases"
                className="field py-2 pl-9 pr-3 text-xs sm:w-56"
              />
            </div>
            <div className="sm:w-44">
              <CompactSelect
                label="Filter by supplier"
                value={supplierFilter}
                onChange={(event) => setSupplierFilter(event.target.value)}
              >
                <option value="">All suppliers</option>
                {supplierOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </CompactSelect>
            </div>
          </div>

          {filteredPurchases.length > 0 ? (
            <div className="mt-4 max-h-[440px] overflow-auto rounded-2xl border border-white/60">
              <table className="w-full min-w-[660px] border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-[#f7f1e7]/95 text-[9px] uppercase tracking-[0.14em] text-ink-700/45 backdrop-blur">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold">Supplier</th>
                    <th className="px-4 py-3 text-right font-semibold">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold">Unit cost</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-700/5">
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="bg-white/30 transition hover:bg-white/60">
                      <td className="whitespace-nowrap px-4 py-3 text-[11px] text-ink-700/55">
                        {formatDateTime(purchase.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/70 text-sm">
                            {emojiFor(purchase.productId)}
                          </span>
                          <div className="min-w-0">
                            <p className="max-w-[160px] truncate text-xs font-medium text-ink-900">
                              {purchase.productName}
                            </p>
                            <p className="text-[9px] text-ink-700/40">
                              {purchase.category} · Aisle {purchase.aisle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[150px] truncate px-4 py-3 text-xs text-ink-700/65">
                        {purchase.supplier}
                      </td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-ink-700/70">
                        {purchase.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums text-ink-700/70">
                        {money(purchase.unitCost)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold tabular-nums text-ink-900">
                        {money(purchase.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title={purchases.length === 0 ? "No purchases yet" : "No purchases match"}
                message={
                  purchases.length === 0
                    ? "Record a supplier delivery and it will appear here."
                    : "Try another search term or supplier."
                }
              />
            </div>
          )}
        </Panel>
      </div>

      <Panel>
        <PanelHeader
          title="Reorder suggestions"
          subtitle="Low stock products that are ready to be topped up."
        />
        {lowStockProducts.length > 0 ? (
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-xl border border-white/60 bg-white/40 px-3 py-2.5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/70 text-base">
                  {product.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-ink-900">{product.name}</p>
                  <p className="text-[10px] text-ink-700/45">
                    {product.stock} left · Aisle {product.aisle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => prefillRestock(product)}
                  className="shrink-0 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 text-[10px] font-medium text-clay-700 transition hover:bg-white"
                >
                  Reorder
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-emerald-200/70 bg-emerald-50/40 px-4 py-8 text-center text-xs text-emerald-800/70">
            Every shelf is stocked right now.
          </div>
        )}
      </Panel>

      <Toast toast={toast} />
    </div>
  );
}
