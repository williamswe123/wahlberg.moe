'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type HighScore = {
  playerName: string;
  score: number;
  updatedAt: string;
  holderToken: string;
};

export default function HighScoreBanner({ cookies }: { cookies: number }) {
  const [high, setHigh] = useState<HighScore>({
    playerName: 'Loading...',
    score: 0,
    updatedAt: new Date().toISOString(),
    holderToken: '',
  });

  // Player token (stable per browser)
  const [clientToken, setClientToken] = useState<string>('');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let t = localStorage.getItem('playerToken');
    if (!t) {
      t = crypto.randomUUID();
      localStorage.setItem('playerToken', t);
    }
    setClientToken(t);
  }, []);

  // Optional stored display name
  const [name, setName] = useState<string>('');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setName(localStorage.getItem('playerName') || '');
  }, []);

  const [showModal, setShowModal] = useState(false);
  const flooredCookies = useMemo(() => Math.floor(cookies), [cookies]);

  // track previous local score to detect "crossing"
  const prevLocalScoreRef = useRef<number>(flooredCookies);

  // remember last server-high threshold submitted for
  const [lastSubmittedHigh, setLastSubmittedHigh] = useState<number>(() => {
    if (typeof window === 'undefined') return -1;
    const v = sessionStorage.getItem('lastSubmittedHigh');
    return v ? Number(v) : -1;
  });

  const submittingRef = useRef(false);

  // Poll server
  useEffect(() => {
    let cancelled = false;
    const fetchHigh = async () => {
      try {
        const res = await fetch('/api/highscore', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setHigh(data);
      } catch { /* ignore */ }
    };
    fetchHigh();
    const t = setInterval(fetchHigh, 5000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  // Crossing logic
  useEffect(() => {
    if (!clientToken) return; // wait until token ready

    const prevLocal = prevLocalScoreRef.current;
    const currentLocal = flooredCookies;
    const serverHigh = high.score;

    const crossedNow = prevLocal <= serverHigh && currentLocal > serverHigh;

    if (
      crossedNow &&
      !submittingRef.current &&
      serverHigh > lastSubmittedHigh
    ) {
      // If we already hold the record, silently sync new higher score
      if (high.holderToken === clientToken) {
        submittingRef.current = true;
        (async () => {
          try {
            const res = await fetch('/api/highscore', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: clientToken,
                score: currentLocal,
                // no playerName → keep existing name
              }),
            });
            const data = await res.json();
            if (res.ok) {
              setHigh(data);
              setLastSubmittedHigh(serverHigh);
              sessionStorage.setItem('lastSubmittedHigh', String(serverHigh));
            }
          } finally {
            submittingRef.current = false;
          }
        })();
      } else {
        // Beating someone ELSE's record → ask for name once
        setShowModal(true);
      }
    }

    prevLocalScoreRef.current = currentLocal;
  }, [flooredCookies, high.score, high.holderToken, clientToken, lastSubmittedHigh]);

  // Claim handler (when beating someone else's high)
  const submitClaim = async () => {
    const playerName = (name || 'Anonymous').trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('playerName', playerName);
    }

    submittingRef.current = true;
    try {
      const res = await fetch('/api/highscore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: clientToken,
          score: flooredCookies,
          playerName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setHigh(data);
        setShowModal(false);
        // mark this server threshold as handled
        setLastSubmittedHigh(high.score);
        sessionStorage.setItem('lastSubmittedHigh', String(high.score));
      }
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <>
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">World High Score</p>
            <p className="text-xl font-semibold text-slate-900">
              {high.playerName}: {high.score.toLocaleString()}
            </p>
          </div>
          <div className="text-sm text-slate-500">
            Your score:{' '}
            <span className="font-medium text-slate-900">
              {flooredCookies.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Name Claim Modal (only when beating someone else's record) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              New High Score! 🎉
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              You scored {flooredCookies.toLocaleString()} — enter your name to claim it.
            </p>

            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={50}
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                onClick={submitClaim}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
