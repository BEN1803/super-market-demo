"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Boxes,
  Check,
  LayoutDashboard,
  Menu,
  RotateCcw,
  ShoppingBasket,
  ShoppingCart,
  Store,
  Truck,
  X,
} from "lucide-react";
import { isLowStock, resetStore, useStore } from "../lib/store";
import { PageSkeleton } from "./ui";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/purchases", label: "Purchases", icon: Truck },
];

function SidebarContent({ pathname, lowStock, onNavigate, resetState, onReset }) {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-2xl px-1 py-1.5"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-clay-600 to-clay-700 text-white shadow-lg shadow-clay-600/25">
          <ShoppingBasket className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-serif text-lg font-semibold leading-none tracking-tight text-ink-900">
            Harvest &amp; Co.
          </span>
          <span className="mt-1.5 block text-[9px] font-medium uppercase tracking-[0.22em] text-ink-700/45">
            Store manager
          </span>
        </span>
      </Link>

      <nav className="mt-7 space-y-1" aria-label="Primary">
        <p className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-ink-700/35">
          Workspace
        </p>
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                active
                  ? "bg-ink-900 text-white shadow-lg shadow-ink-900/15"
                  : "text-ink-700/65 hover:bg-white/70 hover:text-ink-900"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.8} />
              <span className="truncate">{item.label}</span>
              {item.href === "/inventory" && lowStock > 0 ? (
                <span
                  className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                    active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {lowStock}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2.5 pt-6">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-white/60 bg-white/40 px-3 py-2 text-[10px] text-ink-700/55">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Store open
          </span>
          <span>{lowStock} low stock</span>
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-white/60 bg-white/45 p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-[#e9d8bf] to-[#dbc4a5] text-xs font-semibold text-clay-700">
            AT
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink-900">Alex Turner</p>
            <p className="text-[10px] text-ink-700/45">Store manager</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-medium transition ${
            resetState === "confirm"
              ? "border-rose-200 bg-rose-50 text-rose-600"
              : resetState === "done"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-white/60 bg-white/40 text-ink-700/55 hover:bg-white/80 hover:text-ink-900"
          }`}
        >
          {resetState === "done" ? (
            <Check className="h-3 w-3" />
          ) : (
            <RotateCcw className="h-3 w-3" />
          )}
          {resetState === "confirm"
            ? "Click again to reset"
            : resetState === "done"
              ? "Demo data restored"
              : "Reset demo data"}
        </button>

        <p className="flex items-start gap-1.5 px-1 text-[9px] leading-relaxed text-ink-700/35">
          <Store className="mt-0.5 h-2.5 w-2.5 shrink-0" />
          Mock data is saved locally in this browser.
        </p>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const state = useStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resetState, setResetState] = useState("idle");
  const resetTimer = useRef(null);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  useEffect(() => {
    if (!drawerOpen) return undefined;

    function handleKey(event) {
      if (event.key === "Escape") setDrawerOpen(false);
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [drawerOpen]);

  const lowStock = state ? state.products.filter(isLowStock).length : 0;

  function handleReset() {
    clearTimeout(resetTimer.current);
    if (resetState === "confirm") {
      resetStore();
      setResetState("done");
      resetTimer.current = setTimeout(() => setResetState("idle"), 2200);
    } else {
      setResetState("confirm");
      resetTimer.current = setTimeout(() => setResetState("idle"), 3200);
    }
  }

  return (
    <div className="relative min-h-screen">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#eadbc4]/70 blur-3xl sm:h-[26rem] sm:w-[26rem]" />
        <div className="absolute -right-20 top-24 h-72 w-72 rounded-full bg-[#d6dfcd]/60 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-[#f0e0c8]/60 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/50 bg-[#f7f1e7]/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/70 bg-white/60 text-ink-700 transition hover:bg-white"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-linear-to-br from-clay-600 to-clay-700 text-white">
            <ShoppingBasket className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <span className="truncate font-serif text-base font-semibold text-ink-900">
            Harvest &amp; Co.
          </span>
        </div>
        <span className="rounded-full border border-white/70 bg-white/60 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-ink-700/50">
          Manager
        </span>
      </header>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 w-[17.5rem] max-w-[85vw] border-r border-white/60 bg-[#f8f3ea]/95 shadow-2xl backdrop-blur-2xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full border border-white/70 bg-white/60 text-ink-700/60 transition hover:bg-white hover:text-ink-900"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent
              pathname={pathname}
              lowStock={lowStock}
              onNavigate={() => setDrawerOpen(false)}
              resetState={resetState}
              onReset={handleReset}
            />
          </aside>
        </div>
      ) : null}

      <aside className="fixed inset-y-3 left-3 z-30 hidden w-64 overflow-hidden rounded-[30px] border border-white/70 bg-white/55 shadow-[0_30px_70px_-40px_rgba(88,64,40,0.5)] backdrop-blur-2xl lg:block">
        <SidebarContent
          pathname={pathname}
          lowStock={lowStock}
          onNavigate={undefined}
          resetState={resetState}
          onReset={handleReset}
        />
      </aside>

      <div className="lg:pl-[17.5rem]">
        <main className="mx-auto w-full max-w-6xl px-4 pb-14 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          {state ? children : <PageSkeleton />}

          <footer className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-ink-700/10 pt-5 text-[10px] text-ink-700/40 sm:flex-row">
            <p>Harvest &amp; Co. · Supermarket manager demo</p>
            <p className="flex items-center gap-1.5">
              <Store className="h-3 w-3" />
              Data lives in your browser’s local storage
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
