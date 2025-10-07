// app/cv/page.tsx
const pdfPath = "/docs/William_Wahlberg_CV.pdf";

export const metadata = {
  title: "CV",
  description: "Embedded PDF viewer",
};

export default function CvPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Document</h1>
        <a
          href={pdfPath}
          download="William_Wahlberg_CV.pdf"
          className="rounded-md bg-blue-600 px-3 py-2 text-white text-sm font-medium hover:bg-blue-700"
        >
          Download
        </a>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-8">
        <iframe
          src={`${pdfPath}#view=FitH`}
          title="CV PDF"
          className="w-full h-[80vh] border-0 rounded-lg shadow-sm"
        />
        <p className="mt-3 text-sm text-slate-600">
          Can’t see the PDF?{" "}
          <a href={pdfPath} className="text-blue-600 underline">Open it in a new tab</a>.
        </p>
      </div>
    </main>
  );
}
