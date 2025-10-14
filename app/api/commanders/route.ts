import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { z } from "zod";

const SCRYFALL_SEARCH = "https://api.scryfall.com/cards/search";
const EDHREC_BASE = "https://edhrec.com";
const UA = "wahlberg-underrated-cmdr/1.0 (contact: example@example.com)";

// simple in-memory cache for EDHREC lookups (process lifetime)
const edhCache = new Map<string, { url: string; deck_count: number | null; ts: number }>();
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const BodySchema = z.object({
  colors: z.string().optional(), // e.g. "UG"
  colorMode: z.enum(["exact", "subset", "superset", "any"]).default("exact"),
  maxDecks: z.number().int().min(1).max(1_000_000).default(2000),
  minRank: z.number().int().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  queryExtra: z.string().optional(),
  sort: z.enum(["decks", "rank", "hipster"]).default("decks"),
});

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function colorIdentityStr(ci?: string[]) {
  return (ci && ci.join("")) || "C";
}

function idClause(
  colors?: string,
  mode: "exact" | "subset" | "superset" | "any" = "exact",
) {
  if (!colors || mode === "any") return "";
  const c = colors.toUpperCase().replace(/[^WUBRG]/g, "");
  if (!c) return "";
  if (mode === "exact") return ` id=${c}`;
  if (mode === "subset") return ` id<=${c}`;
  if (mode === "superset") return ` id>=${c}`;
  return "";
}

function pickImageUrl(c: any): string | null {
  // FULL card image (frame + text), not art crop.
  if (c?.image_uris) {
    return (
      c.image_uris.png ||      // highest quality (largest)
      c.image_uris.large ||    // 672×936
      c.image_uris.normal ||   // 488×680
      null
    );
  }
  if (Array.isArray(c?.card_faces) && c.card_faces[0]?.image_uris) {
    const iu = c.card_faces[0].image_uris;
    return iu.png || iu.large || iu.normal || null;
  }
  return null;
}


async function fetchScryfall(args: {
  colors?: string;
  colorMode: "exact" | "subset" | "superset" | "any";
  queryExtra?: string;
}) {
  let q = `is:commander legal:commander${idClause(args.colors, args.colorMode)}`;
  if (args.queryExtra && args.queryExtra.trim()) q += ` ${args.queryExtra.trim()}`;

  const params = new URLSearchParams({
    q,
    order: "edhrec",
    dir: "desc", // less popular first
    unique: "cards",
  });

  let url = `${SCRYFALL_SEARCH}?${params.toString()}`;
  const out: any[] = [];

  while (url) {
    const r = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
    if (!r.ok) throw new Error(`Scryfall error ${r.status}`);
    const body = await r.json();
    out.push(...(body.data || []));
    if (body.has_more && body.next_page) {
      url = body.next_page;
    } else {
      url = "";
    }
  }

  return out.map((c: any) => ({
    name: c.name as string,
    scryfall_uri: c.scryfall_uri as string,
    edhrec_rank: (c.edhrec_rank ?? null) as number | null,
    type_line: (c.type_line ?? "") as string,
    color_identity: colorIdentityStr(c.color_identity),
    image_url: pickImageUrl(c), // 👈 include image
  }));
}

function slugifyForEdhrec(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function fetchEdhrecDeckCount(name: string): Promise<{ url: string; deck_count: number | null }> {
  const now = Date.now();
  const cache = edhCache.get(name);
  if (cache && now - cache.ts < WEEK_MS) return { url: cache.url, deck_count: cache.deck_count };

  // Try EDHREC search to get canonical link
  let url = `${EDHREC_BASE}/commanders/${slugifyForEdhrec(name)}`;
  try {
    const sr = await fetch(`${EDHREC_BASE}/search?q=${encodeURIComponent(name)}`, {
      headers: { "User-Agent": UA },
      cache: "no-store",
    });
    if (sr.ok) {
      const html = await sr.text();
      const $ = cheerio.load(html);
      const link = $('a[href^="/commanders/"]').first();
      if (link && link.attr("href")) url = EDHREC_BASE + link.attr("href")!;
    }
  } catch {
    /* ignore */
  }

  // Polite delay
  await sleep(600);

  const r = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  if (r.status === 404) {
    edhCache.set(name, { url, deck_count: null, ts: now });
    return { url, deck_count: null };
  }
  if (!r.ok) throw new Error(`EDHREC error ${r.status}`);
  const html = await r.text();
  const $ = cheerio.load(html);

  let deckCount: number | null = null;

  // Search whole page text first
  const text = $.root().text();
  const m = text.match(/Decks?\s*([0-9][0-9,\.]*)/i);
  if (m) deckCount = parseInt(m[1].replace(/[,\.\s]/g, ""), 10);

  // Try some element/meta fallbacks
  if (deckCount == null) {
    const candidates = [
      $('meta[name="deck-count"]').attr("content"),
      $(".card-text-stats,.header-stats,.deck-count,.stat-decks").text(),
    ];
    for (const val of candidates) {
      if (!val) continue;
      const m2 = String(val).match(/([0-9][0-9,\.]*)/);
      if (m2) {
        deckCount = parseInt(m2[1].replace(/[,\.\s]/g, ""), 10);
        break;
      }
    }
  }

  edhCache.set(name, { url, deck_count: deckCount, ts: now });
  return { url, deck_count: deckCount };
}

function hipsterScore(rank: number | null, decks: number | null) {
  const r = rank ?? 999_999;
  const d = decks && decks > 0 ? decks : 1;
  return r / Math.max(1, Math.log1p(d));
}

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => ({}));
    const args = BodySchema.parse(json);

    const all = await fetchScryfall({
      colors: args.colors,
      colorMode: args.colorMode,
      queryExtra: args.queryExtra,
    });

    // Optional gate by Scryfall's (stale) edhrec_rank
    const pre = args.minRank ? all.filter((c) => (c.edhrec_rank ?? 0) >= args.minRank!) : all;

    // Fetch EDHREC deck counts (sequential to be polite)
    const results: any[] = [];
    for (const c of pre) {
      const info = await fetchEdhrecDeckCount(c.name);
      if (info.deck_count != null && info.deck_count > args.maxDecks) continue;
      results.push({
        ...c,
        edhrec_url: info.url,
        deck_count: info.deck_count,
        hipster_score: hipsterScore(c.edhrec_rank, info.deck_count),
      });

      // Early cutoff if we're already likely to have enough
      if (args.sort === "decks" && results.length >= args.limit * 3) break;
    }

    // Sort
    if (args.sort === "decks") {
      results.sort(
        (a, b) =>
          (a.deck_count ?? 1e12) - (b.deck_count ?? 1e12) ||
          (a.edhrec_rank ?? 1e12) - (b.edhrec_rank ?? 1e12),
      );
    } else if (args.sort === "rank") {
      results.sort((a, b) => (b.edhrec_rank ?? -1) - (a.edhrec_rank ?? -1));
    } else {
      results.sort((a, b) => (b.hipster_score ?? 0) - (a.hipster_score ?? 0));
    }

    return NextResponse.json({ ok: true, results: results.slice(0, args.limit) }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 400 });
  }
}
