'use client';

import { useEffect, useMemo, useState } from 'react';
import HighScoreBanner from '@/app/ui/HighScoreBanner'; // ⬅️ add this

type UpgradeDefinition = {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  cps: number;
  clickBonus?: number;
};

const UPGRADE_DEFINITIONS: UpgradeDefinition[] = [
  {
    id: 'clicking-glove',
    name: 'Clicking Glove',
    description: 'A comfy glove that makes every click count a little more.',
    baseCost: 15,
    costMultiplier: 1.15,
    cps: 0,
    clickBonus: 1,
  },
  {
    id: 'grandma',
    name: 'Grandma',
    description: 'A kind grandma who bakes cookies while you rest.',
    baseCost: 100,
    costMultiplier: 1.15,
    cps: 2,
  },
  {
    id: 'bakery',
    name: 'Neighborhood Bakery',
    description: 'Staff a small bakery to keep the ovens warm all day long.',
    baseCost: 750,
    costMultiplier: 1.17,
    cps: 10,
  },
  {
    id: 'factory',
    name: 'Cookie Factory',
    description: 'Industrial-scale dough mixers and conveyor belt ovens.',
    baseCost: 5000,
    costMultiplier: 1.2,
    cps: 40,
  },
];

const STORAGE_KEY = 'cookie-clicker-progress-v1';

const INITIAL_OWNERSHIP = Object.fromEntries(
  UPGRADE_DEFINITIONS.map((upgrade) => [upgrade.id, 0]),
) as Record<string, number>;

function formatCookies(value: number) {
  if (value >= 1_000_000) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }
  return value.toFixed(1);
}

function getUpgradeCost(upgrade: UpgradeDefinition, owned: number) {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
}

export default function CookieClickerPage() {
  const [cookies, setCookies] = useState(0);
  const [ownedUpgrades, setOwnedUpgrades] = useState<Record<string, number>>(
    INITIAL_OWNERSHIP,
  );
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored) as {
        cookies?: unknown;
        ownedUpgrades?: unknown;
      };

      if (typeof parsed.cookies === 'number' && Number.isFinite(parsed.cookies)) {
        setCookies(parsed.cookies);
      }

      if (parsed.ownedUpgrades && typeof parsed.ownedUpgrades === 'object') {
        const sanitized: Record<string, number> = { ...INITIAL_OWNERSHIP };
        for (const upgrade of UPGRADE_DEFINITIONS) {
          const value = Number(
            (parsed.ownedUpgrades as Record<string, unknown>)[upgrade.id],
          );
          if (Number.isFinite(value) && value >= 0) {
            sanitized[upgrade.id] = Math.floor(value);
          }
        }
        setOwnedUpgrades(sanitized);
      }
    } catch (error) {
      console.warn('Failed to load Cookie Clicker progress from storage.', error);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  // Derived stats
  const cookiesPerClick = useMemo(
    () =>
      1 +
      UPGRADE_DEFINITIONS.reduce((total, u) => {
        const bonus = u.clickBonus ?? 0;
        return total + bonus * (ownedUpgrades[u.id] ?? 0);
      }, 0),
    [ownedUpgrades],
  );

  const cookiesPerSecond = useMemo(
    () =>
      UPGRADE_DEFINITIONS.reduce((total, u) => {
        const owned = ownedUpgrades[u.id] ?? 0;
        return total + u.cps * owned;
      }, 0),
    [ownedUpgrades],
  );

  // Save to localStorage whenever state changes (after initial load)
  useEffect(() => {
    if (!hasLoaded || typeof window === 'undefined') return;
    try {
      const snapshot = JSON.stringify({ cookies, ownedUpgrades });
      window.localStorage.setItem(STORAGE_KEY, snapshot);
    } catch (error) {
      console.warn('Failed to save Cookie Clicker progress to storage.', error);
    }
  }, [cookies, ownedUpgrades, hasLoaded]);

  // Passive CPS ticker
  useEffect(() => {
    if (cookiesPerSecond <= 0) return;
    const interval = setInterval(() => {
      setCookies((prev) => prev + cookiesPerSecond / 10);
    }, 100);
    return () => clearInterval(interval);
  }, [cookiesPerSecond]);

  // Handlers
  const handleCookieClick = () => {
    setCookies((previous) => previous + cookiesPerClick);
  };

  const handlePurchase = (upgrade: UpgradeDefinition) => {
    const owned = ownedUpgrades[upgrade.id] ?? 0;
    const cost = getUpgradeCost(upgrade, owned);
    if (cookies < cost) return;

    setCookies((previous) => previous - cost);
    setOwnedUpgrades((previous) => ({
      ...previous,
      [upgrade.id]: owned + 1,
    }));
  };

  return (
    <>
      {/* ⬇️ High score banner at the very top */}
      <HighScoreBanner cookies={cookies} />

      <section className="flex flex-col gap-8 lg:flex-row">
        <div className="flex flex-1 flex-col items-center gap-10 rounded-3xl bg-white p-8 text-slate-700 shadow-lg shadow-slate-200">
          <div className="text-center">
            <p className="text-2xl font-semibold text-slate-900">
              Cookies: {formatCookies(cookies)}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {formatCookies(cookiesPerClick)} per click ·{' '}
              {formatCookies(cookiesPerSecond)} per second
            </p>
          </div>

          <button
            type="button"
            onClick={handleCookieClick}
            className="relative flex h-56 w-56 items-center justify-center rounded-full border-4 border-amber-300 bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 shadow-xl shadow-amber-200 transition-transform hover:scale-105 active:scale-95"
            aria-label="Bake more cookies"
          >
            <span className="text-4xl">🍪</span>
          </button>

          <div className="grid w-full gap-4 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-900">Passive production</p>
              <p>{formatCookies(cookiesPerSecond)} cookies / second</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Manual clicking</p>
              <p>{formatCookies(cookiesPerClick)} cookies / click</p>
            </div>
          </div>
        </div>

        <aside className="lg:w-80">
          <div className="sticky top-6 flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-lg shadow-slate-200">
            <header className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">Upgrades</h2>
              <p className="text-sm text-slate-500">
                Invest your cookies to unlock stronger clicks and automated bakers.
              </p>
            </header>

            <ul className="flex flex-col gap-4">
              {UPGRADE_DEFINITIONS.map((upgrade) => {
                const owned = ownedUpgrades[upgrade.id] ?? 0;
                const cost = getUpgradeCost(upgrade, owned);
                const affordable = cookies >= cost;

                return (
                  <li key={upgrade.id}>
                    <button
                      type="button"
                      onClick={() => handlePurchase(upgrade)}
                      disabled={!affordable}
                      className="group w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold text-slate-900">
                            {upgrade.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {upgrade.description}
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                          {owned} owned
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm font-medium text-slate-600">
                        <span className="flex items-center gap-1 text-slate-700">
                          Cost:
                          <span className="text-slate-900">
                            {formatCookies(cost)}
                          </span>
                        </span>
                        <span className="text-slate-500">
                          {upgrade.clickBonus
                            ? `+${formatCookies(upgrade.clickBonus)} / click`
                            : `+${formatCookies(upgrade.cps)} / sec`}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </section>
    </>
  );
}
