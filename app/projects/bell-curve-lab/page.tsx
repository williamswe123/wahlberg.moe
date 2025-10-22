"use client";

import { useMemo, useState } from "react";

function computeShapeParameters(width: number, height: number) {
  const safeWidth = Math.max(1, width);
  const baseSigma = safeWidth / 6;
  const intensity = Math.max(0, height);
  const shapeStrength = 1 - Math.exp(-intensity / 180);
  const sigma = baseSigma / (1 + shapeStrength * 2.5);
  const uniformDensity = 1 / safeWidth;
  const gaussianNorm = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const peakDensity = uniformDensity * (1 - shapeStrength) + gaussianNorm * shapeStrength;

  return {
    shapeStrength,
    sigma,
    uniformDensity,
    gaussianNorm,
    peakDensity,
  };
}

type ShapeParameters = ReturnType<typeof computeShapeParameters>;

function evaluateDensityAt(x: number, mu: number, shape: ShapeParameters) {
  const gaussianDensity = shape.gaussianNorm * Math.exp(-0.5 * Math.pow((x - mu) / shape.sigma, 2));
  return shape.uniformDensity * (1 - shape.shapeStrength) + gaussianDensity * shape.shapeStrength;
}

function divideBellCurve(width: number, height: number, parts: number): number[] {
  if (parts < 2) {
    throw new Error("Parts must be at least 2.");
  }

  const mu = width / 2;
  const shape = computeShapeParameters(width, height);

  const resolution = Math.max(300, Math.floor(width));
  const step = width / resolution;

  const cdf: number[] = [];
  let cumulative = 0;
  for (let i = 0; i <= resolution; i++) {
    const x = i * step;
    const pdf = evaluateDensityAt(x, mu, shape);
    cumulative += pdf * step;
    cdf.push(cumulative);
  }

  const total = cdf[cdf.length - 1];
  if (total <= 0 || !Number.isFinite(total)) {
    throw new Error("Unable to compute curve divisions with the provided parameters.");
  }

  for (let i = 0; i < cdf.length; i++) {
    cdf[i] /= total;
  }

  const xs: number[] = [];
  let index = 0;
  for (let cut = 1; cut < parts; cut++) {
    const target = cut / parts;
    while (index < cdf.length && cdf[index] < target) {
      index++;
    }

    if (index >= cdf.length) {
      index = cdf.length - 1;
    }

    const prevValue = index === 0 ? 0 : cdf[index - 1];
    const nextValue = cdf[index];
    const prevX = index === 0 ? 0 : (index - 1) * step;
    const nextX = index * step;
    const span = nextValue - prevValue;
    const ratio = span <= 0 ? 0 : (target - prevValue) / span;
    const x = prevX + (nextX - prevX) * ratio;
    xs.push(x);
  }

  return xs;
}

const SEGMENT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#22c55e",
  "#f59e0b",
  "#0ea5e9",
  "#f97316",
  "#14b8a6",
];

const MIN_VISUAL_HEIGHT = 180;

