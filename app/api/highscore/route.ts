import { NextResponse } from 'next/server';
import { pool } from '../../lib/db';

type HighscoreRow = {
  player_name: string;
  score: string;         // BIGINT -> string from pg
  updated_at: string;
  holder_token: string;
};

// GET: return current high score + holder token
export async function GET() {
  try {
    const { rows } = await pool.query<HighscoreRow>(
      `SELECT player_name, score, updated_at, holder_token
       FROM cookie_highscore WHERE id = 1`,
    );

    if (rows.length === 0) {
      return NextResponse.json({
        playerName: 'Nobody',
        score: 0,
        updatedAt: new Date().toISOString(),
        holderToken: '',
      });
    }

    const r = rows[0];
    return NextResponse.json({
      playerName: r.player_name,
      score: Number(r.score),
      updatedAt: r.updated_at,
      holderToken: r.holder_token,
    });
  } catch (error) {
    console.error('GET /api/highscore failed', error);
    return NextResponse.json({ error: 'Failed to fetch high score' }, { status: 500 });
  }
}

// POST: try to set high score if higher; requires token
// body: { token: string; score: number; playerName?: string }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = (body?.token ?? '').toString().trim();
    const scoreRaw = Number(body?.score);
    const nameRaw = (body?.playerName ?? '').toString().trim(); // optional

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
    if (!Number.isFinite(scoreRaw) || scoreRaw < 0) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    }

    // Only update if this score beats the current one.
    // If nameRaw is empty, keep existing name.
    const { rows } = await pool.query<HighscoreRow>(
      `
      UPDATE cookie_highscore
      SET
        player_name = COALESCE(NULLIF($1, ''), player_name),
        score       = $2,
        holder_token= $3,
        updated_at  = NOW()
      WHERE id = 1 AND score < $2
      RETURNING player_name, score, updated_at, holder_token
      `,
      [nameRaw.slice(0, 50), Math.floor(scoreRaw), token.slice(0, 100)],
    );

    if (rows.length === 0) {
      // Not higher → return current row
      const cur = await pool.query<HighscoreRow>(
        `SELECT player_name, score, updated_at, holder_token
         FROM cookie_highscore WHERE id = 1`,
      );
      const r = cur.rows[0];
      return NextResponse.json({
        updated: false,
        playerName: r.player_name,
        score: Number(r.score),
        updatedAt: r.updated_at,
        holderToken: r.holder_token,
      });
    }

    const r = rows[0];
    return NextResponse.json({
      updated: true,
      playerName: r.player_name,
      score: Number(r.score),
      updatedAt: r.updated_at,
      holderToken: r.holder_token,
    });
  } catch (error) {
    console.error('POST /api/highscore failed', error);
    return NextResponse.json({ error: 'Failed to update high score' }, { status: 500 });
  }
}
