'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type HighScore = {
  playerName: string;
  score: number;
  updatedAt: string;
};

export default function HighScoreBanner({ cookies }: { cookies: number }) {
  const [high, setHigh] = useState<HighScore>({
    playerName: 'Loading...',
    score: 0,
    updatedAt: new Date().toISOString(),
  });

  const flooredCookies = useMemo(() => Math.floor(cookies), [cookies]);

  // track previous local score to detect "crossing the threshold"
  const prevLocalScoreRef = useRef<number>(flooredCookies);

  // remember which server high-score threshold we already submitted for
  const [lastSubmittedHigh, setLastSubmittedHigh] = useState<number>(() => {
    const v = sessionStorage.getItem('lastSubmittedHigh');
    return v ? Number(v) : -1;
  });

  // prevent double-submitting while a request is in-flight
  const submittingRef = useRef(false);

  // Poll server high score
  useEffect(() => {
    let cancelled = false;

    const fetchHigh = async () => {
      try {
        console.log("Checked the DB for high score!");
        const res = await fetch('/api/highscore', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setHigh(data);

      } catch {
        /* ignore */
      }
    };

    fetchHigh();
    const t = setInterval(fetchHigh, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // Detect crossing event and auto-claim once per threshold
  useEffect(() => {
    const prevLocal = prevLocalScoreRef.current;
    const currentLocal = flooredCookies;
    const serverHigh = high.score;

    // crossing happens only when we go from <= to >
    const crossedNow = prevLocal <= serverHigh && currentLocal > serverHigh;

    if (
      crossedNow &&
      !submittingRef.current &&
      // ensure we haven't already tried to submit for THIS server high
      serverHigh > lastSubmittedHigh
    ) {
      submittingRef.current = true;

      const playerName =
        (typeof window !== 'undefined' && localStorage.getItem('playerName')) ||
        'Anonymous';

      (async () => {
        try {
          const res = await fetch('/api/highscore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName, score: currentLocal }),
          });
          const data = await res.json();
          if (res.ok) {
            // Update banner immediately with server-confirmed value
            setHigh({
              playerName: data.playerName,
              score: data.score,
              updatedAt: data.updatedAt,
            });
            // Mark this threshold as handled so we don't re-submit
            setLastSubmittedHigh(serverHigh);
            sessionStorage.setItem('lastSubmittedHigh', String(serverHigh));
          }
        } finally {
          submittingRef.current = false;
        }
      })();
    }

    // update previous local score for next tick
    prevLocalScoreRef.current = currentLocal;
  }, [flooredCookies, high.score, lastSubmittedHigh]);

  return (
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
  );
}