export default function BellCurveLabPage() {
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(320);
  const [parts, setParts] = useState(5);

  const normalizedParts = Math.max(2, Math.round(parts));

  const { positions, error } = useMemo(() => {
    if (!Number.isFinite(width) || width <= 0) {
      return { positions: [] as number[], error: "Width must be greater than zero." };
    }
    if (!Number.isFinite(height) || height < 0) {
      return { positions: [] as number[], error: "Height cannot be negative." };
    }
    if (!Number.isFinite(parts) || parts < 2) {
      return { positions: [] as number[], error: "Parts must be at least 2." };
    }
    try {
      const cuts = divideBellCurve(width, height, normalizedParts);
      return { positions: cuts, error: null as string | null };
    } catch (err) {
      return { positions: [] as number[], error: err instanceof Error ? err.message : String(err) };
    }
  }, [width, height, parts, normalizedParts]);

  const mu = width / 2;
  const shape = useMemo(() => computeShapeParameters(width, height), [height, width]);
  const canvasHeight = Math.max(MIN_VISUAL_HEIGHT, Math.max(1, height));
  const amplitude = canvasHeight * 0.9;

  const boundaries = useMemo(() => [0, ...positions, width], [positions, width]);

  const curvePath = useMemo(() => {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height < 0) {
      return "";
    }
    const steps = 240;
    let d = `M 0 ${canvasHeight.toFixed(3)}`;
    for (let i = 0; i <= steps; i++) {
      const x = (width * i) / steps;
      const density = evaluateDensityAt(x, mu, shape);
      const normalised = shape.peakDensity > 0 ? density / shape.peakDensity : 0;
      const y = canvasHeight - amplitude * normalised;
      d += ` L ${x.toFixed(3)} ${y.toFixed(3)}`;
    }
    return d;
  }, [amplitude, canvasHeight, height, mu, shape, width]);

  const segmentPaths = useMemo(() => {
    if (boundaries.length < 2) return [] as { path: string; fill: string }[];
    const resolution = 40;
    return boundaries.slice(0, -1).map((start, index) => {
      const end = boundaries[index + 1];
      let d = `M ${start.toFixed(3)} ${canvasHeight.toFixed(3)}`;
      for (let i = 0; i <= resolution; i++) {
        const x = start + ((end - start) * i) / resolution;
        const density = evaluateDensityAt(x, mu, shape);
        const normalised = shape.peakDensity > 0 ? density / shape.peakDensity : 0;
        const y = canvasHeight - amplitude * normalised;
        d += ` L ${x.toFixed(3)} ${y.toFixed(3)}`;
      }
      d += ` L ${end.toFixed(3)} ${canvasHeight.toFixed(3)} Z`;
      return {
        path: d,
        fill: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
      };
    });
  }, [amplitude, boundaries, canvasHeight, mu, shape]);

  const divisionLines = useMemo(() => {
    return positions.map((x) => ({
      x,
      y:
        canvasHeight -
        amplitude *
          (shape.peakDensity > 0 ? evaluateDensityAt(x, mu, shape) / shape.peakDensity : 0),
    }));
  }, [amplitude, canvasHeight, mu, positions, shape]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Bell Curve Lab</h1>
        <p className="text-slate-600 max-w-2xl">
          Experiment with splitting a bell curve into equal-probability segments. Adjust the
          curve dimensions and the number of parts to see how the dividing points shift.
        </p>
      </div>

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Width</span>
          <input
            type="number"
            step={10}
            value={width}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (!Number.isFinite(next)) return;
              setWidth(next);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <span className="text-xs text-slate-500">Controls the horizontal spread of the curve.</span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Height</span>
          <input
            type="number"
            step={10}
            value={height}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (!Number.isFinite(next)) return;
              setHeight(next);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <span className="text-xs text-slate-500">
            Adjusts the vertical scale and how strongly the cuts cluster toward the centre.
            Zero keeps the cuts evenly spaced.
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Parts</span>
          <input
            type="number"
            min={2}
            max={12}
            step={1}
            value={parts}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (!Number.isFinite(next)) return;
              setParts(Math.max(2, Math.min(12, Math.round(next))));
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <span className="text-xs text-slate-500">How many equal areas to carve from the curve.</span>
        </label>
      </div>

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Bell Curve Visualisation</h2>
          <span className="text-sm text-slate-500">{normalizedParts} parts</span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!error && (
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${canvasHeight}`}
              className="w-full"
              height={canvasHeight}
              preserveAspectRatio="none"
            >
              <rect x={0} y={0} width={width} height={canvasHeight} fill="white" />
              {segmentPaths.map((segment, index) => (
                <path
                  key={`segment-${index}`}
                  d={segment.path}
                  fill={segment.fill}
                  fillOpacity={0.25}
                />
              ))}
              <path d={curvePath} stroke="#1e293b" strokeWidth={3} fill="none" />
              {divisionLines.map((line, index) => (
                <g key={`line-${index}`}>
                  <line
                    x1={line.x}
                    x2={line.x}
                    y1={canvasHeight}
                    y2={line.y}
                    stroke="#1e293b"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <circle cx={line.x} cy={line.y} r={4} fill="#1e293b" />
                </g>
              ))}
              <line x1={0} x2={width} y1={canvasHeight} y2={canvasHeight} stroke="#cbd5f5" strokeWidth={1} />
            </svg>
          </div>
        )}

        {!error && (
          <div className="space-y-3">
            <h3 className="text-base font-medium text-slate-900">Division points</h3>
            <ol className="grid gap-3 sm:grid-cols-2">
              {positions.map((value, index) => {
                const start = boundaries[index];
                const end = boundaries[index + 1];
                const portion = ((end - start) / width) * 100;
                return (
                  <li
                    key={`cut-${value}`}
                    className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <span className="text-sm font-semibold text-slate-700">Cut {index + 1}</span>
                    <span className="text-lg font-mono text-slate-900">
                      {value.toFixed(2)}
                      <span className="text-sm text-slate-500"> px from the left</span>
                    </span>
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      Segment width: {(end - start).toFixed(2)} px ({portion.toFixed(1)}%)
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
