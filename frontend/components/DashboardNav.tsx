'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from './LogoutButton';

const links = [
  { href: '/dashboard/profile', label: 'Profile' },
  { href: '/dashboard/products', label: 'Browse Products' },
  { href: '/dashboard/listings', label: 'My Listings' },
  { href: '/dashboard/messages', label: 'Messages' },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="text-xl font-bold text-blue-700">🧩 MakeItWhole</div>
      <div className="flex flex-wrap items-center gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`transition-colors ${
              pathname === link.href
                ? 'text-black font-semibold underline'
                : 'text-blue-600 hover:underline'
            }`}
          >
            {link.label}
          </Link>
        ))}
        <LogoutButton />
      </div>
    </nav>
  );
}
