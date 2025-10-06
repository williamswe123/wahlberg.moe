import { SparklesIcon } from '@heroicons/react/24/solid';
import { lusitana } from '@/app/ui/fonts';

export default function AcmeLogo() {
  return (
    <div className={`${lusitana.className} flex flex-col gap-2 text-white`}>
      <div className="flex items-center gap-2 text-sm uppercase tracking-[0.35em]">
        <SparklesIcon className="h-5 w-5" />
        <span>Portfolio</span>
      </div>
      <p className="text-3xl font-semibold leading-none md:text-4xl">William Wahlberg</p>
    </div>
  );
}
