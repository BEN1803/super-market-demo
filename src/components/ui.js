"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, Package, Sparkles, TrendingDown, Trophy, X } from "lucide-react";
import { units } from "../lib/format";
import { LOW_STOCK_THRESHOLD } from "../lib/store";

export const GLASS =
  "border border-white/70 bg-white/55 shadow-[0_24px_60px_-32px_rgba(88,64,40,0.38)] backdrop-blur-xl";

export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-700/45">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-serif text-[2rem] leading-tight tracking-tight text-ink-900 sm:text-[2.5rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-700/60">{description}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">{children}</div>
      ) : null}
    </div>
  );
}

export function Panel({ className = "", children }) {
  return <section className={`rounded-[28px] p-5 sm:p-6 ${GLASS} ${className}`}>{children}</section>;
}

export function PanelHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-serif text-xl text-ink-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-xs text-ink-700/55">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint, tone }) {
  return (
    <div className={`rounded-3xl p-4 sm:p-5 ${GLASS}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-700/45">
          {label}
        </p>
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-3 text-[1.45rem] font-semibold leading-none tracking-tight text-ink-900 sm:text-2xl">
        {value}
      </p>
      <p className="mt-2 text-[10px] leading-snug text-ink-700/50 sm:text-[11px]">{hint}</p>
    </div>
  );
}

export function Field({ label, htmlFor, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[10px] font-medium text-ink-700/60">
        {label}
      </label>
      {children}
    </div>
  );
}

export function SelectField({ id, label, value, onChange, children, className = "" }) {
  return (
    <Field label={label} htmlFor={id} className={className}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={onChange}
          className="field appearance-none pr-8"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-700/40" />
      </div>
    </Field>
  );
}

export function CompactSelect({ label, value, onChange, children }) {
  return (
    <div className="relative min-w-0">
      <select
        aria-label={label}
        value={value}
        onChange={onChange}
        className="field appearance-none py-2 pl-3 pr-8 text-xs"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-700/40" />
    </div>
  );
}

export function StockPill({ stock }) {
  if (stock === 0) {
    return (
      <span className="inline-flex rounded-full bg-rose-100/80 px-2 py-1 text-[10px] font-medium text-rose-700">
        Out of stock
      </span>
    );
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span className="inline-flex rounded-full bg-amber-100/80 px-2 py-1 text-[10px] font-medium text-amber-800">
        Low · {stock}
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-emerald-100/60 px-2 py-1 text-[10px] font-medium text-emerald-800">
      {stock} in stock
    </span>
  );
}

export function Spotlight({ product, top = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 ${
        top
          ? "border-[#e6d3b7]/80 bg-linear-to-br from-[#f6ecdd]/90 to-white/50"
          : "border-white/70 bg-linear-to-br from-[#ebeee4]/90 to-white/50"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`grid h-7 w-7 place-items-center rounded-full text-white ${
            top ? "bg-clay-600" : "bg-sage-600"
          }`}
        >
          {top ? (
            <Trophy className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} />
          )}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-700/60">
          {top ? "Top seller" : "Least sold"}
        </span>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">
            <span className="mr-1">{product.emoji}</span>
            {product.name}
          </p>
          <p className="mt-1 truncate text-[11px] text-ink-700/60">
            {product.category} · Aisle {product.aisle}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-semibold leading-none tracking-tight text-ink-900">
            {units(product.sold)}
          </p>
          <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.14em] text-ink-700/45">
            units
          </p>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-ink-700/55">
        {top
          ? "Keep it front and centre — it’s flying off the shelf."
          : "Give this one a little love, maybe a spot on the end-cap."}
      </p>
    </div>
  );
}

export function EmptyState({ title, message, icon: Icon = Package, children }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-ink-700/15 bg-white/30 px-6 py-12 text-center">
      <Icon className="h-6 w-6 text-ink-700/30" />
      <p className="mt-3 text-sm font-medium text-ink-900">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-ink-700/55">{message}</p>
      {children}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-hidden="true">
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-white/40" />
        <div className="h-10 w-64 max-w-full rounded-2xl bg-white/50" />
        <div className="h-3 w-80 max-w-full rounded-full bg-white/40" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-28 rounded-3xl border border-white/60 bg-white/40" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 rounded-[28px] border border-white/60 bg-white/40 lg:col-span-2" />
        <div className="h-72 rounded-[28px] border border-white/60 bg-white/40" />
      </div>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const showToast = useCallback((message) => {
    setToast({ message, id: Date.now() });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  return { toast, showToast };
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      key={toast.id}
      className="toast-in pointer-events-none fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 justify-center px-4 sm:left-auto sm:right-7 sm:translate-x-0"
    >
      <div className="flex items-center gap-2 rounded-full border border-white/20 bg-ink-900/90 px-4 py-2.5 text-xs font-medium text-white shadow-[0_18px_40px_-12px_rgba(56,46,36,0.6)] backdrop-blur-xl">
        <Sparkles className="h-3.5 w-3.5 text-[#e6cfaf]" />
        {toast.message}
      </div>
    </div>
  );
}

export function Modal({ open, title, description, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKey(event) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink-900/30 backdrop-blur-sm"
      />
      <div className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-white/70 bg-[#faf6ee]/95 p-5 shadow-[0_40px_80px_-30px_rgba(56,46,36,0.5)] backdrop-blur-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-ink-900">{title}</h2>
            {description ? (
              <p className="mt-1 text-xs leading-relaxed text-ink-700/60">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/70 bg-white/60 text-ink-700/60 transition hover:bg-white hover:text-ink-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function LowStockBadge({ count }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-2 py-1 text-[10px] font-medium text-amber-800">
      <AlertTriangle className="h-3 w-3" />
      {count} low
    </span>
  );
}
