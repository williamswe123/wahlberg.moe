'use client';

import {
  HomeIcon,
  SparklesIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  { name: 'About', href: '/dashboard', icon: HomeIcon },
  {
    name: 'Project Aurora',
    href: '/dashboard/project-aurora',
    icon: SparklesIcon,
  },
  {
    name: 'Project Meridian',
    href: '/dashboard/project-meridian',
    icon: RocketLaunchIcon,
  },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col space-y-2">
      {links.map((link) => {
        const LinkIcon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex h-[48px] items-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors md:h-12',
              {
                'bg-blue-600 text-white shadow': isActive,
                'bg-white text-slate-600 hover:bg-slate-100': !isActive,
              },
            )}
          >
            <LinkIcon className="w-5" />
            <span>{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
