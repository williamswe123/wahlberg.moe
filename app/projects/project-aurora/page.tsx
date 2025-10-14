"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import * as ort from "onnxruntime-web";

/**
 * Next.js page: draw a digit with the mouse/touch, run ONNX model in browser.
 * Place your model at: public/models/mnist.onnx (28x28 grayscale expected)
 * Install: npm i onnxruntime-web
 */
export default function DigitPredictorPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const [session, setSession] = useState<ort.InferenceSession | null>(null);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [probs, setProbs] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const CANVAS_SIZE = 280; // large draw area for nicer UX
  const MODEL_INPUT = 28; // resize target

  // Stroke settings
  const strokeStyle = useMemo(
    () => ({ color: "#000000", lineWidth: 22, lineCap: "round" as const }),
    []
  );

  // Load ONNX model once on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const sess = await ort.InferenceSession.create("/models/mnist.onnx", {
          executionProviders: ["wasm"],
        });
        if (isMounted) setSession(sess);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Init the drawing canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // events
    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (e instanceof TouchEvent) {
        const t = e.touches[0] || e.changedTouches[0];
        return { x: t.clientX - rect.left, y: t.clientY - rect.top };
      } else {
        return { x: (e as MouseEvent).clientX - rect.left, y: (e as MouseEvent).clientY - rect.top };
      }
    };

    const start = (e: MouseEvent | TouchEvent) => {
      isDrawing.current = true;
      lastPos.current = getPos(e);
      e.preventDefault();
    };

    const move = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing.current) return;
      const pos = getPos(e);
      const last = lastPos.current;
      if (!pos || !last) return;
      ctx.strokeStyle = strokeStyle.color;
      ctx.lineWidth = strokeStyle.lineWidth;
      ctx.lineCap = strokeStyle.lineCap;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos.current = pos;
      e.preventDefault();
    };

    const end = (e: MouseEvent | TouchEvent) => {
      isDrawing.current = false;
      lastPos.current = null;
      e.preventDefault();
    };

    // Mouse
    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    // Touch
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
    };
  }, [strokeStyle]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setPrediction(null);
    setProbs(null);
  };

  // Convert drawing to 28x28 grayscale tensor (1,1,28,28)
  const getInputTensor = (): ort.Tensor | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // Downscale onto hidden preview canvas
    const p = (previewRef.current ||= document.createElement("canvas"));
    p.width = MODEL_INPUT;
    p.height = MODEL_INPUT;
    const pctx = p.getContext("2d");
    if (!pctx) return null;

    pctx.drawImage(canvas, 0, 0, MODEL_INPUT, MODEL_INPUT);
    const { data } = pctx.getImageData(0, 0, MODEL_INPUT, MODEL_INPUT);

    // MNIST models usually expect white background (0) and strokes as high values.
    // Convert RGBA -> single channel [0,1], invert so black stroke -> 1.0
    const input = new Float32Array(MODEL_INPUT * MODEL_INPUT);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const avg = (r + g + b) / 3; // 0..255
      const norm = 1 - avg / 255; // invert
      input[i / 4] = norm;
    }

    // (N,C,H,W) = (1,1,28,28)
    return new ort.Tensor("float32", input, [1, 1, MODEL_INPUT, MODEL_INPUT]);
  };

  const softmax = (arr: number[]) => {
    const m = Math.max(...arr);
    const exps = arr.map((x) => Math.exp(x - m));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((e) => e / sum);
  };

  const predict = async () => {
    if (!session) return;
    const input = getInputTensor();
    if (!input) return;

    try {
      const feeds: Record<string, ort.Tensor> = {};
      const inputName = session.inputNames[0];
      feeds[inputName] = input;

      const results = await session.run(feeds);
      const outputName = session.outputNames[0];
      const logits = Array.from(results[outputName].data as Float32Array);
      const probabilities = softmax(logits);
      const pred = probabilities.indexOf(Math.max(...probabilities));
      setPrediction(pred);
      setProbs(probabilities);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Handwritten Digit Predictor</h1>

      {loading && <p>Loading model…</p>}
      {error && (
        <p className="text-red-600 max-w-xl text-center">Error: {error}</p>
      )}

      <div className="flex flex-col md:flex-row items-start gap-6 w-full max-w-4xl">
        <div className="flex flex-col items-center gap-3">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="bg-white rounded-2xl shadow w-[280px] h-[280px] touch-none border border-slate-200"
          />
          <div className="flex gap-3">
            <button
              onClick={clearCanvas}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300"
            >
              Clear
            </button>
            <button
              onClick={predict}
              disabled={!session}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
            >
              Predict
            </button>
          </div>
        </div>

        <div className="flex-1 w-full">
          <div className="rounded-2xl bg-white shadow p-4">
            <h2 className="font-medium mb-2">Model Output</h2>
            {prediction === null ? (
              <p className="text-slate-600">Draw a digit and click Predict.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-lg">Prediction: <span className="font-semibold">{prediction}</span></p>
                {probs && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="py-1">Digit</th>
                        <th className="py-1">Probability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {probs.map((p, i) => (
                        <tr key={i}>
                          <td className="py-1">{i}</td>
                          <td className="py-1">
                            {(p * 100).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <details className="max-w-4xl w-full">
        <summary className="cursor-pointer select-none text-slate-600">Setup notes</summary>
        <div className="mt-2 text-sm text-slate-600 space-y-2">
          <p>
            1) <code>npm i onnxruntime-web</code>
          </p>
          <p>
            2) Export your PyTorch model to ONNX with input shape <code>(1,1,28,28)</code> (MNIST). Place the file at <code>public/models/mnist.onnx</code>.
          </p>
          <pre className="bg-slate-100 p-2 rounded">
{`# PyTorch -> ONNX (Python)
model.eval()
dummy = torch.randn(1, 1, 28, 28)
torch.onnx.export(
    model,
    dummy,
    "mnist.onnx",
    input_names=["input"],
    output_names=["logits"],
    dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
    opset_version=13,
)
# Move mnist.onnx to your Next.js project's public/models/`}
          </pre>
          <p>
            3) The page loads the model from <code>/models/mnist.onnx</code> at runtime and runs it entirely in the browser using WebAssembly.
          </p>
        </div>
      </details>
    </div>
  );
}
