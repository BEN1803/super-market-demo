"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { money, moneyCompact, units } from "../../lib/format";
import {
  AISLES,
  CATEGORIES,
  addProduct,
  deleteProduct,
  isLowStock,
  updateProduct,
  useStore,
} from "../../lib/store";
import {
  CompactSelect,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Panel,
  SelectField,
  StatCard,
  StockPill,
  Toast,
  useToast,
} from "../../components/ui";

const EMPTY_FORM = {
  name: "",
  category: CATEGORIES[0],
  aisle: "1",
  price: "",
  stock: "",
  sold: "",
};

export default function InventoryPage() {
  const state = useStore();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [aisleFilter, setAisleFilter] = useState("");
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { toast, showToast } = useToast();

  const stats = useMemo(() => {
    const products = state?.products ?? [];
    return {
      total: products.length,
      stock: products.reduce((sum, product) => sum + product.stock, 0),
      lowStock: products.filter(isLowStock).length,
      value: products.reduce((sum, product) => sum + product.price * product.stock, 0),
      categories: new Set(products.map((product) => product.category)).size,
    };
  }, [state]);

  const filtered = useMemo(() => {
    const products = state?.products ?? [];
    const search = query.trim().toLowerCase();
    return [...products]
      .filter(
        (product) =>
          (!search || product.name.toLowerCase().includes(search)) &&
          (!categoryFilter || product.category === categoryFilter) &&
          (!aisleFilter || String(product.aisle) === aisleFilter),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state, query, categoryFilter, aisleFilter]);

  if (!state) return null;

  function openAdd() {
    setEditor({ mode: "new" });
    setForm(EMPTY_FORM);
    setError("");
  }

  function openEdit(product) {
    setEditor({ mode: "edit", id: product.id });
    setForm({
      name: product.name,
      category: product.category,
      aisle: String(product.aisle),
      price: String(product.price),
      stock: String(product.stock),
      sold: String(product.sold),
    });
    setError("");
  }

  function closeEditor() {
    setEditor(null);
    setError("");
  }

  function updateField(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }));
    setError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!editor) return;

    const name = form.name.trim();
    const price = Number(form.price);
    if (!name) {
      setError("Give the product a name.");
      return;
    }
    if (form.price === "" || !Number.isFinite(price) || price < 0) {
      setError("Enter a valid price for this product.");
      return;
    }

    if (editor.mode === "new") {
      addProduct({
        name,
        category: form.category,
        aisle: Number(form.aisle),
        price,
        stock: Number(form.stock) || 0,
        sold: Number(form.sold) || 0,
      });
      showToast(`Added ${name}`);
    } else {
      updateProduct(editor.id, {
        name,
        category: form.category,
        aisle: Number(form.aisle),
        price,
        stock: Number(form.stock) || 0,
        sold: Number(form.sold) || 0,
      });
      showToast(`Updated ${name}`);
    }

    closeEditor();
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteProduct(deleteTarget.id);
    showToast(`Removed ${deleteTarget.name}`);
    setDeleteTarget(null);
  }

  function clearFilters() {
    setQuery("");
    setCategoryFilter("");
    setAisleFilter("");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Inventory"
        title="Shelf inventory"
        description="Add products, adjust prices and stock, and keep every aisle in shape."
      >
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg shadow-ink-900/10 transition hover:bg-ink-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add product
        </button>
      </PageHeader>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Package}
          label="Products"
          value={stats.total}
          hint={`${stats.categories} active categories`}
          tone="bg-clay-600/10 text-clay-600"
        />
        <StatCard
          icon={Boxes}
          label="Stock on hand"
          value={units(stats.stock)}
          hint="Units across all products"
          tone="bg-sage-600/10 text-sage-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="Low stock"
          value={stats.lowStock}
          hint={stats.lowStock ? "Needs a reorder soon" : "All shelves healthy"}
          tone="bg-rose-500/10 text-rose-600"
        />
        <StatCard
          icon={Wallet}
          label="Stock value"
          value={moneyCompact(stats.value)}
          hint="Retail value on the shelves"
          tone="bg-amber-500/10 text-amber-700"
        />
      </section>

      <Panel>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-serif text-xl text-ink-900">All products</h2>
              <span className="rounded-full bg-clay-600/10 px-2 py-0.5 text-[10px] font-semibold text-clay-700">
                {filtered.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-700/55">
              Edit anything inline through the product dialog.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-700/40" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products"
                aria-label="Search products"
                className="field py-2 pl-9 pr-3 text-xs sm:w-48"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <CompactSelect
                label="Filter by category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="">All categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </CompactSelect>
              <CompactSelect
                label="Filter by aisle"
                value={aisleFilter}
                onChange={(event) => setAisleFilter(event.target.value)}
              >
                <option value="">All aisles</option>
                {AISLES.map((aisle) => (
                  <option key={aisle} value={String(aisle)}>
                    Aisle {aisle}
                  </option>
                ))}
              </CompactSelect>
            </div>
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="mt-5 overflow-x-auto rounded-2xl border border-white/60">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-white/50 text-[9px] uppercase tracking-[0.14em] text-ink-700/45">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Aisle</th>
                  <th className="px-4 py-3 text-right font-semibold">Price</th>
                  <th className="px-4 py-3 text-right font-semibold">Stock</th>
                  <th className="px-4 py-3 text-right font-semibold">Sold</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700/5">
                {filtered.map((product) => (
                  <tr key={product.id} className="bg-white/30 transition hover:bg-white/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-linear-to-br from-[#f6ecdc] to-[#ecdec9] text-base">
                          {product.emoji}
                        </span>
                        <span className="max-w-[220px] truncate text-xs font-semibold text-ink-900">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-700/65">{product.category}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md bg-white/60 px-2 py-1 text-[10px] text-ink-700/60">
                        Aisle {product.aisle}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums text-ink-900">
                      {money(product.price)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums text-ink-700/70">
                      {product.stock}
                    </td>
                    <td className="px-4 py-3 text-right text-xs tabular-nums text-ink-700/70">
                      {units(product.sold)}
                    </td>
                    <td className="px-4 py-3">
                      <StockPill stock={product.stock} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          aria-label={`Edit ${product.name}`}
                          title="Edit product"
                          className="grid h-7 w-7 place-items-center rounded-lg text-ink-700/40 transition hover:bg-white hover:text-clay-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          aria-label={`Delete ${product.name}`}
                          title="Delete product"
                          className="grid h-7 w-7 place-items-center rounded-lg text-ink-700/40 transition hover:bg-rose-50 hover:text-rose-500"
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
          <div className="mt-5">
            <EmptyState
              title={state.products.length === 0 ? "Your shelves are empty" : "No products match"}
              message={
                state.products.length === 0
                  ? "Add your first product to a category and aisle to get started."
                  : "Try another search, category, or aisle."
              }
            >
              {state.products.length > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-[11px] font-medium text-ink-700 transition hover:bg-white"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openAdd}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-4 py-2 text-[11px] font-medium text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add product
                </button>
              )}
            </EmptyState>
          </div>
        )}
      </Panel>

      <Modal
        open={editor !== null}
        title={editor?.mode === "edit" ? "Edit product" : "Add a product"}
        description="Set its category and aisle, then keep price and stock up to date."
        onClose={closeEditor}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Product name" htmlFor="inventory-name">
            <input
              id="inventory-name"
              type="text"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Honey oat granola"
              autoComplete="off"
              maxLength={48}
              autoFocus
              className="field"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              id="inventory-category"
              label="Category"
              value={form.category}
              onChange={(event) => updateField("category", event.target.value)}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="inventory-aisle"
              label="Aisle"
              value={form.aisle}
              onChange={(event) => updateField("aisle", event.target.value)}
            >
              {AISLES.map((aisle) => (
                <option key={aisle} value={String(aisle)}>
                  Aisle {aisle}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <Field label="Price (TSh)" htmlFor="inventory-price">
              <input
                id="inventory-price"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={form.price}
                onChange={(event) => updateField("price", event.target.value)}
                placeholder="0"
                className="field"
              />
            </Field>
            <Field label="Stock" htmlFor="inventory-stock">
              <input
                id="inventory-stock"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) => updateField("stock", event.target.value)}
                placeholder="0"
                className="field"
              />
            </Field>
            <Field label="Sold" htmlFor="inventory-sold">
              <input
                id="inventory-sold"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={form.sold}
                onChange={(event) => updateField("sold", event.target.value)}
                placeholder="0"
                className="field"
              />
            </Field>
          </div>

          {error ? (
            <p role="alert" className="text-[11px] font-medium text-rose-600">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeEditor}
              className="rounded-full border border-white/80 bg-white/60 px-4 py-2.5 text-xs font-medium text-ink-700 transition hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-ink-900 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-ink-700"
            >
              {editor?.mode === "edit" ? "Save changes" : "Add product"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteTarget !== null}
        title="Remove product"
        description="Past sales and purchase records stay in your history."
        onClose={() => setDeleteTarget(null)}
      >
        <p className="text-sm leading-relaxed text-ink-700/70">
          Remove{" "}
          <span className="font-semibold text-ink-900">{deleteTarget?.name}</span> from the
          inventory? This cannot be undone.
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="rounded-full border border-white/80 bg-white/60 px-4 py-2.5 text-xs font-medium text-ink-700 transition hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-rose-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove product
          </button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  );
}
