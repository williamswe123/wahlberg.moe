// app/saga/page.tsx
// Masonry-style collage that shows ONLY images from /public/saga (no text)
// Put your images into /public/saga and they will appear automatically.

import fs from 'node:fs';
import path from 'node:path';

export const metadata = {
  title: 'Drifting GP Japan 2024',
  description: 'Image gallery',
};

// If you want new files to appear without rebuilding, uncomment the line below:
// export const dynamic = 'force-dynamic';

const IMAGES_DIR = path.join(process.cwd(), 'public', 'driftgp');

function getImagePaths(): string[] {
  try {
    return fs
      .readdirSync(IMAGES_DIR)
      .filter((f) => /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((f) => `/driftgp/${f}`);
  } catch {
    return [];
  }
}

export default function SagaPage() {
  const images = getImagePaths();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* CSS masonry via multi-columns; preserves each image's aspect ratio */}
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4 [column-fill:_balance]">
        {images.map((src) => (
          <img
            key={src}
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            className="mb-4 inline-block w-full rounded-2xl border border-slate-200 shadow-sm"
            style={{ breakInside: 'avoid' }}
          />
        ))}
      </div>
    </main>
  );
}
