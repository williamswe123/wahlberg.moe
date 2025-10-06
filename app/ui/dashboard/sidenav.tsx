import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import AcmeLogo from '@/app/ui/acme-logo';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export default function SideNav() {
  return (
    <div className="flex h-full flex-col gap-6 px-3 py-4 md:px-2">
      <Link
        className="flex h-20 items-end justify-start rounded-md bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white shadow md:h-40"
        href="/dashboard"
      >
        <div className="w-full text-white md:w-40">
          <AcmeLogo />
        </div>
      </Link>
      <div className="flex grow flex-col justify-between space-y-6">
        <NavLinks />
        <Link
          href="mailto:wahlbergwille@gmail.com"
          className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white p-3 text-sm font-medium text-blue-600 transition hover:border-blue-200 hover:bg-blue-50 md:justify-between"
        >
          <span className="hidden md:inline">Let&apos;s collaborate</span>
          <EnvelopeIcon className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
