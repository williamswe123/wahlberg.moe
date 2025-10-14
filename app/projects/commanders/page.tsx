"use client";

import Image from "next/image";
import { useState } from "react";

type Result = {
  name: string;
  color_identity: string;
  scryfall_uri: string;
  edhrec_url: string | null;
  edhrec_rank: number | null;
  deck_count: number | null;
  type_line: string;
  hipster_score: number;
  image_url?: string | null;
};

export default function Page() {
  const [colors, setColors] = useState("UG");
  const [colorMode, setColorMode] = useState<"exact" | "subset" | "superset" | "any">("exact");
  const [maxDecks, setMaxDecks] = useState(1000);
  const [minRank, setMinRank] = useState<number | "">("");
  const [limit, setLimit] = useState(40);
  const [queryExtra, setQueryExtra] = useState("-is:funny");
  const [sort, setSort] = useState<"decks" | "rank" | "hipster">("decks");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  function toggleColor(ch: string) {
    const order = "WUBRG";
    const set = new Set((colors || "").toUpperCase().split("").filter(Boolean));
    if (set.has(ch)) set.delete(ch);
    else set.add(ch);
    const sorted = Array.from(set)
      .sort((a, b) => order.indexOf(a) - order.indexOf(b))
      .join("");
    setColors(sorted);
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const body = {
        colors: colors.trim() || undefined,
        colorMode,
        maxDecks: Number(maxDecks),
        minRank: minRank === "" ? undefined : Number(minRank),
        limit: Number(limit),
        queryExtra: queryExtra.trim() || undefined,
        sort,
      };

      const r = await fetch("/api/commanders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json.error || `HTTP ${r.status}`);
      setResults(json.results as Result[]);
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Underrated EDH Commanders</h1>
      <p className="text-slate-600">Find underplayed commanders with live EDHREC deck counts.</p>

      <form onSubmit={run} className="grid gap-4 md:grid-cols-3 bg-white p-4 rounded-2xl shadow border">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Color Identity</label>
          <div className="flex gap-2">
            {["W", "U", "B", "R", "G"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleColor(c)}
                className={`px-3 py-1 rounded-full border text-sm ${
                  colors.includes(c) ? "bg-slate-900 text-white" : "bg-white"
                }`}
                aria-pressed={colors.includes(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            className="mt-1 rounded border px-3 py-1 text-sm"
            value={colors}
            onChange={(e) => setColors(e.target.value.toUpperCase().replace(/[^WUBRG]/g, ""))}
            placeholder="WUBRG or empty"
          />
          <div className="flex gap-3 text-sm">
            {(["exact", "subset", "superset", "any"] as const).map((m) => (
              <label key={m} className="flex items-center gap-1">
                <input type="radio" name="mode" checked={colorMode === m} onChange={() => setColorMode(m)} /> {m}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Max Decks (EDHREC live)</label>
          <input
            type="number"
            className="rounded border px-3 py-1"
            value={maxDecks}
            onChange={(e) => setMaxDecks(Number(e.target.value))}
          />
          <label className="text-sm font-medium">Min EDHREC Rank (Scryfall, optional)</label>
          <input
            type="number"
            className="rounded border px-3 py-1"
            value={minRank}
            onChange={(e) => setMinRank(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="e.g. 20000"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Limit</label>
          <input
            type="number"
            className="rounded border px-3 py-1"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
          <label className="text-sm font-medium">Extra Scryfall Query</label>
          <input
            className="rounded border px-3 py-1"
            value={queryExtra}
            onChange={(e) => setQueryExtra(e.target.value)}
            placeholder='e.g. -is:funny t:legendary'
          />
          <label className="text-sm font-medium">Sort</label>
          <select className="rounded border px-3 py-1" value={sort} onChange={(e) => setSort(e.target.value as any)}>
            <option value="decks">Decks (asc)</option>
            <option value="rank">EDHREC Rank (desc)</option>
            <option value="hipster">Hipster heuristic</option>
          </select>
        </div>

        <div className="md:col-span-3 flex items-center gap-3">
          <button disabled={loading} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50">
            {loading ? "Searching…" : "Find commanders"}
          </button>
          {error && <span className="text-red-600 text-sm">{error}</span>}
        </div>
      </form>

      <Results results={results} loading={loading} />
    </div>
  );
}

function Results({ results, loading }: { results: Result[]; loading: boolean }) {
  if (loading) return <div className="text-sm text-slate-600">Fetching Scryfall and EDHREC…</div>;
  if (!results.length) return <div className="text-sm text-slate-500">No results yet. Try a search.</div>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {results.map((r) => (
        <article key={r.name} className="rounded-2xl overflow-hidden border bg-white shadow-sm">
          {r.image_url ? (
            <div className="w-full flex justify-center bg-slate-50">
                {/* Use normal card ratio for clarity */}
                <Image
                src={r.image_url}
                alt={r.name}
                width={488}
                height={680}
                className="rounded-md shadow-sm object-contain"
                priority={false}
                />
            </div>
            ) : (
            <div className="aspect-[63/88] bg-slate-100 flex items-center justify-center text-slate-400">No image</div>
            )}
          <div className="p-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold truncate" title={r.name}>
                {r.name}
              </h3>
              <span className="text-xs rounded-full px-2 py-0.5 border ml-2">{r.color_identity}</span>
            </div>
            {r.type_line && (
              <p className="text-slate-600 text-sm mt-1 truncate" title={r.type_line}>
                {r.type_line}
              </p>
            )}
            <dl className="grid grid-cols-3 gap-2 text-sm mt-3">
              <div>
                <dt className="text-slate-500">Decks</dt>
                <dd className="font-medium">{r.deck_count ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Rank</dt>
                <dd className="font-medium">{r.edhrec_rank ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Hipster</dt>
                <dd className="font-medium">{Math.round(r.hipster_score)}</dd>
              </div>
            </dl>
            <div className="flex gap-3 mt-3 text-sm">
              <a className="underline" href={r.scryfall_uri} target="_blank" rel="noreferrer">
                Scryfall
              </a>
              {r.edhrec_url && (
                <a className="underline" href={r.edhrec_url} target="_blank" rel="noreferrer">
                  EDHREC
                </a>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
