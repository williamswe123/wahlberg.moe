import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import AcmeLogo from '@/app/ui/acme-logo';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
export default function SideNav() {
  return (
    <div className="flex h-screen flex-col gap-6 px-3 py-4 md:px-2">
      {/* Logo link */}
      <Link
        className="flex h-20 items-end justify-start rounded-md bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white shadow md:h-40"
        href="/home/about"
      >
        <div className="w-full text-white md:w-40">
          <AcmeLogo />
        </div>
      </Link>

      {/* Navigation links only */}
      <div className="flex grow flex-col space-y-6">
        <NavLinks />
      </div>
    </div>
  );
}

