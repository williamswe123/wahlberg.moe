import Link from 'next/link';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export function FloatingMailButton() {
  return (
    <Link
      href="mailto:wahlbergwille@gmail.com"
      aria-label="Email William"
      className="
        fixed bottom-4 left-4 z-50
        md:left-[1rem]  /* ~18rem sidebar width + 1rem gap */
        flex items-center justify-center gap-2
        rounded-xl border border-blue-100 bg-white px-4 py-3
        text-sm font-medium text-blue-600
        shadow-md transition
        hover:border-blue-200 hover:bg-blue-50
        focus:outline-none focus:ring-2 focus:ring-blue-300
      "
    >
      <span className="hidden md:inline">Let&apos;s collaborate</span>
      <EnvelopeIcon className="h-5 w-5" />
    </Link>
  );
}
