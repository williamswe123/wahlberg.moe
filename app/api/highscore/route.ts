import { NextResponse } from 'next/server';
import { pool } from '../../lib/db';

type HighscoreRow = {
  player_name: string;
  score: string; // BIGINT comes back as string from pg
  updated_at: string;
};

// GET: fetch current high score
export async function GET() {
  try {
    const { rows } = await pool.query<HighscoreRow>(
      'SELECT player_name, score, updated_at FROM cookie_highscore WHERE id = 1',
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { playerName: 'Nobody', score: 0, updatedAt: new Date().toISOString() },
        { status: 200 },
      );
    }

    const row = rows[0];
    return NextResponse.json({
      playerName: row.player_name,
      score: Number(row.score),
      updatedAt: row.updated_at,
    });
  } catch (error) {
    console.error('GET /api/highscore failed', error);
    return NextResponse.json(
      { error: 'Failed to fetch high score' },
      { status: 500 },
    );
  }
}

// POST: try to update high score if beaten
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nameRaw = (body?.playerName ?? '').toString().trim();
    const scoreRaw = Number(body?.score);

    if (!nameRaw) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!Number.isFinite(scoreRaw) || scoreRaw < 0) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    }

    // Only update if score is higher
    const { rows } = await pool.query<HighscoreRow>(
      `
      UPDATE cookie_highscore
      SET player_name = $1, score = $2, updated_at = NOW()
      WHERE id = 1 AND score < $2
      RETURNING player_name, score, updated_at
      `,
      [nameRaw.slice(0, 50), Math.floor(scoreRaw)],
    );

    if (rows.length === 0) {
      // No update → return current score
      const current = await pool.query<HighscoreRow>(
        'SELECT player_name, score, updated_at FROM cookie_highscore WHERE id = 1',
      );
      const r = current.rows[0];
      return NextResponse.json({
        updated: false,
        playerName: r.player_name,
        score: Number(r.score),
        updatedAt: r.updated_at,
      });
    }

    const r = rows[0];
    return NextResponse.json({
      updated: true,
      playerName: r.player_name,
      score: Number(r.score),
      updatedAt: r.updated_at,
    });
  } catch (error) {
    console.error('POST /api/highscore failed', error);
    return NextResponse.json(
      { error: 'Failed to update high score' },
      { status: 500 },
    );
  }
}
